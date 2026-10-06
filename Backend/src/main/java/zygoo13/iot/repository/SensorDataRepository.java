package zygoo13.iot.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import zygoo13.iot.entity.SensorData;

public interface SensorDataRepository extends JpaRepository<SensorData, Long>,
        JpaSpecificationExecutor<SensorData> {
    List<SensorData> findTop15BySensor_CodeOrderByRecordedAtDescIdDesc(String code);
    Optional<SensorData> findFirstByOrderByRecordedAtDescIdDesc();
}
