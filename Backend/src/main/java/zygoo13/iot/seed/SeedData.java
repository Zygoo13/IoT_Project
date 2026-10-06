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
        } else if (users != 1) {
            throw new IllegalStateException("Expected exactly one User");
        }

        seedSensor("DHT11_TEMP", "Temperature Sensor", "TEMPERATURE", "°C");
        seedSensor("DHT11_HUM", "Humidity Sensor", "HUMIDITY", "%RH");
        seedSensor("LDR_LIGHT", "Light Sensor", "LIGHT", "lux");
        seedDevice("LED1");
        seedDevice("LED2");

        entityManager.flush();
        requireCount("User", 1);
        requireCount("Sensor", 3);
        requireCount("Device", 2);
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
