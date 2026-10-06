package zygoo13.iot.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profiles;

    public ProfileController(ProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return profiles.get(jwt.getSubject());
    }

    @PutMapping
    public ProfileResponse update(@AuthenticationPrincipal Jwt jwt,
                                  @Valid @RequestBody ProfileUpdate request) {
        return profiles.update(jwt.getSubject(), request);
    }

    public record ProfileUpdate(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "[A-Za-z0-9]{1,30}") String studentCode,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 500) String githubUrl,
            @Size(max = 500) String figmaUrl,
            @Size(max = 500) String apiDocsUrl,
            @Size(max = 500) String reportUrl,
            @Size(max = 500) String avatarUrl) { }

    public record ProfileResponse(Long id, String username, String fullName, String studentCode,
                                  String email, String githubUrl, String figmaUrl,
                                  String apiDocsUrl, String reportUrl, String avatarUrl,
                                  OffsetDateTime createdAt, OffsetDateTime updatedAt) { }
}
