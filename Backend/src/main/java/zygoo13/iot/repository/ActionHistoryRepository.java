package zygoo13.iot.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import zygoo13.iot.entity.ActionHistory;

public interface ActionHistoryRepository extends JpaRepository<ActionHistory, Long>,
        JpaSpecificationExecutor<ActionHistory> {
    @Override
    @EntityGraph(attributePaths = {"user", "device"})
    Page<ActionHistory> findAll(Specification<ActionHistory> specification, Pageable pageable);

    boolean existsByDevice_IdAndIdGreaterThanAndConfirmedAtIsNotNull(Long deviceId, Long id);
    List<ActionHistory> findByConfirmedAtIsNullAndCreatedAtLessThanEqual(LocalDateTime cutoff);
}
