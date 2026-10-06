package zygoo13.iot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "User")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "passwordHash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "fullName", nullable = false, length = 100)
    private String fullName;

    @Column(name = "studentCode", nullable = false, unique = true, length = 30)
    private String studentCode;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "githubUrl", length = 500)
    private String githubUrl;

    @Column(name = "figmaUrl", length = 500)
    private String figmaUrl;

    @Column(name = "apiDocsUrl", length = 500)
    private String apiDocsUrl;

    @Column(name = "reportUrl", length = 500)
    private String reportUrl;

    @Column(name = "avatarUrl", length = 500)
    private String avatarUrl;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt;

    protected User() {
    }

    public User(String username, String passwordHash, String fullName,
                String studentCode, String email) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.studentCode = studentCode;
        this.email = email;
    }

    @PrePersist
    void beforeInsert() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = createdAt;
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public String getStudentCode() { return studentCode; }
    public String getEmail() { return email; }
    public String getGithubUrl() { return githubUrl; }
    public String getFigmaUrl() { return figmaUrl; }
    public String getApiDocsUrl() { return apiDocsUrl; }
    public String getReportUrl() { return reportUrl; }
    public String getAvatarUrl() { return avatarUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void updateProfile(String fullName, String studentCode, String email,
                              String githubUrl, String figmaUrl, String apiDocsUrl,
                              String reportUrl, String avatarUrl) {
        this.fullName = fullName;
        this.studentCode = studentCode;
        this.email = email;
        this.githubUrl = githubUrl;
        this.figmaUrl = figmaUrl;
        this.apiDocsUrl = apiDocsUrl;
        this.reportUrl = reportUrl;
        this.avatarUrl = avatarUrl;
    }
}
