package zygoo13.iot.mqtt;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import zygoo13.iot.entity.Sensor;
import zygoo13.iot.entity.SensorData;
import zygoo13.iot.repository.SensorDataRepository;
import zygoo13.iot.repository.SensorRepository;
import zygoo13.iot.ws.RealtimePublisher.SensorStored;

@Service
public class TelemetryService {
    private static final BigDecimal DATABASE_LIMIT = new BigDecimal("100000000");
    private static final BigDecimal MAX_HUMIDITY = new BigDecimal("100");

    private final ObjectMapper json;
    private final SensorRepository sensors;
    private final SensorDataRepository readings;
    private final ApplicationEventPublisher events;

    public TelemetryService(ObjectMapper json, SensorRepository sensors,
                            SensorDataRepository readings, ApplicationEventPublisher events) {
        this.json = json;
        this.sensors = sensors;
        this.readings = readings;
        this.events = events;
    }

    @Transactional
    public void store(byte[] payload) {
        if (payload.length == 0 || payload.length > 256) {
            throw invalid("payload_size");
        }
        JsonNode body;
        try (JsonParser parser = json.getFactory().createParser(payload)) {
            parser.enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION);
            body = json.readTree(parser);
            if (parser.nextToken() != null) {
                throw invalid("trailing_json");
            }
        } catch (IOException error) {
            throw invalid("bad_json");
        }
        if (body == null || !body.isObject() || body.size() != 2
                || !body.has("sensorCode") || !body.has("value")
                || !body.get("sensorCode").isTextual() || !body.get("value").isNumber()) {
            throw invalid("bad_fields");
        }

        String code = body.get("sensorCode").textValue();
        if (code.isBlank() || code.length() > 30) {
            throw invalid("bad_sensor_code");
        }
        JsonNode number = body.get("value");
        if (!Double.isFinite(number.doubleValue())) {
            throw invalid("non_finite_value");
        }
        BigDecimal raw = number.decimalValue();
        if (raw.abs().compareTo(DATABASE_LIMIT) >= 0) {
            throw invalid("value_out_of_range");
        }
        BigDecimal value = raw.setScale(4, RoundingMode.HALF_UP);
        if (value.abs().compareTo(DATABASE_LIMIT) >= 0) {
            throw invalid("value_out_of_range");
        }

        Sensor sensor = sensors.findByCode(code).orElseThrow(() -> invalid("unknown_sensor"));
        if (!sensor.isActive()) {
            throw invalid("inactive_sensor");
        }
        if ("HUMIDITY".equals(sensor.getType())
                && (value.signum() < 0 || value.compareTo(MAX_HUMIDITY) > 0)) {
            throw invalid("humidity_out_of_range");
        }
        if ("LIGHT".equals(sensor.getType()) && value.signum() < 0) {
            throw invalid("light_out_of_range");
        }
        SensorData saved = readings.saveAndFlush(new SensorData(sensor, value));
        events.publishEvent(new SensorStored(saved.getId(), sensor.getCode(), sensor.getType(),
                saved.getValue(), sensor.getUnit(), saved.getRecordedAt()));
    }

    private InvalidTelemetryException invalid(String reason) {
        return new InvalidTelemetryException(reason);
    }

    public static class InvalidTelemetryException extends RuntimeException {
        public InvalidTelemetryException(String reason) {
            super(reason);
        }
    }
}
