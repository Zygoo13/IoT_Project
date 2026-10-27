# Kế hoạch báo cáo BTL cuối kỳ

Đề tài: Hệ thống IoT giám sát môi trường và điều khiển thiết bị.

Ngày lập: 20/10/2026. Đây là đề cương làm việc, chưa phải báo cáo hoàn chỉnh. Bốn chương giữ đúng yêu cầu: Giới thiệu, Phân tích, Thiết kế, Kết luận. Người dùng tự định dạng theo phong cách TH1; kế hoạch tập trung nội dung và minh chứng. Các khoảng số trang chỉ giúp ước lượng khối lượng, không là chỉ tiêu phải đạt.

Cập nhật 27/10/2026: bản hiện tại có ba tài khoản, History sáu cột với Người thực hiện trước Lệnh và response thêm username. Ưu tiên [chỉ mục resource hiện tại](Report/RESOURCE_INDEX.md) và [OpenAPI mới](Evidence/2026-10-27/data/openapi-no-examples.json) khi viết; bộ phần cứng ngày 21/10 được giữ nguyên.

## 1. Kết quả đọc và đối chiếu tài liệu

| Nguồn | Nhận xét | Cách sử dụng |
| --- | --- | --- |
| Docs/TH1_IOT_V5.docx | Có năm bảng, sáu use case, năm giao diện, sáu sequence chính và API; phần III đã nhóm theo chức năng. | Nền nghiệp vụ và cách trình bày. Giữ bản gốc, cập nhật báo cáo cuối theo sản phẩm. |
| C:/Users/AD/Desktop/mau.pdf | 24 trang PDF, mẫu năm 2025; tách riêng giao diện, API và sequence; năm chương. | Tham khảo loại minh chứng, không kế thừa cấu trúc. |
| C:/Users/AD/Desktop/mau2.pdf | 26 trang PDF; cùng tác giả và phần lớn nội dung/hình với mau.pdf, thêm bìa nền tảng chia sẻ và ảnh thử query. | Biến thể gần trùng của cùng mẫu, không phải một chuẩn độc lập. |
| C:/Users/AD/Desktop/mau3.pdf | 33 trang PDF, mẫu năm 2024; nhiều ảnh mạch/code, hai bảng dữ liệu và công nghệ khác dự án. | Tham khảo cách minh họa phần cứng, không lấy mô hình hoặc API cũ. |
| Docs/IOT_PROJECT_BASE.md | Tài liệu nền có cả phần dự kiến và UI ban đầu. | Truy nguyên yêu cầu; không dùng như bằng chứng mọi chức năng đã chạy. |
| Backend/CONTRACT.md, source và README hiện tại | Endpoint, DTO, JWT, UTC, MQTT/STOMP và trạng thái kiểm tra đã ghi nhận. | Chuẩn đối chiếu kỹ thuật cho thiết kế và minh chứng mới. |

Không sao chép thông tin sinh viên, ảnh mạch, ảnh kết quả, repository hoặc kết luận thành công của mẫu sang bài của mình. Các mẫu cũ dùng Node/Express, Socket.IO, hai bảng hoặc ba LED; dự án này dùng Spring Boot, STOMP native WebSocket, năm bảng, hai LED.

## 2. Cách tổ chức bốn chương

Mỗi chức năng ở Chương 3 là một cụm liền mạch:

**Mục tiêu/use case ngắn → Giao diện/thao tác → Luồng và sequence → API/message/event → Triển khai/dữ liệu → Kiểm tra/kết quả.**

Ví dụ: mục Dữ liệu cảm biến chứa ngay ảnh trang đó, sequence tra cứu, GET /api/sensor-data, query, dữ liệu trả về và phép thử của chính chức năng. Không chia thành một mục Giao diện chứa mọi màn hình, rồi một mục Sequence và một mục API chứa mọi chức năng.

- Chương 1: vì sao làm, mục tiêu và giới hạn.
- Chương 2: ai dùng, cần gì, dữ liệu nào, quy tắc và tiêu chí đạt.
- Chương 3: thiết kế, cách thực hiện từng chức năng, triển khai và bằng chứng kiểm tra.
- Chương 4: kết quả đối chiếu mục tiêu, hạn chế và hướng phát triển.

Kiến trúc, phần cứng và ERD là phần dùng chung, đặt một lần đầu Chương 3. Chương 2 chỉ tổng hợp use case/yêu cầu; đặc tả chi tiết đặt cùng chức năng ở Chương 3 để tránh lặp. Nếu thầy yêu cầu bảng đặc tả UC nằm ở Chương 2, chỉ chuyển riêng các bảng và dẫn chiếu; UI → sequence → API vẫn liền nhau ở Chương 3.

Không thêm chương thứ năm Kết quả. Kiểm tra riêng nằm cuối từng chức năng; kiểm thử tích hợp nằm cuối Chương 3. Source có sẵn không đồng nghĩa đã kiểm chứng ESP32 end to end. Test terminal/fixture phải phân biệt với phần cứng thật.

## 3. Phần đầu báo cáo

Không tính thành chương:

- Bìa, bìa phụ nếu cần: trường/khoa, môn, đề tài, giảng viên, sinh viên, mã, nhóm, năm.
- Thông tin kế thừa TH1: Hoàng Quốc Anh, B23DCCN022, nhóm 10, TS. Nguyễn Quốc Uy; xác nhận lại khi xuất bản.
- Lời cảm ơn ngắn nếu cần, không lấy nguyên văn mẫu.
- Mục lục tự động; danh mục hình; danh mục bảng.
- Từ viết tắt thực sự dùng: IoT, MQTT, REST, JWT, STOMP, GPIO, ADC, ERD, UTC.

## 4. Chương 1 Giới thiệu

Dung lượng tham khảo: 2–3 trang.

