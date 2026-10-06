# Phần cứng ESP32

`ESP32/IoTMonitor/IoTMonitor.ino` là bản làm việc được chuyển từ
`Docs/DemoB2.ino`. Giữ bản trong Docs làm tài liệu của lần demo BTH2.
Tên thư mục và tên sketch trùng nhau để mở trực tiếp bằng Arduino IDE.

```text
Hardware/
├── README.md
└── ESP32/
    └── IoTMonitor/
        ├── IoTMonitor.ino
        ├── config.example.h
        └── config.h          # Cấu hình riêng, Git bỏ qua
```

## Chuẩn bị nạp

1. Mở `ESP32/IoTMonitor/IoTMonitor.ino` trong Arduino IDE.
2. Cài board ESP32 của Espressif; chọn board phù hợp ESP32 DevKit V1 và cổng USB.
3. Cài thư viện **PubSubClient**, **ArduinoJson 7**, **DHT sensor library**
   của Adafruit và **Adafruit Unified Sensor**.
4. Nếu chưa có `config.h`, sao chép `config.example.h` thành `config.h`.
   Điền Wi-Fi và thông tin broker đang dùng. File cục bộ trên máy hiện tại
   giữ các giá trị từ bản firmware đã demo; kiểm tra lại trước khi nạp.
5. Verify/Upload; mở Serial Monitor ở **115200 baud**.

Không ghi mật khẩu vào sketch hoặc `config.example.h`.

## GPIO và giao tiếp hiện có

| Tín hiệu | GPIO |
| --- | --- |
| DHT11 data | 4 |
| LDR AO | 34 |
| LED1 | 18 |
| LED2 | 19 |

DHT11 tạo hai reading `DHT11_TEMP`, `DHT11_HUM`; LDR tạo `LDR_LIGHT`.
Sketch gửi từng reading mỗi chu kỳ 2 giây lên `iot/sensor/data`.
LDR hiện được đổi ADC sang lux ước lượng theo công thức của bản demo.

Lệnh nhận ở `iot/device/command` gồm `requestId`, `deviceCode`, `action`.
Callback điều khiển GPIO rồi gửi `requestId`, `deviceCode`, `status` lên
`iot/device/status`. Backend đối chiếu request trước khi xác nhận cho Frontend.
Hai GPIO LED khởi tạo LOW khi ESP32 khởi động; trạng thái DB có thể là trạng thái
đã ghi nhận trước đó cho đến khi lệnh mới được xác nhận.

## Khi ghép với Docker

React và Spring Boot chạy trong container app; Mosquitto vẫn là broker riêng
trên máy. ESP32 dùng **IP LAN của máy chạy Mosquitto**, không dùng `localhost`
hoặc `host.docker.internal`. Port và tài khoản phải khớp cấu hình broker.

Broker thử hiện chỉ lắng nghe loopback nên ESP32 chưa truy cập được từ Wi-Fi.
Khi bước sang BTH4, cấu hình listener LAN có xác thực và quyền MQTT phù hợp,
kiểm tra Windows Firewall rồi mới nạp cấu hình mới. Lượt tổ chức thư mục này
chưa thay cấu hình listener và chưa kiểm chứng trên ESP32 thật.
