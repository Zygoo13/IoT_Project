package zygoo13.iot.api;

import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import zygoo13.iot.entity.ActionHistory;
import zygoo13.iot.entity.Device;
import zygoo13.iot.entity.User;
import zygoo13.iot.mqtt.MqttGateway;
import zygoo13.iot.repository.ActionHistoryRepository;
import zygoo13.iot.repository.DeviceRepository;
import zygoo13.iot.repository.UserRepository;

@Service
public class DeviceCommandService {
    private final TransactionTemplate transactions;
    private final DeviceRepository devices;
    private final UserRepository users;
    private final ActionHistoryRepository histories;
    private final MqttGateway mqtt;

    public DeviceCommandService(TransactionTemplate transactions, DeviceRepository devices,
                                UserRepository users, ActionHistoryRepository histories,
                                MqttGateway mqtt) {
        this.transactions = transactions;
        this.devices = devices;
        this.users = users;
        this.histories = histories;
        this.mqtt = mqtt;
    }

    // One backend process publishes commands in the same order as their history IDs.
    public synchronized long request(long userId, long deviceId, String action) {
        Command command = transactions.execute(ignored -> createHistory(userId, deviceId, action));
        try {
            mqtt.publishCommand(command.id(), command.deviceCode(), action);
        } catch (MqttException error) {
            // The committed history remains unconfirmed so the caller can track its requestId.
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MQTT_PUBLISH_FAILED",
                    "Command saved but MQTT publish failed", command.id());
        }
        return command.id();
    }

    private Command createHistory(long userId, long deviceId, String action) {
        Device device = devices.findLockedById(deviceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "DEVICE_NOT_FOUND", "Device not found"));
        if (!device.isActive() || !"LED".equals(device.getType())
                || !("LED1".equals(device.getCode()) || "LED2".equals(device.getCode()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DEVICE", "Device is not an active LED");
        }
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "UNAUTHORIZED", "User no longer exists"));
        ActionHistory history = histories.saveAndFlush(new ActionHistory(user, device, action));
        return new Command(history.getId(), device.getCode());
    }

    private record Command(long id, String deviceCode) { }
}
