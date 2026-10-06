package zygoo13.iot.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import zygoo13.iot.entity.Sensor;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    Optional<Sensor> findByCode(String code);
}
