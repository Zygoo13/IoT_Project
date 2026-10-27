package zygoo13.iot.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Devices", description = "Gửi lệnh LED qua MQTT; không tự xác nhận trạng thái.")
@RestController
public class DeviceCommandController {
    private final DeviceCommandService commands;

    public DeviceCommandController(DeviceCommandService commands) {
        this.commands = commands;
    }

    @Operation(summary = "Yêu cầu bật/tắt LED", description = "Mỗi yêu cầu hợp lệ tạo một ActionHistory, kể cả lệnh trùng. "
            + "202 không có nghĩa đèn đã đổi trạng thái. Sau 10 giây chưa xác nhận: TIMEOUT; xác nhận muộn vẫn được xử lý.")
    @ApiResponse(responseCode = "202", description = "Đã lưu yêu cầu và publish command tới broker",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Accepted.class)))
    @ApiResponse(responseCode = "404", description = "Device không tồn tại",
            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError")))
    @ApiResponse(responseCode = "503", description = "Lệnh đã lưu nhưng publish MQTT thất bại; lỗi có requestId",
            content = @Content(mediaType = "application/json", schema = @Schema(ref = "#/components/schemas/ApiError")))
    @PostMapping("/api/devices/{deviceId}/actions")
    public ResponseEntity<Accepted> request(@Parameter(description = "ID số của LED1/LED2, lấy từ GET /api/dashboard") @PathVariable long deviceId,
                                            @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
                                                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CommandRequest.class)))
                                            @RequestBody JsonNode body,
                                            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        if (body == null || !body.isObject() || body.size() != 1
                || !body.has("action") || !body.get("action").isTextual()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Body must contain only action");
        }
        String action = body.get("action").textValue();
        if (!"ON".equals(action) && !"OFF".equals(action)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Action must be ON or OFF");
        }
        long userId;
        try {
            userId = Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException error) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid token subject");
        }
        long requestId = commands.request(userId, deviceId, action);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new Accepted(requestId, "ACCEPTED"));
    }

    public record CommandRequest(@Schema(requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {"ON", "OFF"}) String action) { }

    public record Accepted(long requestId, String status) { }
}