| Mục | Nội dung sẽ viết | Hình/bảng |
| --- | --- | --- |
| 1.1 Đặt vấn đề | Nhu cầu theo dõi nhiệt độ, độ ẩm, ánh sáng và điều khiển thiết bị từ web; dẫn vào bài toán cụ thể, không kể lịch sử IoT dài. | Không bắt buộc hình; sơ đồ ngữ cảnh nếu giúp giải thích. |
| 1.2 Mục tiêu | Thu thập ba đại lượng, hiển thị realtime, lưu/tra cứu, điều khiển hai LED có xác nhận, xác thực, Profile, tài liệu API. Mỗi mục tiêu có tiêu chí đạt. | Bảng mục tiêu → tiêu chí, hoặc để bảng đối chiếu ở 4.1. |
| 1.3 Phạm vi | Ba tài khoản user123/user124/user125 cùng nhóm chức năng, ESP32/DHT11/LDR/hai LED, năm màn hình, Wi-Fi nội bộ. Không đăng ký/đa vai trò, điều khiển điện lưới hoặc tự động hóa nếu chưa có. | Bảng trong/ngoài phạm vi khi cần. |
| 1.4 Phương pháp | Phân tích TH1 → phần cứng/giao diện/backend → ghép MQTT/REST/STOMP → kiểm tra từng cổng và end to end. | Bảng công nghệ/vai trò nếu không lặp 3.1. |
| 1.5 Bố cục | Vai trò bốn chương trong một đoạn. | Không cần. |

## 5. Chương 2 Phân tích

Dung lượng tham khảo: 5–7 trang.

### 2.1 Bài toán và đối tượng tương tác

User thao tác web; ESP32 là thành phần cung cấp reading/nhận command, không phải vai trò người dùng. Nêu đầu vào (thông tin đăng nhập, reading, ON/OFF, query, Profile), đầu ra (JWT, số đo, trạng thái xác nhận, kết quả truy vấn). Sơ đồ ngữ cảnh chỉ xuất hiện một lần nếu đã có ở Chương 1.

### 2.2 Yêu cầu chức năng và use case tổng quát

F01: Use Case tổng quát. B01: mã UC, tên, mục tiêu, đầu vào/đầu ra, mục thiết kế.

| Mã | Chức năng | Nơi thiết kế |
| --- | --- | --- |
| UC01 | Đăng nhập tài khoản có sẵn, từ chối sai thông tin, xử lý hết phiên. | 3.4 |
| UC02 | Xem Dashboard, số đo/chart, Hardware, LED và cập nhật realtime. | 3.5 |
| UC03 | Gửi ON/OFF; mọi yêu cầu hợp lệ có history; chỉ đổi LED sau xác nhận. | 3.6 |
| UC04 | Tra cứu reading, tìm theo lựa chọn/từ khóa, sort và phân trang server. | 3.7 |
| UC05 | Tra cứu history; phân biệt action/status/deliveryState. | 3.8 |
| UC06 | Xem/sửa/hủy Profile, các liên kết và avatar theo khả năng hiện có. | 3.9 |

Sáu use case nhưng năm màn hình: UC03 dùng chung Dashboard. Không thêm đăng ký, quên mật khẩu hoặc quản trị Sensor/Device khi không có source.

### 2.3 Yêu cầu dữ liệu

- B02: ba Sensor.code, đại lượng, nguồn vật lý và đơn vị. DHT11 tạo hai Sensor logic, LDR tạo một Sensor logic.
- Hai Device là LED1/LED2, không gọi ESP32 là Device LED.
- Phân tích ý nghĩa User, Sensor, SensorData, Device, ActionHistory, chưa lặp toàn bộ cột SQL.
- Một reading hợp lệ tạo một SensorData, không có SensorSample hoặc hàng gộp ba đại lượng.

### 2.4 Quy tắc nghiệp vụ

B03: mã quy tắc, nội dung, cách kiểm chứng; gồm:

- Chart tối đa 15 reading mỗi Sensor, khác số nhãn trục X và số timestamp hợp nhất.
- Hardware Online khi có telemetry hợp lệ trong 30 giây; Offline giữ số đo cuối và LED status.
- Action là yêu cầu, status là ghi nhận; 202 ACCEPTED chưa xác nhận LED đổi.
- confirmedAt null khi chưa xác nhận; quá 10 giây là TIMEOUT, không đổi Device.status.
- Ack lặp không sửa xác nhận đầu; ack muộn hoàn tất history nhưng không ghi đè trạng thái của request mới hơn đã xác nhận.
- Processing tương ứng PENDING, không thêm vào status ON/OFF.
- Tối đa 20 dòng/trang, UI mặc định 5, chọn 5/10/15/20; đổi query đã áp dụng về trang đầu.
- UTC trong DB/JSON, giờ Việt Nam trên UI; hiển thị một chữ số không làm mất độ chính xác DB.
- Client không sinh reading, không tự xác nhận LED hoặc dùng STOMP SEND để sửa dữ liệu.

### 2.5 Yêu cầu phi chức năng

B04: yêu cầu → tiêu chí quan sát → phép thử. Nhóm xác thực/JWT/BCrypt/allowlist origin-topic; nhất quán DB commit trước event; reconnect MQTT, REST khi broker mất, REST tải lại sau WS reconnect; loading/rỗng/lỗi/chờ/responsive; cấu hình ngoài source và giữ volume.

Không tự đặt số liệu độ trễ, tải, số client hay uptime khi chưa đo.

### 2.6 Kịch bản và tiêu chí nghiệm thu

Một phiên đầy đủ: login → reading trên Dashboard → ON/OFF → history → tra cứu SensorData → sửa Profile → reload/reconnect. Bảng mục tiêu–kịch bản xác định điều kiện đạt, chưa ghi PASS.

## 6. Chương 3 Thiết kế

Chương chính, tham khảo 22–29 trang. Triển khai và kiểm thử đặt trong chương này để giữ đúng bốn chương.

### 3.1 Kiến trúc tổng thể và giao tiếp

