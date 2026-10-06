package zygoo13.iot.mqtt;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.io.IOException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zygoo13.iot.entity.ActionHistory;
import zygoo13.iot.entity.Device;
import zygoo13.iot.repository.ActionHistoryRepository;
import zygoo13.iot.repository.DeviceRepository;
import zygoo13.iot.ws.RealtimePublisher.DeviceConfirmed;

@Service
public class DeviceStatusService {
    private final ObjectMapper json;
    private final ActionHistoryRepository histories;
    private final DeviceRepository devices;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher events;

    public DeviceStatusService(ObjectMapper json, ActionHistoryRepository histories,
                               DeviceRepository devices, EntityManager entityManager,
                               ApplicationEventPublisher events) {
        this.json = json;
        this.histories = histories;
        this.devices = devices;
        this.entityManager = entityManager;
        this.events = events;
    }

    @Transactional
    public void confirm(byte[] payload) {
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
        if (body == null || !body.isObject() || body.size() != 3
                || !body.has("requestId") || !body.has("deviceCode") || !body.has("status")
                || !body.get("requestId").isIntegralNumber()
                || !body.get("requestId").canConvertToLong()
                || !body.get("deviceCode").isTextual() || !body.get("status").isTextual()) {
            throw invalid("bad_fields");
        }
        long requestId = body.get("requestId").longValue();
        String deviceCode = body.get("deviceCode").textValue();
        String status = body.get("status").textValue();
        if (requestId < 1 || !(status.equals("ON") || status.equals("OFF"))) {
            throw invalid("bad_values");
        }

        ActionHistory history = histories.findById(requestId)
                .orElseThrow(() -> invalid("unknown_request"));
        Long deviceId = history.getDevice().getId();
        Device device = devices.findLockedById(deviceId)
                .orElseThrow(() -> invalid("unknown_device"));
        entityManager.refresh(history); // Recheck a confirmation committed while waiting for the Device lock.
        if (!device.getCode().equals(deviceCode)) {
            throw invalid("wrong_device");
        }
        if (history.getConfirmedAt() != null) {
            return; // Duplicate status must not change the first confirmation.
        }

        history.confirm(status);
        boolean changed = false;
        if (!histories.existsByDevice_IdAndIdGreaterThanAndConfirmedAtIsNotNull(deviceId, requestId)) {
            changed = !device.getStatus().equals(status);
            device.confirmStatus(status);
        }
        events.publishEvent(new DeviceConfirmed(requestId, deviceCode, device.getStatus(),
                status, history.getConfirmedAt(), changed));
    }

    private InvalidStatusException invalid(String reason) {
        return new InvalidStatusException(reason);
    }

    public static class InvalidStatusException extends RuntimeException {
        public InvalidStatusException(String reason) {
            super(reason);
        }
    }
}
