package zygoo13.iot.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Data", description = "Dashboard và dữ liệu cảm biến")
@RestController
public class ReadController {
    private final ReadService reads;

    public ReadController(ReadService reads) {
        this.reads = reads;
    }

    @Operation(summary = "Tải trạng thái Dashboard", description = "Mỗi cảm biến có tối đa 15 điểm gần nhất. DB rỗng: latest null, chart rỗng. ONLINE khi có telemetry hợp lệ trong 30 giây; Offline không đổi LED.")
    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard() {
        return reads.dashboard();
    }

    @Operation(summary = "Tra cứu dữ liệu cảm biến", description = "Search → Filter → Sort → Pagination tại DB. sensorType kết hợp với search. TIME nhận yyyy-MM-dd (ngày UTC) hoặc ISO có offset; tìm chung nhận dd/MM/yyyy theo giờ Việt Nam.")
    @GetMapping("/api/sensor-data")
    public PageResponse<SensorRow> sensorData(
            @Parameter(schema = @Schema(allowableValues = {"TEMPERATURE", "HUMIDITY", "LIGHT"})) @RequestParam(required = false) String sensorType,
            @Parameter(description = "Trang bắt đầu từ 0", schema = @Schema(minimum = "0")) @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số dòng mỗi trang", schema = @Schema(minimum = "1", maximum = "20")) @RequestParam(defaultValue = "20") int size,
            @Parameter(schema = @Schema(allowableValues = {"ALL", "ID", "SENSOR_TYPE", "VALUE", "TIME"})) @RequestParam(required = false) String searchField,
            @Parameter(description = "Từ khóa; searchField chỉ có ý nghĩa khi search không rỗng") @RequestParam(required = false) String search,
            @Parameter(description = "Từ thời điểm ISO 8601 có offset, bao gồm đầu mút", example = "2026-10-20T00:00:00Z") @RequestParam(required = false) String from,
            @Parameter(description = "Đến thời điểm ISO 8601 có offset; from phải ≤ to", example = "2026-10-20T23:59:59Z") @RequestParam(required = false) String to,
            @Parameter(schema = @Schema(allowableValues = {"ID", "SENSOR_TYPE", "VALUE", "TIME"})) @RequestParam(defaultValue = "TIME") String sortBy,
            @Parameter(schema = @Schema(allowableValues = {"ASC", "DESC"})) @RequestParam(defaultValue = "DESC") String order) {
        return reads.sensorData(new TableQuery(page, size, searchField, search, from, to, sortBy, order), sensorType);
    }

    @Operation(summary = "Tra cứu lịch sử điều khiển", description = "username là tài khoản thực hiện từng lệnh, lấy từ User của ActionHistory. Action là lệnh yêu cầu; status là trạng thái ghi nhận. deliveryState suy ra PENDING / TIMEOUT / CONFIRMED; PROCESSING lọc PENDING dưới 10 giây, không là giá trị status trong DB.")
    @GetMapping("/api/action-history")
    public PageResponse<HistoryRow> actionHistory(
            @Parameter(description = "Trang bắt đầu từ 0", schema = @Schema(minimum = "0")) @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số dòng mỗi trang", schema = @Schema(minimum = "1", maximum = "20")) @RequestParam(defaultValue = "20") int size,
            @Parameter(schema = @Schema(allowableValues = {"ALL", "ID", "DEVICE"})) @RequestParam(required = false) String searchField,
            @Parameter(description = "Từ khóa; searchField chỉ có ý nghĩa khi search không rỗng") @RequestParam(required = false) String search,
            @Parameter(schema = @Schema(allowableValues = {"LED1", "LED2"})) @RequestParam(required = false) String device,
            @Parameter(schema = @Schema(allowableValues = {"ON", "OFF"})) @RequestParam(required = false) String action,
            @Parameter(schema = @Schema(allowableValues = {"ON", "OFF", "PROCESSING"})) @RequestParam(required = false) String status,
            @Parameter(description = "Từ thời điểm ISO 8601 có offset, bao gồm đầu mút", example = "2026-10-20T00:00:00Z") @RequestParam(required = false) String from,
            @Parameter(description = "Đến thời điểm ISO 8601 có offset; from phải ≤ to", example = "2026-10-20T23:59:59Z") @RequestParam(required = false) String to,
            @Parameter(schema = @Schema(allowableValues = {"ID", "DEVICE", "ACTION", "STATUS", "TIME"})) @RequestParam(defaultValue = "TIME") String sortBy,
            @Parameter(schema = @Schema(allowableValues = {"ASC", "DESC"})) @RequestParam(defaultValue = "DESC") String order) {
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

    public record DashboardResponse(
            @Schema(description = "Ba key cố định theo Sensor.code. Giá trị null nếu chưa có reading.",
                    example = "{\"DHT11_TEMP\":null,\"DHT11_HUM\":null,\"LDR_LIGHT\":null}")
            Map<String, LatestReading> latest,
            @Schema(description = "Tối đa 15 điểm mỗi cảm biến, sắp xếp thời gian tăng dần.",
                    example = "{\"DHT11_TEMP\":[],\"DHT11_HUM\":[],\"LDR_LIGHT\":[]}")
            Map<String, List<ChartPoint>> chart,
                                    Hardware hardware, List<DeviceRow> devices, @Schema(deprecated = true, description = "Luôn false; giữ tương thích client BTH3, responder mô phỏng đã gỡ.") boolean ledDemo) { }
    public record LatestReading(String sensorCode, BigDecimal value, String unit,
                                OffsetDateTime recordedAt, boolean stale) { }
    public record ChartPoint(BigDecimal value, OffsetDateTime recordedAt) { }
    public record Hardware(@Schema(allowableValues = {"ONLINE", "OFFLINE"}) String status,
                           @Schema(nullable = true, description = "Mốc reading hợp lệ cuối, UTC.") OffsetDateTime lastSeenAt) { }
    public record DeviceRow(Long id, @Schema(allowableValues = {"LED1", "LED2"}) String code,
                            @Schema(allowableValues = {"ON", "OFF"}, description = "Trạng thái đã xác nhận gần nhất.") String status) { }
    public record SensorRow(Long id, String sensorCode, String sensorType,
                            BigDecimal value, String unit, OffsetDateTime recordedAt) { }
    public record HistoryRow(Long id, Long deviceId, String deviceCode,
                             @Schema(description = "Username của người đã thực hiện lệnh, không phải người đang xem lịch sử.") String username,
                             String action, String status, OffsetDateTime createdAt,
                             @Schema(description = "Null khi chưa có xác nhận, kể cả TIMEOUT.", nullable = true) OffsetDateTime confirmedAt,
                             @Schema(allowableValues = {"PENDING", "TIMEOUT", "CONFIRMED"}) String deliveryState) { }
}