- Vai trò ESP32, Mosquitto, Spring Boot, MySQL, React; REST/JWT, MQTT và STOMP native WebSocket phục vụ việc gì.
- Frontend không nối MQTT/MySQL trực tiếp; ESP32 không gọi DB.
- F02 kiến trúc logic: mũi tên có hướng và tên giao thức.
- F03 triển khai: Browser → Nginx:8088 → Spring Boot:8080 trong cùng container app; MySQL container hiện có qua host:3307; Mosquitto cùng Compose, app gọi mosquitto:1883; ESP32 qua Wi-Fi/IP LAN laptop:1325.
- B05: thành phần, vai trò, môi trường/cổng; không ghi credentials.
- Compose hiện quản lý app/Mosquitto; MySQL vẫn là container riêng với volume cũ, start.ps1 khởi động nó trước Compose. Không mô tả MySQL đã nằm trong Compose này.
- Phân biệt IP LAN:1325 cho ESP32, mosquitto:1883 cho app, host.docker.internal:3307 cho DB và localhost của từng môi trường.

Đối chiếu: compose.yaml, compose.bth4.yaml, Dockerfile, docker/nginx.conf, docker/supervisord.conf, services/api.js, services/realtime.js.

### 3.2 Thiết kế phần cứng và firmware

- **3.2.1 Thành phần:** ESP32, DHT11, LDR LM393 AO, hai LED, breadboard, dây, điện trở/nguồn theo mạch thật. B06 danh mục, số lượng, nhiệm vụ; không đoán điện trở/điện áp từ mẫu.
- **3.2.2 Nối dây:** F04 sơ đồ chân; F05 ảnh mạch thật; B07 GPIO/nguồn. Sketch hiện dùng DHT GPIO4, LDR GPIO34, LED1 GPIO18, LED2 GPIO19; phải đối chiếu mạch và binary đã nạp.
- **3.2.3 Firmware:** F06 lưu đồ setup, Wi-Fi/MQTT, callback, đọc và publish mỗi khoảng 2 giây. Chỉ đưa đoạn code quan trọng, không chụp toàn bộ sketch nhiều trang.
- **3.2.4 Đại lượng:** DHT đọc lỗi có thể bỏ hai reading; LDR trung bình 10 mẫu, ADC ánh xạ sang lux ước lượng. Sketch hiện xấp xỉ 0–200, không tự ghi 1–200 hoặc độ chính xác chuẩn khi chưa chốt/hiệu chuẩn.
- digitalRead trên chân output xác nhận mức GPIO, chưa chứng minh bóng LED còn tốt/phát sáng nếu không có phản hồi độc lập.

Không chụp config.h còn Wi-Fi/MQTT secrets. Ảnh phải là mạch của chính dự án. Firmware trên máy chưa đủ chứng minh bản đã nạp trên ESP32.

### 3.3 Thiết kế cơ sở dữ liệu

- **3.3.1 Mô hình:** F07 ERD năm bảng; User–ActionHistory, Device–ActionHistory, Sensor–SensorData là 1–N.
- **3.3.2 Từ điển:** B08–B12 cho năm bảng: tên cột, kiểu SQL, PK/FK/UNIQUE/NULL, ý nghĩa. Theo schema.sql thực: DATETIME(6), DECIMAL(12,4), không lấy kiểu của mẫu cũ.
- **3.3.3 Vòng đời:** cấu hình hiện tại 3 User/3 Sensor/2 Device; seed chỉ thêm username còn thiếu, không đặt lại hồ sơ/mật khẩu. reading/history phát sinh; requestId=ActionHistory.id; không có bảng notification thứ sáu. Người thực hiện lấy qua FK User, không thêm cột SQL.
- **3.3.4 Lưu trữ:** UTC, index Sensor/Device và thời gian, lý do lưu từng reading độc lập.

Ví dụ dữ liệu phải phân biệt fixture BTH3 và ESP32, không đưa hash thật hoặc toàn bảng User vào ảnh.

### 3.4 Chức năng đăng nhập UC01

1. **3.4.1 Đặc tả:** mục tiêu, tiền/hậu điều kiện, luồng thành công, sai thông tin, hết phiên; bảng UC ngắn, dẫn yêu cầu ở Chương 2.
2. **3.4.2 Giao diện:** F08 Login thật, username/password, nút và loading/lỗi. Không thêm đăng ký/quên mật khẩu.
3. **3.4.3 Sequence:** F09 User → Login → AuthController → UserRepository/MySQL → BCrypt → JwtEncoder → Frontend; nhánh 401. JWT khác mật khẩu; Backend xác minh chữ ký, Frontend chỉ kiểm tra phiên sơ bộ.
4. **3.4.4 API:** POST /api/auth/login; body username/password; 200 token, 400/401. Ví dụ không dùng mật khẩu/token thật.
5. **3.4.5 Triển khai:** services/api.js lưu JWT cho phiên, gắn bearer; ProtectedRoute; SecurityConfig; JWT sub là User.id. localStorage không là nguồn số đo/LED/Profile.
6. **3.4.6 Kiểm tra:** đúng/sai, thiếu/sai/hết hạn token, reload phiên, logout; bảng kết quả có mã thử và minh chứng.

Source: Login.jsx, ProtectedRoute.jsx, services/api.js, AuthController.java, SecurityConfig.java.

### 3.5 Chức năng Dashboard và giám sát realtime UC02

