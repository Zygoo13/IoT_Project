package zygoo13.iot.api;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import zygoo13.iot.api.ReadController.ChartPoint;
import zygoo13.iot.api.ReadController.DashboardResponse;
import zygoo13.iot.api.ReadController.DeviceRow;
import zygoo13.iot.api.ReadController.Hardware;
import zygoo13.iot.api.ReadController.HistoryRow;
import zygoo13.iot.api.ReadController.LatestReading;
import zygoo13.iot.api.ReadController.PageResponse;
import zygoo13.iot.api.ReadController.SensorRow;
import zygoo13.iot.api.ReadController.TableQuery;
import zygoo13.iot.entity.ActionHistory;
import zygoo13.iot.entity.SensorData;
import zygoo13.iot.repository.ActionHistoryRepository;
import zygoo13.iot.repository.DeviceRepository;
import zygoo13.iot.repository.SensorDataRepository;

@Service
public class ReadService {
    private static final List<String> SENSOR_CODES = List.of("DHT11_TEMP", "DHT11_HUM", "LDR_LIGHT");
    private static final Map<String, String> SENSOR_SORT = Map.of(
            "ID", "id", "SENSOR_TYPE", "sensor.type", "VALUE", "value", "TIME", "recordedAt");
    private static final Map<String, String> HISTORY_SORT = Map.of(
            "ID", "id", "DEVICE", "device.code", "ACTION", "action",
            "STATUS", "status", "TIME", "createdAt");

    private final SensorDataRepository readings;
    private final ActionHistoryRepository history;
    private final DeviceRepository devices;

    public ReadService(SensorDataRepository readings, ActionHistoryRepository history,
                       DeviceRepository devices) {
        this.readings = readings;
        this.history = history;
        this.devices = devices;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusSeconds(30);
        Map<String, LatestReading> latest = new LinkedHashMap<>();
        Map<String, List<ChartPoint>> chart = new LinkedHashMap<>();
        for (String code : SENSOR_CODES) {
            List<SensorData> recent = readings.findTop15BySensor_CodeOrderByRecordedAtDescIdDesc(code);
            if (recent.isEmpty()) {
                latest.put(code, null);
                chart.put(code, List.of());
                continue;
            }
            SensorData newest = recent.get(0);
            latest.put(code, new LatestReading(code, newest.getValue(), newest.getSensor().getUnit(),
                    utc(newest.getRecordedAt()), newest.getRecordedAt().isBefore(cutoff)));
            List<ChartPoint> points = new ArrayList<>();
            for (SensorData reading : recent) {
                points.add(new ChartPoint(reading.getValue(), utc(reading.getRecordedAt())));
            }
            Collections.reverse(points);
            chart.put(code, points);
        }
        LocalDateTime lastSeen = readings.findFirstByOrderByRecordedAtDescIdDesc()
                .map(SensorData::getRecordedAt).orElse(null);
        Hardware hardware = new Hardware(lastSeen != null && !lastSeen.isBefore(cutoff) ? "ONLINE" : "OFFLINE",
                lastSeen == null ? null : utc(lastSeen));
        List<DeviceRow> ledRows = devices.findAllByOrderByCodeAsc().stream()
                .map(device -> new DeviceRow(device.getId(), device.getCode(), device.getStatus()))
                .toList();
        return new DashboardResponse(latest, chart, hardware, ledRows);
    }

