# IoT Monitor — BTH4

React + Spring Boot + MySQL + Mosquitto + ESP32. BTH3 đã hoàn thành.
Từ 20/10/2026, source đã gỡ bộ phản hồi LED mô phỏng. Không xóa dữ liệu cũ,
không đổi năm bảng và không sửa firmware trong bước chuẩn bị này.

## Cấu trúc

- Frontend/: năm màn hình React, REST và STOMP native WebSocket.
- Backend/: JWT, API, OpenAPI/Swagger, MQTT, MySQL và STOMP.
- Hardware/ESP32/IoTMonitor/: sketch ESP32 và config.h cục bộ.
- Docs/: bài nộp, wireframe và firmware tham khảo.
- docker/: Nginx, Supervisor, cấu hình Mosquitto và healthcheck.
- compose.yaml: service app (Frontend + Backend) và service mosquitto trong project iot_project.
- compose.bth4.yaml: giữ tương thích lệnh BTH4 cũ; cấu hình nền đã dùng broker Docker.
- start.ps1: khởi động MySQL hiện có, chuẩn bị password file nếu thiếu rồi chạy Compose.

## Khởi động BTH4

Cần Docker Desktop ở chế độ Linux containers. MySQL vẫn dùng container
iot_backend_mysql_20261005 và volume hiện có, chưa chuyển vào Compose này.
Chỉ chạy một Backend nhận telemetry. Mosquitto Windows đã dừng và chuyển
StartupType sang Manual để không tranh cổng 1325 với Docker.

1. Giữ Backend/.env cục bộ chứa DB, seed và JWT secret.
2. Backend/.env.bth4 chứa IOT_MQTT_USER và IOT_MQTT_PASSWORD của broker 1325.
   Nếu chưa có, sao chép Backend/bth4.env.example và điền tài khoản đang dùng.
   Không ghi đè file cục bộ đã có; file được đọc raw, không bao giá trị bằng dấu nháy.
3. Chạy từ thư mục gốc:

~~~powershell
.\start.ps1
~~~

Sau khi sửa source, dùng `.\start.ps1 -Build`. Script không tạo lại MySQL hoặc volume.
Khi MySQL đã chạy, có thể dùng trực tiếp:

~~~powershell
docker compose --env-file Backend/.env up -d
docker compose --env-file Backend/.env ps
~~~

Trong Docker Desktop, Start nhóm iot_project sẽ chạy cả app và Mosquitto.
MySQL nằm ngoài nhóm nên vẫn cần chạy riêng; start.ps1 xử lý bước này.
Hai service dùng restart: unless-stopped: tự chạy lại cùng Docker nếu trước đó
không bị Stop thủ công. Mở Docker Desktop không tự Start service đã bị Stop.

- Web: http://localhost:8088
- Swagger UI: http://localhost:8088/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8088/v3/api-docs
- OpenAPI YAML: http://localhost:8088/v3/api-docs.yaml

Compose đọc Backend/.env trước, rồi Backend/.env.bth4 để thay credentials MQTT.
Các giá trị environment ưu tiên hơn env_file: URI tcp://mosquitto:1883,
client ID iot-backend-bth4, IOT_LED_DEMO_ENABLED=false. Không in config đầy đủ
vì chứa secrets. Cờ demo cũ không còn bật được mô phỏng trong source hiện tại.

Backend gọi broker bằng tên service mosquitto trong Docker network. ESP32 tiếp tục
dùng IP LAN của laptop và cổng 1325; Docker chuyển tiếp 1325 → 1883. Giữ nguyên
tài khoản, ba topic và firmware. Không mở mosquitto.exe trên Windows cùng cổng.
Nếu ESP32 không kết nối qua Wi-Fi, kiểm tra IP LAN và Windows Firewall cho TCP 1325.

prepare-password.ps1 tạo docker/mosquitto/.passwords bằng image broker từ credentials
cục bộ, không in chúng. File này bị loại khỏi Git và Docker build. Broker sao chép
hash vào file quyền 600 khi khởi động. Nếu chủ động đổi tài khoản, cập nhật .env.bth4,
chạy lại helper với -Replace rồi recreate hai service để nhận môi trường mới.
Dữ liệu broker lưu trong volume mosquitto_data, độc lập với volume MySQL.

Không dùng compose.demo.yaml: override này và LedDemoResponder đã được gỡ.
Không dùng down -v hoặc tạo lại MySQL. Dữ liệu demo BTH3 đang có được giữ;
chúng không phải phép đo hoặc xác nhận ESP32. Script Backend/scripts/demo-data.ps1
vẫn là công cụ fixture thủ công, không tự chạy; chế độ clean chỉ dùng manifest
cục bộ để nhận diện đúng các dòng do script tạo, không dọn ở bước chuẩn bị này.

## Dùng Swagger

### Tài khoản và người thực hiện lệnh

Hệ thống dùng tài khoản chính đã có và hai tài khoản bổ sung `user124`, `user125`.
Khi tạo mới, hai tài khoản dùng mật khẩu từ `IOT_SEED_PASSWORD` trong môi trường cục bộ,
lưu bằng BCrypt. Seed chỉ thêm username còn thiếu; không đặt lại mật khẩu, hồ sơ hoặc
ID đã có khi khởi động lại. Hai hồ sơ bổ sung dùng mã/email riêng và có thể sửa tại Hồ sơ.