1. **3.5.1 Đặc tả:** ba card, chart, hardware và LED; chưa reading thì N/A/chart rỗng, Offline giữ số đo cuối.
2. **3.5.2 Giao diện:** F10 Dashboard bản cuối, tên Việt/icon/chú giải/trạng thái/thời gian. Screenshot fixture chỉ chứng minh UI, không chứng minh telemetry thật.
3. **3.5.3 Sequence tải/phục hồi:** F11 mở trang → GET Dashboard → DB → render; STOMP CONNECT/SUBSCRIBE chạy độc lập, reconnect GET lại. Không vẽ bắt buộc mọi kết nối phải đợi REST xong nếu code không bảo đảm.
4. **3.5.4 Sequence telemetry:** F12 ESP32 → iot/sensor/data → validate Sensor active/value → SensorData commit → /topic/sensors → UI; hardware theo telemetry hợp lệ, nhánh bỏ payload sai.
5. **3.5.5 API/event:** GET /api/dashboard, giải thích latest/chart/hardware/devices, key ba Sensor.code. JSON telemetry MQTT và DTO STOMP sensors/hardware đặt ngay đây.
6. **3.5.6 Biểu đồ:** Một biểu đồ SVG chung ba đường, mapping theo Sensor.code. Mỗi Sensor giữ 15 bản ghi mới nhất theo recordedAt; trục X gồm 15 vị trí thứ tự cố định, nhãn giờ lấy từ reading nhiệt độ tương ứng và cập nhật theo dữ liệu, không phải thang thời gian liên tục hoặc chu kỳ chung. Khi đủ 15, ba đường có cùng vị trí đầu/cuối; nhãn trục căn đúng điểm. Một trục Y chung giữ nguyên giá trị/đơn vị. Chú giải chỉ tên/màu/đơn vị, bấm để ẩn/hiện đường. Tooltip từng Sensor có giá trị và ngày giờ thật riêng. Chỉ cập nhật khi nhận dữ liệu, không animation trượt, không tạm dừng. UI một chữ số, DB giữ độ chính xác gốc.
7. **3.5.7 Kiểm tra:** rỗng/tải đầu, ba Sensor đúng loại/đơn vị, chart 15 mỗi series, Online/Offline 30 giây, payload sai không kéo Online, reconnect khớp REST/DB. Thu một chuỗi bằng chứng cùng reading ID/time.

Source: Dashboard.taiDashboard/xuLyRealtime; utils/dashboard.capNhatDashboardRealtime; EnvironmentChart/chartModel; SensorCard; realtime.js; ReadService.dashboard; TelemetryService; RealtimePublisher.

### 3.6 Chức năng điều khiển LED UC03

1. **3.6.1 Đặc tả:** mọi ON/OFF hợp lệ có history kể cả trùng; tách trạng thái ghi nhận của LED và trạng thái xử lý lệnh.
2. **3.6.2 Giao diện:** F13 crop card LED trước/chờ/sau. Nút sáng gợi ý thao tác tiếp: OFF làm nổi Bật, ON làm nổi Tắt; icon/nhãn vẫn theo Device.status đã xác nhận.
3. **3.6.3 Sequence chính:** F14 React → POST → transaction history/commit → MQTT command → 202 → ESP32 GPIO → MQTT status → validate/commit → STOMP device → UI. 202 và status là hai kênh; không khẳng định thứ tự đến UI luôn cố định.
4. **3.6.4 Nhánh lỗi:** F15 timeout/late/old ack, tách sơ đồ phụ nếu chật. Bảng xử lý PENDING→CONFIRMED hoặc TIMEOUT→CONFIRMED khi muộn. Device.status vẫn chỉ ON/OFF.
5. **3.6.5 API/message:** POST /api/devices/{deviceId}/actions, body chỉ action; 202 requestId/status ACCEPTED; 400/401/404; 503 có requestId. Command/status MQTT đúng ba key. /topic/devices có status hiện tại, historyStatus của request, confirmedAt, deviceStatusUpdated, deliveryState; /topic/notifications có DEVICE_TIMEOUT.
6. **3.6.6 Nhất quán:** requestId=history.id, confirmedAt null lúc tạo; chống lặp/ack cũ ghi đè mới, Action có thể khác Status. Timer UI 11 giây chỉ GET kiểm tra Backend, không tự xác nhận. Responder mô phỏng BTH3 đã gỡ.
7. **3.6.7 Kiểm tra:** ON/OFF hai LED thật, trùng lệnh, Action khác Status, sai ID/code/status, lặp, timeout, muộn, đảo thứ tự. Status do terminal tạo phải ghi nguồn terminal, không xem là GPIO ESP32 đã thực hiện.

Source: DeviceControl; Dashboard.dieuKhienThietBi/kiemTraYeuCau; DeviceCommandController/Service; MqttGateway; callback firmware; DeviceStatusService; RealtimePublisher.

### 3.7 Chức năng Dữ liệu cảm biến UC04

1. **3.7.1 Đặc tả:** chỉ đọc SensorData; Tìm theo kết hợp từ khóa, sort/page server.
2. **3.7.2 Giao diện:** F16 bản cuối. Dropdown Tất cả/Nhiệt độ/Độ ẩm/Ánh sáng/Thời gian, từ khóa và Tìm kiếm; đổi lựa chọn chưa áp dụng ngay. Hướng tăng/giảm theo ID; size mặc định 5, chọn 5/10/15/20, điều hướng < và cụm ba số rồi >. Số dòng bên trái, tổng hiển thị bên phải. Bảng ID/Loại/Giá trị/Thời gian.
3. **3.7.3 Sequence:** F17 draft form → submit → điều kiện áp dụng/page 0 → GET → validate → SensorData join Sensor → search/filter → sort → pagination → response → bảng. loop cho lần truy vấn tiếp, alt cho rỗng/lỗi. Không lọc một trang ở client thành toàn kết quả.
4. **3.7.4 API:** GET /api/sensor-data; bảng query sensorType/search/searchField/from/to/sortBy/order/page/size. Phân biệt tham số UI đang gửi và khả năng API không có ô riêng trên UI. Response content/page/size/totalElements/totalPages; row id/sensorCode/sensorType/value/unit/recordedAt.
5. **3.7.5 Ví dụ và triển khai:** request thực từ Network/Swagger và response khớp bảng, thời gian chuyển đúng. page API bắt đầu từ 0, số trang UI bắt đầu từ 1; thời gian hiển thị Việt Nam khác UTC truyền API.
6. **3.7.6 Kiểm tra:** dropdown chưa lọc trước submit; giá trị một chữ số/kèm đơn vị; ngày/giờ; size từng mốc, sort/page, đổi query về trang đầu, rỗng/error. Chỉ ghi tìm thời gian đạt sau khi xử lý sai khác định dạng hiện có.

