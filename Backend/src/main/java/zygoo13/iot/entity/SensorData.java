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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "SensorData")
public class SensorData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensorId", nullable = false)
    private Sensor sensor;

    @Column(name = "value", nullable = false, precision = 12, scale = 4)
    private BigDecimal value;

    @Column(name = "recordedAt", nullable = false)
    private LocalDateTime recordedAt;

    protected SensorData() {
    }

    public SensorData(Sensor sensor, BigDecimal value) {
        this.sensor = sensor;
        this.value = value;
    }

    @PrePersist
    void beforeInsert() {
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        }
    }

    public Long getId() { return id; }
    public Sensor getSensor() { return sensor; }
    public BigDecimal getValue() { return value; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
}
