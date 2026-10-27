# F24 — Đối chiếu lệnh LED thật

Các lệnh dưới đây được bấm từ Dashboard trong lượt chuẩn bị báo cáo. Giai đoạn online dùng MQTT status từ hệ thống đang kết nối; không publish status mô phỏng. Hai lệnh cuối thực hiện sau khi người dùng báo đã rút ESP32.

| requestId | Thiết bị | Lệnh | Kết quả đối chiếu | MQTT command → status tại observer |
| --- | --- | --- | --- | --- |
| 564 | LED1 | ON | CONFIRMED | 140.35 ms |
| 565 | LED2 | ON | CONFIRMED | 196.047 ms |
| 566 | LED1 | OFF | CONFIRMED | 227.659 ms |
| 567 | LED2 | OFF | CONFIRMED | 154.2 ms |
| 568 | LED1 | ON | TIMEOUT_VERIFIED | Không có status |
| 569 | LED2 | ON | TIMEOUT_VERIFIED | Không có status |

## Ví dụ cùng requestId 564

### MQTT iot/device/command

```json
{
  "requestId": 564,
  "deviceCode": "LED1",
  "action": "ON"
}
```

### MQTT iot/device/status

```json
{
  "requestId": 564,
  "deviceCode": "LED1",
  "status": "ON"
}
```

### STOMP /topic/devices sau commit

```json
{
  "requestId": 564,
  "deviceCode": "LED1",
  "status": "ON",
  "historyStatus": "ON",
  "confirmedAt": "2026-10-20T19:28:49.332263Z",
  "deviceStatusUpdated": true,
  "deliveryState": "CONFIRMED"
}
```

### SQL ActionHistory

```json
{
  "id": "564",
  "deviceCode": "LED1",
  "action": "ON",
  "status": "ON",
  "createdAt": "2026-10-20 19:28:49.172334",
  "confirmedAt": "2026-10-20 19:28:49.332263"
}
```

## Timeout thật: requestId 568

Không quan sát status hoặc STOMP xác nhận cho request này. confirmedAt vẫn NULL, trạng thái Device vẫn OFF.

```json
{
  "type": "DEVICE_TIMEOUT",
  "requestId": 568,
  "deviceCode": "LED1",
  "occurredAt": "2026-10-20T19:33:18.723298Z"
}
```
```json
{
  "id": "568",
  "deviceCode": "LED1",
  "action": "ON",
  "status": "OFF",
  "createdAt": "2026-10-20 19:33:08.723298",
  "confirmedAt": "NULL"
}
```

## Cách diễn giải

- Các số ms là khoảng nhận command/status của cùng client quan sát và cùng đồng hồ; không phải đo thời gian bóng LED phát sáng hoặc benchmark độ trễ toàn hệ thống.
- MQTT status/Device.status xác nhận luồng phần mềm; ảnh bóng LED và Serial do người dùng bổ sung là bằng chứng vật lý riêng.
- HTTP 202 là contract của endpoint POST /api/devices/{deviceId}/actions; không lưu HAR/token hoặc giả làm đã chụp HTTP response thô.
- IDs 570–572 cũng xuất hiện trong khoảng quan sát, nhưng nguồn thao tác không được quy cho sáu phép thử trên. Giữ nguyên lịch sử, không xóa và không cộng chúng vào số PASS chủ động.
- Ảnh lọc Processing hiện kết quả rỗng sau timeout; không dùng để chứng minh đã chụp một hàng PENDING. Có ảnh Dashboard đang chờ và ảnh lỗi timeout thật.

Nguồn: [F24-command-comparison.json](data/F24-command-comparison.json), [SQL lịch sử](data/db-report-action-history.tsv), [trạng thái Device cuối](data/db-final-device-state.tsv).
