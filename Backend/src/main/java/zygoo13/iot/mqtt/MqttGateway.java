package zygoo13.iot.mqtt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import zygoo13.iot.mqtt.TelemetryService.InvalidTelemetryException;

@Component
public class MqttGateway implements MqttCallback {
    private static final Logger log = LoggerFactory.getLogger(MqttGateway.class);
    private static final String TELEMETRY_TOPIC = "iot/sensor/data";
    private static final String COMMAND_TOPIC = "iot/device/command";
    private static final String STATUS_TOPIC = "iot/device/status";

    private final MqttClient client;
    private final MqttConnectOptions options;
    private final TelemetryService telemetry;
    private final DeviceStatusService statuses;
    private final ObjectMapper json;
    private volatile boolean subscribed;
    private volatile boolean unavailableLogged;

    public MqttGateway(@Value("${iot.mqtt.uri}") String uri,
                               @Value("${iot.mqtt.client-id}") String clientId,
                               @Value("${iot.mqtt.username}") String username,
                               @Value("${iot.mqtt.password}") String password,
                               TelemetryService telemetry, DeviceStatusService statuses,
                               ObjectMapper json) throws MqttException {
        this.telemetry = telemetry;
        this.statuses = statuses;
        this.json = json;
        this.client = new MqttClient(uri, clientId, new MemoryPersistence());
        this.client.setCallback(this);
        this.options = new MqttConnectOptions();
        options.setCleanSession(true);
        options.setAutomaticReconnect(false);
        options.setConnectionTimeout(3);
        options.setKeepAliveInterval(15);
        if (!username.isBlank()) {
            options.setUserName(username);
            options.setPassword(password.toCharArray());
        }
    }

    @Scheduled(initialDelay = 1000, fixedDelay = 5000)
    public void ensureSubscribed() {
        try {
            if (!client.isConnected()) {
                subscribed = false;
                client.connect(options);
            }
            if (!subscribed) {
                client.subscribe(new String[] { TELEMETRY_TOPIC, STATUS_TOPIC }, new int[] { 0, 0 });
                subscribed = true;
                unavailableLogged = false;
                log.info("MQTT telemetry and device status subscribed");
            }
        } catch (MqttException error) {
            if (!unavailableLogged) {
                log.warn("MQTT telemetry unavailable; retrying in background");
                unavailableLogged = true;
            }
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        subscribed = false;
        if (!unavailableLogged) {
            log.warn("MQTT telemetry connection lost; retrying in background");
            unavailableLogged = true;
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        if (message.isRetained()) {
            return;
        }
        try {
            if (TELEMETRY_TOPIC.equals(topic)) {
                telemetry.store(message.getPayload());
            } else if (STATUS_TOPIC.equals(topic)) {
                statuses.confirm(message.getPayload());
            }
        } catch (InvalidTelemetryException error) {
            log.warn("MQTT telemetry ignored: {}", error.getMessage());
        } catch (DeviceStatusService.InvalidStatusException error) {
            log.warn("MQTT device status ignored: {}", error.getMessage());
        } catch (RuntimeException error) {
            log.error("MQTT message could not be stored");
        }
    }

    public void publishCommand(long requestId, String deviceCode, String action) throws MqttException {
        if (!client.isConnected() || !subscribed) {
            throw new MqttException(MqttException.REASON_CODE_CLIENT_NOT_CONNECTED);
        }
        byte[] payload;
        try {
            payload = json.writeValueAsBytes(new CommandPayload(requestId, deviceCode, action));
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Could not encode MQTT command");
        }
        MqttMessage message = new MqttMessage(payload);
        message.setQos(0);
        message.setRetained(false);
        client.publish(COMMAND_TOPIC, message);
    }

    private record CommandPayload(long requestId, String deviceCode, String action) { }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // MQTT QoS 0 commands do not use this delivery callback.
    }

    @PreDestroy
    public void close() {
        try {
            if (client.isConnected()) {
                client.disconnect();
            }
            client.close();
        } catch (MqttException error) {
            log.warn("MQTT telemetry client could not close cleanly");
        }
    }
}
