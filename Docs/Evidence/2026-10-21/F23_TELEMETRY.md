# F23 — Đối chiếu telemetry thật

Lượt quan sát ngày 21/10/2026 (giờ Việt Nam). Không dùng fixture BTH3.

420 event STOMP đã đối chiếu với 420 dòng SQL: ID, Sensor.code, giá trị và timestamp chính xác tới micro giây đều khớp. Mỗi Sensor có 140 message MQTT và 140 event STOMP; giá trị theo thứ tự quan sát khớp. MQTT không có sample ID/timestamp nên không khẳng định ba Sensor là cùng một chu kỳ đo.

## Nhiệt độ: SensorData.id = 9282

### MQTT quan sát tại broker

```json
{
  "sensorCode": "DHT11_TEMP",
  "value": 32.3
}
```

### STOMP /topic/sensors

```json
{
  "id": 9282,
  "sensorCode": "DHT11_TEMP",
  "sensorType": "TEMPERATURE",
  "value": 32.3,
  "unit": "°C",
  "recordedAt": "2026-10-20T19:32:38.961396Z"
}
```

### REST GET /api/sensor-data

```json
{
  "id": 9282,
  "sensorCode": "DHT11_TEMP",
  "sensorType": "TEMPERATURE",
  "value": 32.3,
  "unit": "°C",
  "recordedAt": "2026-10-20T19:32:38.961396Z"
}
```

## Độ ẩm: SensorData.id = 9283

### MQTT quan sát tại broker

```json
{
  "sensorCode": "DHT11_HUM",
  "value": 50.8
}
```

### STOMP /topic/sensors

```json
{
  "id": 9283,
  "sensorCode": "DHT11_HUM",
  "sensorType": "HUMIDITY",
  "value": 50.8,
  "unit": "%RH",
  "recordedAt": "2026-10-20T19:32:39.204336Z"
}
```

### REST GET /api/sensor-data

```json
{
  "id": 9283,
  "sensorCode": "DHT11_HUM",
  "sensorType": "HUMIDITY",
  "value": 50.8,
  "unit": "%RH",
  "recordedAt": "2026-10-20T19:32:39.204336Z"
}
```

## Ánh sáng: SensorData.id = 9284

### MQTT quan sát tại broker

```json
{
  "sensorCode": "LDR_LIGHT",
  "value": 30.26
}
```

### STOMP /topic/sensors

```json
{
  "id": 9284,
  "sensorCode": "LDR_LIGHT",
  "sensorType": "LIGHT",
  "value": 30.26,
  "unit": "lux",
  "recordedAt": "2026-10-20T19:32:39.215658Z"
}
```

### REST GET /api/sensor-data

```json
{
  "id": 9284,
  "sensorCode": "LDR_LIGHT",
  "sensorType": "LIGHT",
  "value": 30.26,
  "unit": "lux",
  "recordedAt": "2026-10-20T19:32:39.215658Z"
}
```

## Nguồn kiểm tra

- [Đối chiếu đầy đủ](data/F23-telemetry-comparison.json).
- [SELECT SQL của 420 reading](data/db-observed-sensor-data.tsv).
- [Trace MQTT/STOMP gốc](data/mqtt-stomp-events.json).
- Ảnh UI: images/F16-sensor-data-real.png và images/F16c-sensor-search-date.png; các ID cuối 9282–9284 xuất hiện trên bảng.

Không lấy chênh lệch timestamp Windows và Docker làm latency. Có các khoảng nhận dồn ở client MQTT tới khoảng 10.25 giây; kết quả này chứng minh khớp dữ liệu trong lượt quan sát, không phải cam kết mạng ổn định dài hạn.
