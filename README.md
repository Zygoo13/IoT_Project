# IoT Project

React + Spring Boot + MySQL + Mosquitto, chuẩn bị ghép ESP32 cho BTH4.

```text
IoT_Project/
├── Backend/             # Spring Boot, API, MQTT và STOMP
├── Frontend/            # Năm màn hình React
├── Hardware/            # Sketch ESP32 để phát triển và nạp
├── Docs/                # Bài nộp, wireframe và firmware demo gốc
├── docker/              # Nginx, quản lý tiến trình và healthcheck
├── Dockerfile
└── compose.yaml
```

## Một container Frontend + Backend

Image `iot-project:local` build React bằng Node, build Spring Boot bằng Maven,
rồi chạy **Nginx và Java trong cùng container** `iot_project_app`.
Supervisor quản lý hai tiến trình và dừng chúng khi container dừng.

```text
Browser → localhost:8088 → Nginx
                            ├── / và các route React → file build
                            ├── /api/* → Spring Boot :8080 trong container
                            └── /ws → WebSocket/STOMP của Spring Boot

Spring Boot → MySQL và Mosquitto hiện có trên máy
ESP32 → Wi-Fi → Mosquitto
```

MySQL và Mosquitto **không được gộp vào image**. Container app dùng DB hiện có,
bao gồm tài khoản và dữ liệu demo. Không có lệnh tự nạp demo hoặc đặt lại DB.

### Chuẩn bị trên máy hiện tại

- Docker Desktop đang chạy Linux containers.
- MySQL container `iot_backend_mysql_20261005` đang chạy, host port **3307**.
- Mosquitto đang chạy tại host port **1883** với cấu hình/tài khoản cục bộ.
- `Backend/.env` đã có thông tin DB, MQTT, User seed và JWT theo Backend README.
- Dừng Backend Java đang chạy ngoài Docker trước khi khởi động app container.
  Chỉ chạy **một Backend** nhận telemetry để tránh lưu một message hai lần.

Nếu MySQL đang dừng:

```powershell
docker start iot_backend_mysql_20261005
```

Nếu broker thử nghiệm trên máy hiện tại đang dừng, từ thư mục gốc:

```powershell
Start-Process -FilePath 'C:\Program Files\Mosquitto\mosquitto.exe' `
  -ArgumentList @('-c', '.mosquitto-test.conf') `
  -WorkingDirectory (Join-Path $PWD 'Backend') -WindowStyle Hidden
```

File cấu hình và password file Mosquitto đã có cục bộ trong Backend, được Git
bỏ qua. Không chạy thêm broker nếu cổng 1883 đã được broker hiện tại sử dụng.

### Build và chạy

Chạy tại **thư mục gốc IoT_Project**:

```powershell
docker compose --env-file Backend/.env up -d --build
docker compose --env-file Backend/.env ps
```

Đợi app chuyển sang `healthy`, rồi mở **http://localhost:8088**.
Dùng tài khoản seed cục bộ hiện có. Origin mới có phiên JWT riêng nên cần
đăng nhập tại địa chỉ mới. Không cần chạy Vite hoặc Java trực tiếp.

Sau khi đã build, có thể bật/tắt đúng container app:

```powershell
docker start iot_project_app
docker stop iot_project_app
docker logs --tail 50 iot_project_app
```

Sau khi sửa source, chạy lại lệnh `compose up -d --build`.
Khi đổi biến môi trường, dùng `compose up -d` để cập nhật cấu hình container;
`docker start` giữ cấu hình của lần tạo trước.

```powershell
docker compose --env-file Backend/.env down
```

`down` chỉ dừng/xóa container app và network của compose này. MySQL hiện có
và dữ liệu của nó được giữ nguyên; broker trên Windows cũng không bị dừng.

### Cấu hình Docker

Compose đọc secret từ `Backend/.env` **lúc chạy**. `.dockerignore` loại các
file môi trường, cấu hình broker, Docs, Hardware và dữ liệu tạm khỏi build
context. Không đưa mật khẩu/JWT vào Dockerfile hoặc build argument.

