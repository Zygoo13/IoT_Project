package zygoo13.iot.api;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zygoo13.iot.api.ProfileController.ProfileResponse;
import zygoo13.iot.api.ProfileController.ProfileUpdate;
import zygoo13.iot.entity.User;
import zygoo13.iot.repository.UserRepository;

@Service
public class ProfileService {
    private final UserRepository users;

    public ProfileService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(String subject) {
        return response(findUser(subject));
    }

    @Transactional
    public ProfileResponse update(String subject, ProfileUpdate request) {
        User user = findUser(subject);
        String name = request.fullName().trim();
        String studentCode = request.studentCode().trim();
        String email = request.email().trim();
        if (users.existsByStudentCodeAndIdNot(studentCode, user.getId())
                || users.existsByEmailAndIdNot(email, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_PROFILE", "Email or student code already exists");
        }
        user.updateProfile(name, studentCode, email,
                checkedUrl(request.githubUrl(), false),
                checkedUrl(request.figmaUrl(), false),
                checkedUrl(request.apiDocsUrl(), false),
                checkedUrl(request.reportUrl(), false),
                checkedUrl(request.avatarUrl(), true));
        users.saveAndFlush(user);
        return response(user);
    }

    private User findUser(String subject) {
        Long id;
        try {
            id = Long.valueOf(subject);
        } catch (NumberFormatException error) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid token subject");
        }
        return users.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "User no longer exists"));
    }

    private String checkedUrl(String value, boolean httpsOnly) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String url = value.trim();
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || uri.getUserInfo() != null
                    || !(httpsOnly ? "https".equalsIgnoreCase(scheme)
                                  : "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))) {
                throw new URISyntaxException(url, "Invalid URL");
            }
            return url;
        } catch (URISyntaxException error) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Invalid profile URL");
        }
    }

    private ProfileResponse response(User user) {
        return new ProfileResponse(user.getId(), user.getUsername(), user.getFullName(),
                user.getStudentCode(), user.getEmail(), user.getGithubUrl(), user.getFigmaUrl(),
                user.getApiDocsUrl(), user.getReportUrl(), user.getAvatarUrl(),
                user.getCreatedAt().atOffset(ZoneOffset.UTC),
                user.getUpdatedAt().atOffset(ZoneOffset.UTC));
    }
}
