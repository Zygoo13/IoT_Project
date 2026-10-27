package zygoo13.iot.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import zygoo13.iot.entity.User;
import zygoo13.iot.mqtt.MqttGateway;
import zygoo13.iot.repository.ActionHistoryRepository;
import zygoo13.iot.repository.DeviceRepository;
import zygoo13.iot.repository.UserRepository;
import zygoo13.iot.seed.SeedData;

// Isolated H2 database and mocked MQTT: these tests never publish to real hardware.
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:history-users",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
@Import(ReadService.class)
class HistoryUsersIntegrationTest {
    @Autowired EntityManager entityManager;
    @Autowired UserRepository users;
    @Autowired DeviceRepository devices;
    @Autowired ActionHistoryRepository history;
    @Autowired ReadService reads;
    @Autowired PlatformTransactionManager transactionManager;

    private SeedData seed;
    private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void seedAccounts() {
        seed = new SeedData(entityManager, new MockEnvironment()
                .withProperty("IOT_SEED_USERNAME", "user123")
                .withProperty("IOT_SEED_PASSWORD", "test-only-password")
                .withProperty("IOT_SEED_FULL_NAME", "Original user")
                .withProperty("IOT_SEED_STUDENT_CODE", "ORIGINAL123")
                .withProperty("IOT_SEED_EMAIL", "original@example.invalid"));
        seed.run(new DefaultApplicationArguments());
    }

    @Test
    void repeatedStartupKeepsThreeAccountsAndOriginalProfiles() {
        User original = users.findByUsername("user123").orElseThrow();
        Long originalId = original.getId();
        String originalHash = original.getPasswordHash();
        original.updateProfile("Updated name", "UPDATED123", "updated@example.invalid",
                null, null, null, null, null);
        entityManager.flush();

        seed.run(new DefaultApplicationArguments());
        seed.run(new DefaultApplicationArguments());

        assertThat(users.count()).isEqualTo(3);
        assertThat(users.findAll()).extracting(User::getUsername)
                .containsExactlyInAnyOrder("user123", "user124", "user125");
        assertThat(original.getId()).isEqualTo(originalId);
        assertThat(original.getPasswordHash()).isEqualTo(originalHash);
        assertThat(original.getFullName()).isEqualTo("Updated name");
        assertThat(original.getStudentCode()).isEqualTo("UPDATED123");
        assertThat(original.getEmail()).isEqualTo("updated@example.invalid");
        assertThat(users.findAll()).allSatisfy(user ->
                assertThat(new BCryptPasswordEncoder().matches(
                        "test-only-password", user.getPasswordHash())).isTrue());
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertThat(users.findAll()).allSatisfy(user -> assertThat(factory.getValidator().validate(
                    new ProfileController.ProfileUpdate(user.getFullName(), user.getStudentCode(),
                            user.getEmail(), null, null, null, null, null))).isEmpty());
        }
        assertThat(history.count()).isZero();
    }

    @Test
    void threeAuthenticatedActorsKeepCorrectUsernamesAcrossPagesAndFilters() throws Exception {
        MqttGateway mqtt = mock(MqttGateway.class);
        DeviceCommandService commands = new DeviceCommandService(new TransactionTemplate(transactionManager),
                devices, users, history, mqtt);
        DeviceCommandController controller = new DeviceCommandController(commands);
        long deviceId = devices.findAllByOrderByCodeAsc().get(0).getId();
        Map<Long, String> expectedActors = new LinkedHashMap<>();

        for (String username : new String[]{"user123", "user124", "user125"}) {
            User actor = users.findByUsername(username).orElseThrow();
            Jwt jwt = Jwt.withTokenValue("test-token").header("alg", "HS256")
                    .subject(actor.getId().toString()).build();
            var response = controller.request(deviceId, json.readTree("{\"action\":\"ON\"}"), jwt);
            assertThat(response.getStatusCode().value()).isEqualTo(202);
            long requestId = response.getBody().requestId();
            expectedActors.put(requestId, username);
            verify(mqtt).publishCommand(requestId, "LED1", "ON");
        }
        entityManager.flush();
        entityManager.clear();

        var first = reads.actionHistory(query(0, 2, null, null), "LED1", "ON", null);
        var second = reads.actionHistory(query(1, 2, null, null), "LED1", "ON", null);
        assertThat(first.totalElements()).isEqualTo(3);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.content()).hasSize(2);
        assertThat(second.content()).hasSize(1);
        assertThat(first.content()).extracting(ReadController.HistoryRow::username)
                .containsExactly("user125", "user124");
        assertThat(second.content()).extracting(ReadController.HistoryRow::username)
                .containsExactly("user123");

        for (var entry : expectedActors.entrySet()) {
            var page = reads.actionHistory(query(0, 5, "ID", entry.getKey().toString()), null, null, null);
            assertThat(page.totalElements()).isEqualTo(1);
            var row = page.content().get(0);
            assertThat(row.username()).isEqualTo(entry.getValue());
            assertThat(row.deviceCode()).isEqualTo("LED1");
            assertThat(row.action()).isEqualTo("ON");
            assertThat(row.status()).isEqualTo("OFF");
            assertThat(row.confirmedAt()).isNull();
            String serialized = json.writeValueAsString(row);
            assertThat(serialized).contains("\"username\":\"" + entry.getValue() + "\"")
                    .doesNotContain("password", "passwordHash", "test-only-password");
        }
    }

    @Test
    void actionBodyCannotSupplyAnotherUserOrUsername() throws Exception {
        MqttGateway mqtt = mock(MqttGateway.class);
        DeviceCommandController controller = new DeviceCommandController(new DeviceCommandService(
                new TransactionTemplate(transactionManager), devices, users, history, mqtt));
        User actor = users.findByUsername("user124").orElseThrow();
        Jwt jwt = Jwt.withTokenValue("test-token").header("alg", "HS256")
                .subject(actor.getId().toString()).build();
        var spoofed = json.readTree("{\"action\":\"ON\",\"username\":\"user123\",\"userId\":1}");

        assertThatThrownBy(() -> controller.request(
                devices.findAllByOrderByCodeAsc().get(0).getId(), spoofed, jwt))
                .isInstanceOf(ApiException.class);
        assertThat(history.count()).isZero();
        verifyNoInteractions(mqtt);
    }

    @Test
    void emptyHistoryKeepsPaginationContract() {
        var page = reads.actionHistory(query(0, 5, null, null), null, null, null);
        assertThat(page.content()).isEmpty();
        assertThat(page.page()).isZero();
        assertThat(page.size()).isEqualTo(5);
        assertThat(page.totalElements()).isZero();
        assertThat(page.totalPages()).isZero();
    }

    private ReadController.TableQuery query(int page, int size, String field, String search) {
        return new ReadController.TableQuery(page, size, field, search, null, null, "ID", "DESC");
    }
}
