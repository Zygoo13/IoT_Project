package zygoo13.iot.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import zygoo13.iot.entity.ActionHistory;

public interface ActionHistoryRepository extends JpaRepository<ActionHistory, Long>,
        JpaSpecificationExecutor<ActionHistory> {
    boolean existsByDevice_IdAndIdGreaterThanAndConfirmedAtIsNotNull(Long deviceId, Long id);
    List<ActionHistory> findByConfirmedAtIsNullAndCreatedAtLessThanEqual(LocalDateTime cutoff);
}