Compose đổi địa chỉ loopback sang `host.docker.internal` để app container
truy cập dịch vụ trên Windows. Các biến sau có thể thêm vào `Backend/.env`
khi cần đổi cổng hoặc máy dịch vụ:

| Biến | Mặc định |
| --- | --- |
| `IOT_APP_PORT` | `8088` |
| `IOT_DOCKER_DB_HOST` | `host.docker.internal` |
| `IOT_DOCKER_DB_PORT` | `3307` |
| `IOT_DOCKER_MQTT_HOST` | `host.docker.internal` |
| `IOT_DOCKER_MQTT_PORT` | `1883` |
| `IOT_DOCKER_FRONTEND_ORIGIN` | `http://localhost:8088` |

Tên database lấy từ `MYSQL_DATABASE`; DB user/password và MQTT user/password
vẫn lấy từ các biến Backend đang dùng. Client ID MQTT của app Docker là
`iot-backend-docker`. Khi đổi cổng web, đổi cả frontend origin cho khớp.
Origin phải là một địa chỉ rõ ràng, không dùng `*`.

Cổng web chỉ publish lên loopback của máy, phù hợp demo cục bộ. Cấu hình này
đã kiểm tra trên Docker Desktop Windows; nếu chuyển sang Linux/server khác,
cần đặt DB/MQTT host tương ứng với môi trường đó.

Healthcheck kiểm tra trang React trả 200 và API Profile không token trả 401.
Nó kiểm tra hai tiến trình đang phục vụ HTTP; broker Offline vẫn cho REST
hoạt động nên healthcheck không dùng để kết luận ESP32 hoặc MQTT Online.

## Phần cứng

Mở [Hardware/README.md](Hardware/README.md) để xem GPIO, thư viện Arduino,
cấu hình Wi-Fi/MQTT và cách nạp `Hardware/ESP32/IoTMonitor/IoTMonitor.ino`.
`config.h` là file riêng được Git bỏ qua; `config.example.h` là mẫu để chia sẻ.
Firmware làm việc giữ logic của bản demo, chỉ tách cấu hình khỏi sketch.

Broker thử hiện lắng nghe loopback. Để ghép ESP32 thật qua Wi-Fi ở BTH4, cần
listener LAN có xác thực và cấu hình firewall; ESP32 dùng IP LAN của máy chạy
broker, không dùng địa chỉ Docker nội bộ. Chưa thực hiện việc mở listener LAN
hoặc nạp/kiểm chứng ESP32 trong lượt đóng gói này.

## Kết quả kiểm tra Docker (06/10/2026)

- Docker build React và Maven thành công; JAR Spring Boot được đóng gói lại.
- Container `healthy`; Nginx kiểm tra cấu hình thành công.
- Năm route React/deep link trả HTML 200; login đúng 200, sai 401; API không
  token 401; GET Profile có JWT 200 và không trả password hash.
- Native WebSocket qua Nginx xác thực STOMP CONNECT và subscribe bốn topic.
- Ba MQTT reading tạo đúng ba dòng MySQL, ba sensor event và REST đọc được.
- Một lệnh LED2 giữ trạng thái cũ được nhận HTTP 202; status MQTT đúng tạo
  device event và history CONFIRMED. Terminal đóng vai ESP32 trong phép thử.
- Chỉ dọn ID reading/history của phép thử và khôi phục timestamp LED2;
  số dòng SensorData/ActionHistory trở lại như trước. Dữ liệu demo được giữ.
- Khởi động lại container vẫn `healthy`; số dòng User/Sensor/SensorData/Device/
  ActionHistory giữ nguyên `1/3/54/2/38`, LED1 ON và LED2 OFF.
- Arduino CLI chưa có trên máy; chưa compile/upload sketch trên ESP32.

Chi tiết nghiệp vụ: [Backend/CONTRACT.md](Backend/CONTRACT.md).
Chạy phát triển không Docker: [Backend/README.md](Backend/README.md) và
[Frontend/README.md](Frontend/README.md).