    @Transactional(readOnly = true)
    public PageResponse<SensorRow> sensorData(TableQuery query) {
        Options options = options(query, SENSOR_SORT, Set.of("ID", "SENSOR_TYPE", "VALUE", "TIME"));
        Specification<SensorData> filter = (root, ignored, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (options.searchField() != null) {
                switch (options.searchField()) {
                    case "ID" -> predicates.add(cb.equal(root.get("id"), positiveId(query.search())));
                    case "SENSOR_TYPE" -> predicates.add(cb.greaterThan(
                            cb.locate(cb.upper(root.get("sensor").get("type")), upper(query.search())), 0));
                    case "VALUE" -> predicates.add(cb.equal(root.get("value"), decimal(query.search())));
                    case "TIME" -> {
                        TimeWindow window = timeSearch(query.search());
                        predicates.add(cb.greaterThanOrEqualTo(root.get("recordedAt"), window.start()));
                        predicates.add(cb.lessThan(root.get("recordedAt"), window.end()));
                    }
                    default -> throw badQuery("Unsupported sensor search field");
                }
            }
            if (options.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("recordedAt"), options.from()));
            }
            if (options.to() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("recordedAt"), options.to()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Page<SensorRow> result = readings.findAll(filter, options.pageable())
                .map(reading -> new SensorRow(reading.getId(), reading.getSensor().getCode(),
                        reading.getSensor().getType(), reading.getValue(), reading.getSensor().getUnit(),
                        utc(reading.getRecordedAt())));
        return PageResponse.of(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<HistoryRow> actionHistory(TableQuery query, String device, String action,
                                                   String status) {
        Options options = options(query, HISTORY_SORT, Set.of("ID", "DEVICE"));
        String deviceCode = optionalChoice(device, Set.of("LED1", "LED2"), "device");
        String actionCode = optionalChoice(action, Set.of("ON", "OFF"), "action");
        String statusCode = optionalChoice(status, Set.of("ON", "OFF"), "status");
        Specification<ActionHistory> filter = (root, ignored, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (options.searchField() != null) {
                switch (options.searchField()) {
                    case "ID" -> predicates.add(cb.equal(root.get("id"), positiveId(query.search())));
                    case "DEVICE" -> predicates.add(cb.greaterThan(
                            cb.locate(cb.upper(root.get("device").get("code")), upper(query.search())), 0));
                    default -> throw badQuery("Unsupported history search field");
                }
            }
            if (deviceCode != null) {
                predicates.add(cb.equal(root.get("device").get("code"), deviceCode));
            }
            if (actionCode != null) {
                predicates.add(cb.equal(root.get("action"), actionCode));
            }
            if (statusCode != null) {
                predicates.add(cb.equal(root.get("status"), statusCode));
            }
            if (options.from() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), options.from()));
            }
            if (options.to() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), options.to()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        Page<HistoryRow> result = history.findAll(filter, options.pageable())
                .map(row -> new HistoryRow(row.getId(), row.getDevice().getId(), row.getDevice().getCode(),
                        row.getAction(), row.getStatus(), utc(row.getCreatedAt()),
                        row.getConfirmedAt() == null ? null : utc(row.getConfirmedAt()),
                        row.getConfirmedAt() != null ? "CONFIRMED"
                                : row.getCreatedAt().plusSeconds(10).isAfter(now) ? "PENDING" : "TIMEOUT"));
        return PageResponse.of(result);
    }

    private Options options(TableQuery query, Map<String, String> sortFields, Set<String> searchFields) {
        if (query.page() < 0 || query.size() < 1 || query.size() > 20) {
            throw badQuery("page must be >= 0 and size must be 1..20");
        }
        boolean hasField = query.searchField() != null;
        boolean hasSearch = query.search() != null;
        if (hasField != hasSearch || hasField &&
                (query.searchField().isBlank() || query.search().isBlank())) {
            throw badQuery("searchField and search must be provided together");
        }
        String field = hasField ? upper(query.searchField()) : null;
        if (field != null && !searchFields.contains(field)) {
            throw badQuery("Unsupported searchField");
        }
        String sortField = upper(query.sortBy());
        String property = sortFields.get(sortField);
        if (property == null) {
            throw badQuery("Unsupported sortBy");
        }
        String order = upper(query.order());
        if (!order.equals("ASC") && !order.equals("DESC")) {
            throw badQuery("order must be ASC or DESC");
        }
        LocalDateTime from = offsetTime(query.from());
        LocalDateTime to = offsetTime(query.to());
        if (from != null && to != null && from.isAfter(to)) {
            throw badQuery("from must be before or equal to to");
        }
        Sort.Direction direction = Sort.Direction.valueOf(order);
        Sort sort = Sort.by(direction, property);
        if (!property.equals("id")) {
            sort = sort.and(Sort.by(direction, "id"));
        }
        return new Options(PageRequest.of(query.page(), query.size(), sort), field, from, to);
    }

    private String optionalChoice(String value, Set<String> allowed, String name) {
        if (value == null) {
            return null;
        }
        String normalized = upper(value);
        if (!allowed.contains(normalized)) {
            throw badQuery("Unsupported " + name);
        }
        return normalized;
    }

    private LocalDateTime offsetTime(String value) {
        if (value == null) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
        } catch (DateTimeParseException error) {
            throw badQuery("Time must be ISO 8601 with an offset");
        }
    }

    private TimeWindow timeSearch(String value) {
        try {
            if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDateTime start = LocalDate.parse(value).atStartOfDay();
                return new TimeWindow(start, start.plusDays(1));
            }
            LocalDateTime start = offsetTime(value).truncatedTo(ChronoUnit.SECONDS);
            return new TimeWindow(start, start.plusSeconds(1));
        } catch (DateTimeParseException error) {
            throw badQuery("Invalid TIME search");
        }
    }

    private Long positiveId(String value) {
        try {
            long id = Long.parseLong(value.trim());
            if (id > 0) {
                return id;
            }
        } catch (NumberFormatException ignored) {
            // Report a client error below.
        }
        throw badQuery("ID search must be a positive integer");
    }

    private BigDecimal decimal(String value) {
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException error) {
            throw badQuery("VALUE search must be a number");
        }
    }

    private String upper(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private OffsetDateTime utc(LocalDateTime value) {
        return value.atOffset(ZoneOffset.UTC);
    }

    private ApiException badQuery(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "BAD_QUERY", message);
    }

    private record Options(PageRequest pageable, String searchField,
                           LocalDateTime from, LocalDateTime to) { }
    private record TimeWindow(LocalDateTime start, LocalDateTime end) { }
}