Source: DataSensor.jsx; Pagination; api.buildQueryString; ReadController.sensorData; ReadService.sensorData/timeSearch.

### 3.8 Chức năng Lịch sử điều khiển UC05

1. **3.8.1 Đặc tả:** đọc yêu cầu và ghi nhận; không suy Action thành Status.
2. **3.8.2 Giao diện:** dùng ảnh history ngày 27/10: dòng trên tìm theo thời gian + Thứ tự; dòng dưới Device/Action/Status/Xóa lọc. Status: Tất cả, Processing, Bật, Tắt. Sáu cột: ID/Thiết bị/Người thực hiện/Lệnh/Trạng thái/Thời gian; không thêm cột Xử lý đã bị loại. Size/page cùng Data Sensor.
3. **3.8.3 Sequence:** ngày/giây → from/to UTC → kết hợp device/action/status → join User và Device, sort/page DB → bảng có username từng history. Dropdown history hiện áp dụng khi thay đổi, khác draft dropdown của Data Sensor; mô tả đúng hai hành vi.
4. **3.8.4 API:** GET /api/action-history; bảng query whitelist giữ nguyên; row thêm username cạnh action/status/confirmedAt/deliveryState. Username là người gửi qua JWT → ActionHistory.userId → User.username, không phải người xem; client không được khai actor trong command body. PROCESSING lọc PENDING dưới 10 giây, không gồm TIMEOUT.
5. **3.8.5 Triển khai:** createdAt lúc yêu cầu, confirmedAt lúc ack; devices/notifications refresh bảng, reconnect GET lại. Giải thích UI rút gọn khác DTO nhưng không được diễn giải timeout như thành công.
6. **3.8.6 Kiểm tra:** ngày/giây, ba dropdown, Processing khi chờ, sau ack/timeout/muộn, sort/page/size/empty/error. Cần rà lại cách UI thể hiện TIMEOUT vì hiện nhãn trở về ON/OFF theo status mà không có cột deliveryState riêng.

Source: ActionHistory.jsx; dateTime.js; ReadController/ReadService.actionHistory; ActionHistory entity.

### 3.9 Chức năng Hồ sơ UC06

1. **3.9.1 Đặc tả:** hồ sơ chính mình; xem/edit/lưu/hủy; GitHub/Figma/API Docs/Report.
2. **3.9.2 Giao diện:** F20 xem và chỉnh sửa, có thể hai phần cùng hình; chỉ công bố thông tin cá nhân cần thiết.
3. **3.9.3 Sequence:** F21 GET theo JWT sub → sửa draft → PUT → validate/unique → DB → response; Hủy về dữ liệu cũ, không PUT.
4. **3.9.4 API:** GET/PUT /api/profile; tám trường fullName/studentCode/email/githubUrl/figmaUrl/apiDocsUrl/reportUrl/avatarUrl. Không nhận userId/username/passwordHash; response không hash; 400/401/409.
5. **3.9.5 Triển khai:** fullName/studentCode/email bắt buộc; URL tùy chọn, avatar HTTPS; PUT thay đủ tám trường. Ảnh mặc định là asset Frontend khi không có URL; không viết đã có upload ảnh server.
6. **3.9.6 Kiểm tra:** đúng User, lưu/reload bền vững, hủy không đổi DB, input/trường cấm/URL bị chặn, liên kết trống. Unique 409 cần điều kiện tạo trùng có kiểm soát; nếu chưa thử thì ghi chưa thử.

Source: Profile.jsx; ProfileController/ProfileService; User entity.

### 3.10 Triển khai và tài liệu vận hành

- **3.10.1 Build/chạy:** Vite build, Maven Spring Boot JAR, Docker Nginx+Java; biến môi trường ngoài source, giữ volume.
- **3.10.2 BTH4:** Compose gốc chạy app + Mosquitto, host publish 1325; MySQL giữ riêng, đúng một Backend; không đưa nội dung .env/config.h/password file thật vào bài.
- **3.10.3 Swagger:** F22 tổng quan đủ 7 thao tác REST; login, Authorize, Try it out. Chi tiết API đã đặt trong từng chức năng, không chép lại hết tại đây.
- **3.10.4 Sẵn sàng/khôi phục:** app healthy kiểm tra HTTP, broker healthy thử xác thực MQTT qua SYS; chưa chứng minh ESP32/GPIO; quy trình start.ps1, reconnect, stop không xóa volume.
- B13 môi trường/phiên bản thật của lần kiểm tra cuối. React/Vite lấy bản resolve từ lockfile, không coi chữ latest trong package.json là số phiên bản.

### 3.11 Kiểm thử tích hợp và đánh giá

- Ghi setup/ngày thử, board/sketch/binary xác nhận thế nào, broker/DB/web, môi trường và nguồn dữ liệu.
- Bảng TC, mục tiêu, thao tác, mong đợi, thực tế, PASS/FAIL/chưa thử, mã bằng chứng. Dẫn kiểm tra riêng ở 3.4–3.9 để tránh lặp.
- F23 reading thật qua broker/DB/REST/STOMP/UI cùng ID/time; F24 command thật cùng requestId/ack/history/UI và ảnh/video LED vật lý.
- Nếu đo độ trễ, dùng cùng đồng hồ, cùng requestId và nêu số lần/cách đo. Không tự khẳng định độ trễ thấp hoặc dùng hai timestamp khác đồng hồ làm kết quả chắc chắn.
- Phân biệt terminal và ESP32. Build hoặc HTTP test cũ không thay kiểm chứng phần cứng.

## 7. Chương 4 Kết luận

Tham khảo 2–3 trang.

