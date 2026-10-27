package zygoo13.iot.seed;

import jakarta.persistence.EntityManager;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import zygoo13.iot.entity.Device;
import zygoo13.iot.entity.Sensor;
import zygoo13.iot.entity.User;

@Component
public class SeedData implements ApplicationRunner {
    private final EntityManager entityManager;
    private final Environment environment;

    public SeedData(EntityManager entityManager, Environment environment) {
        this.entityManager = entityManager;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long users = count("User");
        if (users == 0) {
            User user = new User(
                    required("IOT_SEED_USERNAME"),
                    new BCryptPasswordEncoder().encode(required("IOT_SEED_PASSWORD")),
                    required("IOT_SEED_FULL_NAME"),
                    required("IOT_SEED_STUDENT_CODE"),
                    required("IOT_SEED_EMAIL"));
            entityManager.persist(user);
        }

        // Add the two local accounts once; never reset existing profiles or passwords.
        seedUser("user124", "Người dùng 2", "BTH4USER124", "user124@example.invalid");
        seedUser("user125", "Người dùng 3", "BTH4USER125", "user125@example.invalid");

        seedSensor("DHT11_TEMP", "Temperature Sensor", "TEMPERATURE", "°C");
        seedSensor("DHT11_HUM", "Humidity Sensor", "HUMIDITY", "%RH");
        seedSensor("LDR_LIGHT", "Light Sensor", "LIGHT", "lux");
        seedDevice("LED1");
        seedDevice("LED2");

        entityManager.flush();
        requireCount("Sensor", 3);
        requireCount("Device", 2);
    }

    private void seedUser(String username, String fullName, String studentCode, String email) {
        Long found = entityManager.createQuery(
                "select count(u) from User u where u.username = :username", Long.class)
                .setParameter("username", username)
                .getSingleResult();
        if (found == 0) {
            entityManager.persist(new User(username,
                    new BCryptPasswordEncoder().encode(required("IOT_SEED_PASSWORD")),
                    fullName, studentCode, email));
        }
    }

    private void seedSensor(String code, String name, String type, String unit) {
        Long found = entityManager.createQuery(
                "select count(s) from Sensor s where s.code = :code", Long.class)
                .setParameter("code", code)
                .getSingleResult();
        if (found == 0) {
            entityManager.persist(new Sensor(code, name, type, unit));
        }
    }

    private void seedDevice(String code) {
        Long found = entityManager.createQuery(
                "select count(d) from Device d where d.code = :code", Long.class)
                .setParameter("code", code)
                .getSingleResult();
        if (found == 0) {
            entityManager.persist(new Device(code, code));
        }
    }

    private long count(String entityName) {
        return entityManager.createQuery(
                "select count(e) from " + entityName + " e", Long.class)
                .getSingleResult();
    }

    private void requireCount(String entityName, long expected) {
        if (count(entityName) != expected) {
            throw new IllegalStateException("Unexpected row count in " + entityName);
        }
    }

    private String required(String name) {
        String value = environment.getProperty(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required environment variable: " + name);
        }
        return value;
    }
}
