package zygoo13.iot.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeviceCommandController {
    private final DeviceCommandService commands;

    public DeviceCommandController(DeviceCommandService commands) {
        this.commands = commands;
    }

    @PostMapping("/api/devices/{deviceId}/actions")
    public ResponseEntity<Accepted> request(@PathVariable long deviceId,
                                            @RequestBody JsonNode body,
                                            @AuthenticationPrincipal Jwt jwt) {
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

    public record Accepted(long requestId, String status) { }
}