| Mục | Viết gì | Minh chứng |
| --- | --- | --- |
| 4.1 Kết quả đạt được | Đối chiếu mục tiêu Chương 1; sản phẩm cụ thể mạch/web/Backend/DB/Swagger, chỉ nêu đạt khi có chứng cứ. | Bảng mục tiêu → kết quả → mục/hình/TC ở Chương 3. |
| 4.2 Hạn chế | Lux ước lượng/chưa hiệu chuẩn; GPIO chưa phản hồi bóng sáng độc lập; mạng nội bộ, QoS0 có thể mất message; notification không lưu, một Backend; truyền tải chưa TLS nếu vẫn đúng bản nộp. | Nêu tác động, không thêm hạn chế không tồn tại. |
| 4.3 Hướng phát triển | Hiệu chuẩn, phản hồi độc lập, TLS, retry/idempotency/QoS phù hợp, Compose toàn dịch vụ nếu chưa làm, cảnh báo/tự động hóa sau này. | Gắn từng hướng với hạn chế; JWT/Swagger đã có không viết như chưa triển khai. |

Không đưa kiểm thử dài/log/code mới vào Kết luận. Không kết luận end to end ổn định khi thiếu phép thử BTH4.

## 8. Danh mục hình cần chuẩn bị

Mã F dùng quản lý kế hoạch; khi viết sẽ đánh số Hình2.x/3.x theo thứ tự thật. Khoảng24 hình là phương án đầy đủ, không phải chỉ tiêu của thầy; có thể gộp hoặc đưa minh chứng phụ sang phụ lục.

| Mã | Hình | Đặt ở | Chuẩn bị |
| --- | --- | --- | --- |
| F01 | Use Case sáu UC | 2.2 | Vẽ lại theo TH1, thống nhất tên. |
| F02 | Kiến trúc logic | 3.1 | Hiệu chỉnh hình TH1 theo sản phẩm cuối. |
| F03 | Kiến trúc triển khai | 3.1 | Docker/Windows/ESP32 đúng hiện trạng. |
| F04 | Sơ đồ nối dây | 3.2 | Chốt chân/nguồn/điện trở theo mạch. |
| F05 | Mạch thật | 3.2 | Chụp rõ board, DHT, LDR, hai LED. |
| F06 | Lưu đồ firmware | 3.2 | setup/loop/callback/reading. |
| F07 | ERD 5 bảng | 3.3 | Theo schema.sql, đủ quan hệ/ràng buộc. |
| F08 | Login thật | 3.4 | Không lộ mật khẩu/token. |
| F09 | Sequence login | 3.4 | Đúng/sai, BCrypt/JWT. |
| F10 | Dashboard cuối | 3.5 | Ghi rõ dữ liệu thật hay fixture. |
| F11 | Sequence tải/reconnect | 3.5 | REST và STOMP phối hợp. |
| F12 | Sequence telemetry | 3.5 | ESP32/MQTT/commit/STOMP/UI. |
| F13 | LED trước/chờ/sau | 3.6 | Crop thành các phần cùng hình. |
| F14 | Sequence command/status | 3.6 | requestId và commit trước publish. |
| F15 | Sequence timeout/late/old ack | 3.6 | Tách hình phụ nếu chữ quá nhỏ. |
| F16 | Data Sensor | 3.7 | Có query/page phù hợp dữ liệu. |
| F17 | Sequence Data Sensor | 3.7 | Form/API/query/DB/bảng. |
| F18 | Action History | 3.8 | Action khác Status, pending nếu cần. |
| F19 | Sequence History | 3.8 | Query/time/sort/page. |
| F20 | Profile xem/edit | 3.9 | Hai phần cùng hình, che thông tin riêng không cần. |
| F21 | Sequence Profile | 3.9 | GET/PUT/hủy và JWT. |
| F22 | Swagger tổng quan | 3.10 | Bảy thao tác, không JWT thật. |
| F23 | Đối chiếu telemetry thật | 3.11 | Broker/DB/REST/WS/UI cùng reading. |
| F24 | Đối chiếu command thật | 3.11 | requestId/status/history/UI/LED thật. |

Mỗi hình có câu dẫn, caption và giải thích điều cần quan sát. Sơ đồ đủ nét; sequence quá dài tách luồng, không ép chữ nhỏ. Không thêm logo công nghệ lớn hoặc ảnh mã nguồn dài để tăng số trang. Dùng ảnh của mình, không mượn ảnh kết quả/mạch từ ba mẫu.

## 9. Danh mục bảng

- B01: use case tổng quát và mục thiết kế tương ứng.
- B02: Sensor.code, đại lượng, đơn vị và nguồn vật lý.
- B03: quy tắc nghiệp vụ và tiêu chí kiểm chứng.
- B04: yêu cầu phi chức năng và phép thử.
- B05: thành phần, giao thức và cổng.
- B06: linh kiện, số lượng, vai trò; B07: kết nối GPIO và nguồn.
- B08–B12: từ điển dữ liệu năm bảng CSDL.
- Sáu bảng use case ngắn tại 3.4–3.9 nếu cần chi tiết như TH1.
- Bảng API theo từng chức năng: Method, path, JWT, input, output, mã lỗi. Sensor/History cần bảng query và whitelist; Profile cần danh sách trường được sửa; LED cần phân biệt action, status, deliveryState.
- Bảng kiểm tra riêng cho từng chức năng và bảng tổng hợp tích hợp tại 3.11, không lặp lại nguyên test dài.
- B13: phiên bản và môi trường lần chạy cuối; bảng đối chiếu mục tiêu/kết quả tại 4.1.

Mã B chỉ để kiểm kê; khi viết đánh số theo chương và thứ tự xuất hiện. Luồng xử lý và quyết định thiết kế nên giải thích bằng đoạn văn, không cố đưa mọi nội dung vào bảng.

## 10. Sai khác và việc cần chốt

