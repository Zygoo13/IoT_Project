package zygoo13.iot.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import zygoo13.iot.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByStudentCodeAndIdNot(String studentCode, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
}
