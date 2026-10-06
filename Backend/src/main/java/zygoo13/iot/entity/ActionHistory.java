package zygoo13.iot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "ActionHistory")
public class ActionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deviceId", nullable = false)
    private Device device;

    @Column(name = "action", nullable = false, length = 10)
    private String action;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "confirmedAt")
    private LocalDateTime confirmedAt;

    protected ActionHistory() {
    }

    public ActionHistory(User user, Device device, String action) {
        this.user = user;
        this.device = device;
        this.action = action;
        this.status = device.getStatus();
    }

    @PrePersist
    void beforeInsert() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Device getDevice() { return device; }
    public String getAction() { return action; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }

    public void confirm(String confirmedStatus) {
        status = confirmedStatus;
        confirmedAt = LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
    }
}