| Nội dung | Tài liệu cũ | Thực tế và việc cần làm |
| --- | --- | --- |
| Cấu trúc | Mẫu cũ có năm chương, tách UI/API/sequence. | Bốn chương; chức năng liền mạch trong Chương 3. |
| Bảng UC của TH1 | Mô tả UC01–UC03 lệch tên. | Theo đặc tả UC chi tiết; sửa bảng trong báo cáo mới, giữ TH1 gốc. |
| API History trong TH1 | Ghi nhầm tra cứu cảm biến. | Ghi đúng tra cứu lịch sử điều khiển. |
| Mô hình mẫu cũ | Hai bảng, hàng gộp ba đại lượng. | Năm bảng, mỗi reading riêng, không có SensorSample. |
| Công nghệ/API | Node/Express, Socket.IO, /api/sensors, /api/history, limit/sort_key. | Spring Boot, STOMP native, endpoint và query theo controller hiện có. |
| Phân trang | TH1 tối đa 20; wireframe nhiều nút. | UI mặc định 5, chọn 5/10/15/20, điều hướng gọn; vẫn tối đa 20. |
| Tìm thời gian Sensor | From/To đổi thành chọn Thời gian và từ khóa. | Frontend gửi dd/MM/yyyy vào searchField=TIME; Backend.timeSearch nhận yyyy-MM-dd hoặc ISO có offset. Tái hiện và sửa ở lượt code riêng trước khi ghi PASS. |
| Sort | TH1 có nhiều trường sort trên UI. | UI hiện sortBy=ID và hướng; Backend hỗ trợ nhiều trường theo whitelist. Phân biệt khả năng UI và API. |
| History | TH1 có From/To. | UI tìm ngày/giây rồi chuyển thành from/to UTC; Processing=PENDING. Rà lại TIMEOUT đang chỉ hiện ON/OFF trong bảng để không diễn giải nhầm. |
| Chart | 15 điểm dễ bị hiểu thành tổng 15. | 15 mỗi Sensor; timestamp có thể khác; một biểu đồ chung, trục Y chung, không quy đổi đơn vị. |
| Offline | TH1 có nhãn dữ liệu cũ dưới card. | UI đã bỏ nhãn; còn banner/lastSeenAt, giữ số đo cuối. |
| Avatar | TH1 diễn đạt rộng về ảnh. | avatarUrl HTTPS và asset mặc định; chưa có upload server. |
| Lux | Mong muốn 1–200; mẫu cũ có giá trị lớn. | Sketch hiện xấp xỉ 0–200; xác nhận binary đã nạp và ghi lux ước lượng, không báo độ chính xác chưa đo. |
| Xác nhận LED | Dễ coi 202 hoặc GPIO feedback là bóng đã sáng. | 202 là tiếp nhận; MQTT status xác nhận GPIO; ảnh/video/quan sát LED thật mới chứng minh sáng ở phép thử. |
| Docker | Mong muốn toàn hệ thống Compose. | App gộp Frontend+Backend và Mosquitto cùng Compose, host1325; DB container riêng giữ volume cũ. Không ghi MySQL đã được Compose quản lý. |
| Tích hợp | ESP32 → broker đã được người dùng báo thành công, có test terminal trước đây. | Ngày20/10 broker Docker xác thực thành công và Backend đã subscribe, SensorData tăng; chưa có bằng chứng đối chiếu đầy đủ ESP32/REST/STOMP/UI và GPIO. Thu đủ trước kết luận. |
| Dữ liệu BTH3 | Fixture/history mô phỏng từng lưu thật trong DB. | Không coi là reading/ack từ ESP32; định danh nguồn, không xóa DB trong giai đoạn lập kế hoạch. |

## 11. Checklist bằng chứng BTH4

Chưa chạy các phép thử dưới đây trong lượt đọc/lập đề cương. Thực hiện trước khi viết kết quả.

| Mã | Kịch bản | Bằng chứng cần giữ |
| --- | --- | --- |
| T01 | Login đúng/sai, reload/logout | UI và HTTP status, không chụp token/mật khẩu. |
| T02 | API/STOMP thiếu hoặc sai JWT | 401/STOMP ERROR, không lộ dữ liệu. |
| T03 | Reading hợp lệ từng Sensor | Payload, SensorData ID/code/value/time, REST/event/UI. |
| T04 | Hơn 15 reading mỗi Sensor | Chart giữ đúng 15 điểm mỗi Sensor, bỏ điểm cũ khi có điểm mới; không tự trượt theo đồng hồ, DB vẫn giữ lịch sử. |
| T05 | Payload lỗi, Sensor lạ, value sai | Không tạo dòng hoặc kéo dài Online. |
| T06 | Ngừng telemetry 30 giây rồi gửi lại | Offline/Online, LED không tự OFF. |
| T07 | ON/OFF hai LED thật | Cùng requestId ở command/status/history, ảnh/video LED; UI đổi sau ack. |
| T08 | Lệnh trùng trạng thái | Có history mới, không bỏ yêu cầu. |
| T09 | Không có ack sau 10 giây | TIMEOUT, confirmedAt null, Device giữ nguyên. |
| T10 | Ack muộn | History CONFIRMED, không ghi đè request mới hơn. |
| T11 | Ack lặp/sai ID/code/status | Không xác nhận giả, không sửa timestamp đầu; ghi nguồn terminal nếu dùng. |
| T12 | Ack ngược thứ tự | Hai history đúng, Device theo request mới hơn đã xác nhận. |
| T13 | Broker ngắt/nối | REST vẫn phục vụ, reconnect; có kế hoạch tránh ảnh hưởng dữ liệu thật. |
| T14 | WebSocket ngắt/nối, reload | REST phục hồi state, không tự sinh giá trị. |
| T15 | Sensor search giá trị/thời gian | Đúng query/loại/đơn vị/ngày, tìm trên toàn DB. |
| T16 | History search/dropdown | Bảng và totalElements khớp REST/DB. |
| T17 | Sort/page/size 5/10/15/20, query sai | ID đúng hướng; size>20, page âm, from>to bị chặn. |
| T18 | Profile lưu/hủy/reload/input sai | Lưu bền vững; hủy không PUT; trường cấm bị chặn. |
| T19 | Desktop và màn hẹp | Không tràn nút/bảng, các trạng thái rõ. |
| T20 | Build/Swagger | Vite/Maven/healthcheck/OpenAPI bảy thao tác; không thay bằng chứng ESP32. |