Lịch sử điều khiển hiển thị `Người thực hiện` trước `Lệnh`, lấy `username` theo
`ActionHistory.userId`. Backend xác định người gửi từ JWT, không nhận người thực hiện
do client tự khai. Lịch sử cũ giữ nguyên người đã gửi; không đổi thành tài khoản đang xem.

Kiểm thử hồi quy đa tài khoản: `Backend/src/test/java/zygoo13/iot/api/HistoryUsersIntegrationTest.java`
dùng H2 riêng và MQTT mock, không gửi lệnh đến ESP32 thật. Chạy `mvn test` trong Backend.

### Thao tác trên tài liệu API

1. Mở Auth → POST /api/auth/login → Try it out.
2. Nhập username/password tài khoản cục bộ rồi Execute.
3. Sao chép trường token, bấm Authorize, dán token (không thêm chữ Bearer).
4. Dùng GET Dashboard, Sensor Data, Action History và Profile để tra cứu.
5. PUT Profile thay đủ tám trường cho phép. POST Devices thực sự gửi lệnh MQTT;
   chỉ Execute khi đã sẵn sàng điều khiển phần cứng.

Swagger không lưu JWT sau reload và không chứa credentials ví dụ thật.
HTTP 202 chỉ có nghĩa lệnh đã lưu/publish, không xác nhận LED đã đổi.
Xác nhận phải đến từ iot/device/status; sau 10 giây chưa có xác nhận là TIMEOUT.
Hardware Online chỉ dựa vào telemetry hợp lệ trong 30 giây; Offline không đặt LED OFF.
STOMP /ws và bốn topic nằm trong [Backend/CONTRACT.md](Backend/CONTRACT.md),
Swagger chỉ thử REST, không thử subscribe MQTT/STOMP.

## Kiểm tra không điều khiển phần cứng

~~~powershell
node Backend/scripts/verify-api-docs.mjs
docker exec iot_project_app nginx -t
docker inspect iot_project_app --format '{{.State.Health.Status}}'
~~~

Script đọc tài khoản cục bộ nhưng không in mật khẩu/JWT. Script kiểm tra login, các GET, schema, JWT, query lỗi và route React; thêm PUT/POST
không JWT để xác nhận bị chặn 401. Không cập nhật Profile, không gửi command
hợp lệ, không publish MQTT hoặc xóa dữ liệu. Có thể đặt IOT_VERIFY_BASE_URL
nếu đổi cổng web. Healthcheck chỉ kiểm tra HTTP, không chứng minh MQTT/ESP32 hoạt động.

## Quy trình tích hợp ESP32 tiếp theo

- Xác nhận broker 1325 đang chạy và credentials khớp; không chạy broker khác trên cùng cổng.
- ESP32 publish iot/sensor/data → kiểm tra SensorData mới, GET Dashboard/Sensor Data,
  sự kiện /topic/sensors và UI. Một reading hợp lệ tương ứng một dòng DB.
- Sau khi sẵn sàng thử GPIO: Web gửi ON/OFF → history PENDING → command có requestId
  → ESP32 publish status cùng requestId → history CONFIRMED, Device và UI cập nhật.
- Thử offline 30 giây, timeout 10 giây, xác nhận muộn, reload và WebSocket reconnect.
- Các script verify-telemetry/command/stomp cũ có publish hoặc ghi/dọn fixture;
  không chạy tự động khi ESP32 đang hoạt động.

## Dừng và khôi phục

~~~powershell
docker compose --env-file Backend/.env stop
~~~

Lệnh dừng app và broker Docker, giữ nguyên MySQL và các volume. Dùng start.ps1
để chạy lại. Không dùng down -v. Cấu hình/password file Mosquitto Windows ban đầu
vẫn được giữ nếu cần rollback: dừng app và broker Docker trước, khởi động broker
Windows rồi đổi URI app sang tcp://host.docker.internal:1325 bằng override riêng
trước khi chạy lại app. Không chạy đồng thời hai broker trên 1325 hoặc hai Backend.
Quay về BTH3 phải dùng snapshot/image cũ đã lưu riêng, không bật mô phỏng trên
broker đang phục vụ ESP32 thật.

## Kết quả kiểm tra 20/10/2026

- Docker build: React và Maven package thành công, JAR Spring Boot được đóng gói.
- Swagger/OpenAPI có 7 thao tác REST và Authorize JWT; API nghiệp vụ vẫn yêu cầu JWT.
- Script verify-api-docs đạt 25 kiểm tra HTTP; browser mở Swagger và Try it out
  GET Dashboard thiếu JWT trả 401 đúng định dạng lỗi.
- Không gửi lệnh LED, không thay Profile, không sửa schema hoặc dọn DB.
- Sau khi chuyển broker vào Docker: app và Mosquitto healthy; xác thực qua host
  1325 thành công, sai mật khẩu/ẩn danh bị từ chối. Backend subscribe telemetry/status
  và tự subscribe lại sau khi broker restart. File persistence tồn tại trong volume.
- SensorData tiếp tục tăng, ActionHistory không đổi trong phép kiểm tra; chưa dùng
  kết quả này để kết luận toàn bộ luồng ESP32, GPIO và STOMP đã được kiểm chứng.

Chi tiết Backend: [Backend/README.md](Backend/README.md).
Phần cứng: [Hardware/README.md](Hardware/README.md).
