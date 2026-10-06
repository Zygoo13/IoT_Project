package zygoo13.iot.ws;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import zygoo13.iot.entity.ActionHistory;
import zygoo13.iot.entity.SensorData;
import zygoo13.iot.repository.ActionHistoryRepository;
import zygoo13.iot.repository.SensorDataRepository;

@Component
public class RealtimePublisher {
    private final SimpMessagingTemplate stomp;
    private final SensorDataRepository readings;
    private final ActionHistoryRepository histories;
    private final Set<Long> announcedTimeouts = new HashSet<>();
    private LocalDateTime lastSeen;
    private String hardwareStatus;
    private boolean ready;

    public RealtimePublisher(SimpMessagingTemplate stomp, SensorDataRepository readings,
                             ActionHistoryRepository histories) {
        this.stomp = stomp;
        this.readings = readings;
        this.histories = histories;
    }

    @EventListener(ApplicationReadyEvent.class)
    public synchronized void initialize() {
        lastSeen = readings.findFirstByOrderByRecordedAtDescIdDesc()
                .map(SensorData::getRecordedAt).orElse(null);
        hardwareStatus = statusAt(LocalDateTime.now(ZoneOffset.UTC));
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusSeconds(10);
        for (ActionHistory row : histories.findByConfirmedAtIsNullAndCreatedAtLessThanEqual(cutoff)) {
            announcedTimeouts.add(row.getId()); // Already timed out before this process started.
        }
        ready = true;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sensorStored(SensorStored event) {
        stomp.convertAndSend("/topic/sensors", new SensorEvent(event.id(), event.sensorCode(),
                event.sensorType(), event.value(), event.unit(), utc(event.recordedAt())));
        synchronized (this) {
            if (lastSeen == null || event.recordedAt().isAfter(lastSeen)) {
                lastSeen = event.recordedAt();
            }
            publishHardwareTransition(LocalDateTime.now(ZoneOffset.UTC));
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void deviceConfirmed(DeviceConfirmed event) {
        stomp.convertAndSend("/topic/devices", new DeviceEvent(event.requestId(),
                event.deviceCode(), event.status(), event.historyStatus(),
                utc(event.confirmedAt()), event.deviceStatusUpdated(), "CONFIRMED"));
    }

    @Scheduled(fixedDelay = 1000, initialDelay = 1000)
    public synchronized void checkHardware() {
        if (!ready) return;
        lastSeen = readings.findFirstByOrderByRecordedAtDescIdDesc()
                .map(SensorData::getRecordedAt).orElse(null);
        publishHardwareTransition(LocalDateTime.now(ZoneOffset.UTC));
    }

    @Scheduled(fixedDelay = 1000, initialDelay = 1000)
    @Transactional(readOnly = true)
    public synchronized void checkTimeouts() {
        if (!ready) return;
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusSeconds(10);
        for (ActionHistory row : histories.findByConfirmedAtIsNullAndCreatedAtLessThanEqual(cutoff)) {
            if (announcedTimeouts.add(row.getId())) {
                stomp.convertAndSend("/topic/notifications", new NotificationEvent(
                        "DEVICE_TIMEOUT", row.getId(), row.getDevice().getCode(),
                        utc(row.getCreatedAt().plusSeconds(10))));
            }
        }
    }

    private void publishHardwareTransition(LocalDateTime now) {
        String current = statusAt(now);
        if (hardwareStatus != null && !hardwareStatus.equals(current)) {
            stomp.convertAndSend("/topic/hardware", new HardwareEvent(current,
                    lastSeen == null ? null : utc(lastSeen)));
        }
        hardwareStatus = current;
    }

    private String statusAt(LocalDateTime now) {
        return lastSeen != null && !lastSeen.isBefore(now.minusSeconds(30)) ? "ONLINE" : "OFFLINE";
    }

    private static OffsetDateTime utc(LocalDateTime time) {
        return time.atOffset(ZoneOffset.UTC);
    }

    public record SensorStored(Long id, String sensorCode, String sensorType,
                               BigDecimal value, String unit, LocalDateTime recordedAt) { }
    public record DeviceConfirmed(Long requestId, String deviceCode, String status,
                                  String historyStatus, LocalDateTime confirmedAt,
                                  boolean deviceStatusUpdated) { }
    public record SensorEvent(Long id, String sensorCode, String sensorType,
                              BigDecimal value, String unit, OffsetDateTime recordedAt) { }
    public record HardwareEvent(String status, OffsetDateTime lastSeenAt) { }
    public record DeviceEvent(Long requestId, String deviceCode, String status,
                              String historyStatus, OffsetDateTime confirmedAt,
                              boolean deviceStatusUpdated, String deliveryState) { }
    public record NotificationEvent(String type, Long requestId, String deviceCode,
                                    OffsetDateTime occurredAt) { }
}