Mỗi bằng chứng có ngày, môi trường, nguồn ESP32/terminal/fixture, khoảng UTC và ID. Chỉ dọn đúng ID thử khi thực hiện, không reset bảng hoặc seed lại. Không tự chạy script cũ có dừng broker hoặc ghi/dọn fixture khi ESP32 đang hoạt động.

## 12. Tài liệu tham khảo và phụ lục

Sau Chương 4, không thành chương thứ năm:

- Tài liệu chính thức thực sự dùng: Espressif/ESP32, DHT11/module, MQTT/Mosquitto, Spring Boot/Security, STOMP/WebSocket, MySQL, React/SVG, springdoc. Xác minh URL, phiên bản và ngày truy cập khi viết; không tạo thông tin trích dẫn chưa kiểm tra.
- TH1 là tài liệu của chính sinh viên. Các mẫu cũ giúp tham khảo cách trình bày, không là nguồn thông số/hành vi kỹ thuật của sản phẩm mới.
- Phụ lục A: cách chạy và cấu trúc thư mục; không đính kèm .env/config.h thật.
- Phụ lục B: bảng API tổng hợp nhanh hoặc link Swagger; không thay phần API theo chức năng.
- Phụ lục C: test log/JSON/đối chiếu mở rộng, đã che secrets.
- Phụ lục D: repository/video/Figma/report cuối, chỉ link có thật và được phép công bố.

## 13. Dung lượng và phong cách

Người dùng tự format theo phong cách TH1, không yêu cầu tạo Word ở lượt PLAN. Không áp mẫu, phông hoặc bìa mới. Ước lượng nội dung: Chương 1 khoảng 2–3 trang, Chương 2 khoảng 5–7, Chương 3 khoảng 22–29, Chương 4 khoảng 2–3; tổng chính khoảng 31–42 trang, ngoài phần đầu/tham khảo/phụ lục. Đây không là hạn mức thầy yêu cầu hoặc số trang phải kéo cho đủ.

Ưu tiên hình/bảng đọc được, caption và thuật ngữ thống nhất. Không ép sequence dài thành chữ nhỏ. Mỗi đoạn code phải có mục đích giải thích; JSON đặt dưới API liên quan, không có mật khẩu hoặc JWT thật.

## 14. Thứ tự thực hiện sau khi duyệt

1. Chốt đề cương bốn chương và vị trí bảng UC; giữ phong cách TH1 do người dùng format.
2. Chốt sản phẩm cuối: chênh định dạng TIME, cách UI thể hiện TIMEOUT, firmware/broker và phạm vi Docker; sửa code ở lượt riêng.
3. Hoàn thành kiểm thử BTH4, định danh dữ liệu, thu ảnh sạch theo checklist.
4. Vẽ kiến trúc, ERD, nối dây, sáu sequence chính; Dashboard/command có sơ đồ phụ nếu cần.
5. Viết Chương 2 để khóa yêu cầu; viết Chương 3 từ 3.1 đến 3.10, hoàn thành từng chức năng UI → sequence → API → kết quả rồi sang phần tiếp.
6. Điền 3.11 từ bằng chứng, viết Chương 1 đúng phạm vi và Chương 4 cuối cùng.
7. Người dùng ghép/format Word; kiểm tra nhất quán nội dung, caption/tham chiếu và PDF xuất cuối.
8. Soát mục tiêu có test, UI khớp API, sequence khớp commit/event, không lẫn fixture với ESP32, không secrets hoặc endpoint mượn từ mẫu.

Có thể bắt đầu bản nháp yêu cầu/thiết kế trước khi đủ ảnh mới. Những phần chờ kiểm chứng đánh dấu nội bộ; chưa ghi PASS, độ trễ hoặc kết luận end to end. Lượt PLAN này chỉ tạo tài liệu kế hoạch, không sửa ứng dụng/firmware, không đổi runtime/DB.


## Bộ minh chứng đã thu 21/10/2026

Đã tạo [bộ minh chứng](Evidence/2026-10-21/README.md) trước khi người dùng rút ESP32: 26 ảnh UI, 420 reading khớp SQL/STOMP, 140 message mỗi Sensor, bốn ON/OFF có requestId/status khớp và hai timeout sau khi rút. Xem bảng kiểm thử để chỉ ghi PASS các phép đã thực hiện.

Ảnh mạch/Serial và xác nhận firmware đã nạp do người dùng bổ sung vào [hardware-photos](Evidence/2026-10-21/hardware-photos/README.md). Có thể bắt đầu viết bốn chương và vẽ sơ đồ khi phần cứng không cắm; không dùng screenshot Processing rỗng như bằng chứng một hàng PENDING.

## Resource bổ sung 27/10/2026

[Bộ cập nhật](Evidence/2026-10-27/README.md) có ảnh History mới, kết quả kiểm tra đa tài khoản và snapshot OpenAPI đã loại example. Bốn test Backend dùng H2/MQTT mock và 12 test Frontend đạt; API thật được kiểm tra login/Profile/History/Dashboard/SensorData cho cả ba tài khoản. Không gửi lệnh LED thật trong lượt này; không đổi các kết quả requestId 564–569 ngày 21/10.

Các ảnh F18 ngày 21/10 dùng cho diễn giải các lệnh thật, không làm ảnh bố cục History hiện tại. Các ảnh pending LED cũ chỉ minh họa trạng thái tại lúc thu; bản hiện tại dùng thông báo ON xanh/OFF đỏ. Dùng [RESOURCE_INDEX](Report/RESOURCE_INDEX.md) để chọn ảnh, schema và giới hạn phép thử.
