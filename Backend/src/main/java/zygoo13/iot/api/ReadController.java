package zygoo13.iot.api;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReadController {
    private final ReadService reads;

    public ReadController(ReadService reads) {
        this.reads = reads;
    }

    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard() {
        return reads.dashboard();
    }

    @GetMapping("/api/sensor-data")
    public PageResponse<SensorRow> sensorData(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "TIME") String sortBy,
            @RequestParam(defaultValue = "DESC") String order) {
        return reads.sensorData(new TableQuery(page, size, searchField, search, from, to, sortBy, order));
    }

    @GetMapping("/api/action-history")
    public PageResponse<HistoryRow> actionHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String device,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "TIME") String sortBy,
            @RequestParam(defaultValue = "DESC") String order) {
        return reads.actionHistory(new TableQuery(page, size, searchField, search, from, to, sortBy, order),
                device, action, status);
    }

    public record TableQuery(int page, int size, String searchField, String search,
                             String from, String to, String sortBy, String order) { }

    public record PageResponse<T>(List<T> content, int page, int size,
                                  long totalElements, int totalPages) {
        public static <T> PageResponse<T> of(Page<T> result) {
            return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                    result.getTotalElements(), result.getTotalPages());
        }
    }

    public record DashboardResponse(Map<String, LatestReading> latest,
                                    Map<String, List<ChartPoint>> chart,
                                    Hardware hardware, List<DeviceRow> devices) { }
    public record LatestReading(String sensorCode, BigDecimal value, String unit,
                                OffsetDateTime recordedAt, boolean stale) { }
    public record ChartPoint(BigDecimal value, OffsetDateTime recordedAt) { }
    public record Hardware(String status, OffsetDateTime lastSeenAt) { }
    public record DeviceRow(Long id, String code, String status) { }
    public record SensorRow(Long id, String sensorCode, String sensorType,
                            BigDecimal value, String unit, OffsetDateTime recordedAt) { }
    public record HistoryRow(Long id, Long deviceId, String deviceCode,
                             String action, String status, OffsetDateTime createdAt,
                             OffsetDateTime confirmedAt, String deliveryState) { }
}
