# BASE DỰ ÁN — Hệ thống IoT giám sát môi trường và điều khiển thiết bị

**Phiên bản:** 1.0 · **Ngày lập:** 05/10/2026 · **Mục đích:** tài liệu nền thống nhất để thực hiện BTH3 và BTH4.

> **Cách dùng:** Trước khi sửa code, API, cơ sở dữ liệu hoặc báo cáo, đối chiếu mục liên quan trong file này. Nội dung ghi **[ĐÃ NỘP]** là cam kết trong báo cáo BTH1; **[ĐÃ DEMO]** là hành vi của `DemoB2.ino` ở BTH2; **[DỰ KIẾN]** là thiết kế chưa được kiểm chứng bằng hệ thống tích hợp; **[CẦN KHÓA]** phải quyết định và cập nhật cùng lúc ở mọi thành phần liên quan. Không coi code mock hoặc tài liệu kế hoạch là bằng chứng backend đã chạy.

## 1. Nguồn, thứ tự ưu tiên và tình trạng

| Nguồn | Vai trò |
| --- | --- |
| `TH1_IOT_V5(4).docx` | **Bản đặc tả BTH1 đã nộp**, ưu tiên cao nhất về phạm vi, dữ liệu, use case, giao diện và quy tắc nghiệp vụ. Lỗi đánh máy trong bảng tổng hợp được giải bằng nội dung use case chi tiết. |
| `Cac_giao_dien.docx` | Năm wireframe đã gắn với BTH1; là mốc bố cục và chức năng UI. |
| `DemoB2.ino` | Firmware đã dùng để demo Mosquitto ở BTH2; là bằng chứng triển khai cho chân GPIO, tần suất, topic và JSON đang chạy. |
| `BUSINESS & SYSTEM SPECIFICATION V5.docx` | Diễn giải sâu quy tắc và tình huống biên; áp dụng khi tương thích với BTH1. Các khuyến nghị của V5 chưa tự động là code đã có. |
| `IoT Communication Contract V1(1).docx` | Hợp đồng giao tiếp **đề xuất**; có ví dụ mâu thuẫn với BTH1 và firmware, phải hiệu chỉnh trước tích hợp. |
| `SrcCode_Frontend_V1.docx` | Bản chép mã frontend tham chiếu, không phải checkout source có thể chạy trực tiếp ở đây. Chủ yếu là mô phỏng. |
| `PM_Base_Backend.docx` | Kế hoạch triển khai backend, không phải bằng chứng backend đã hoàn thành. |
| `1.Start.docx` | Tài liệu lịch sử, có ESP8266 và mô hình cũ; không dùng làm chuẩn hiện hành. |

**Quy tắc khi có xung đột:** giữ hành vi đã nộp trong BTH1; dùng firmware BTH2 để biết hiện trạng tích hợp; chọn một giải pháp thực thi không phá cam kết BTH1; ghi lại quyết định mới vào mục 16 trước khi sửa code. Những điểm chưa khóa được liệt kê rõ, không tự đoán là đã thống nhất.

| Bài thực hành | Mục tiêu và tình trạng |
| --- | --- |
| BTH1 | Đặc tả hệ thống, CSDL, use case, sequence, API, giao diện. **Đã nộp** (`TH1_IOT_V5(4).docx`). |
| BTH2 | Demo Mosquitto với ESP32 và firmware. **Đã demo**, có `DemoB2.ino`; chưa chứng minh backend/website tích hợp. |
| BTH3 | Viết và hoàn thiện **frontend** theo bài nộp; có thể dùng mock để demo UI nhưng phải ghi rõ dữ liệu giả và chuẩn bị điểm nối API/WS. |
| BTH4 | Hoàn thiện **frontend + backend + Mosquitto + ESP32 + MySQL**, chạy end to end, demo, giải thích luồng và sửa code tại chỗ. |

## 2. Phạm vi và kiến trúc [ĐÃ NỘP]

- Một User được cấu hình sẵn; đăng nhập, không đăng ký, không quản lý nhiều vai trò.
- Ba cảm biến **logic**: nhiệt độ và độ ẩm từ DHT11, ánh sáng từ LDR LM393 AO; hai thiết bị điều khiển `LED1`, `LED2` qua ESP32 DevKit V1.
- Dashboard, Data Sensor, Action History, Profile; frontend React, backend Spring Boot, MySQL, Mosquitto. REST + JWT phục vụ login/truy vấn/lệnh; STOMP over **native WebSocket** đẩy cập nhật; MQTT nối backend với ESP32.
- ESP32 và laptop/server chung Wi‑Fi router/hotspot; ESP32 dùng **IP LAN hiện tại của laptop** để nối broker, không dùng `localhost`. USB cấp nguồn/nạp code/Serial, không truyền MQTT qua USB.
- Không thêm UI tự tạo sensor/device, đăng ký, phân vai hay bảng dữ liệu mới vào baseline. Có thể mở rộng sau khi ghi rõ thay đổi so với BTH1.

```text
DHT11 + LDR / LED1 + LED2 ↔ ESP32 ↔ Wi‑Fi ↔ Mosquitto ↔ Spring Boot ↔ MySQL
                                                         ↕ REST/JWT + STOMP/WS
                                                        React ↔ User
```

Backend chịu trách nhiệm xác thực, kiểm tra payload, quyết định thời điểm ghi CSDL, đối chiếu xác nhận theo `requestId`, đánh giá liveness/timeout và phát realtime. Broker chỉ trung chuyển. React không nối MQTT trực tiếp; ESP32 không nối MySQL.

## 3. Danh mục định danh và đơn vị [ĐÃ NỘP]

| Sensor.code | Sensor.type | Đơn vị | Nguồn vật lý |
| --- | --- | --- | --- |
| `DHT11_TEMP` | `TEMPERATURE` | `°C` | DHT11 |
| `DHT11_HUM` | `HUMIDITY` | `%RH` | DHT11 |
| `LDR_LIGHT` | `LIGHT` | `lux` | LDR LM393, AO → ADC → giá trị lux ước lượng |

`LED1` và `LED2` là **Device.code** (thiết bị bật/tắt), không phải tên ESP32. `ESP32_01` nếu được dùng thì chỉ là mã bộ điều khiển/nguồn telemetry hoặc MQTT client ID, **không thay thế** `LED1`/`LED2` trong lệnh và bảng `Device`. `Action ∈ {ON, OFF}` là điều User muốn; `Status ∈ {ON, OFF}` là trạng thái gần nhất đã ghi nhận/xác nhận. `PENDING`, `TIMEOUT`, `UNKNOWN`, `OFFLINE` là tình trạng xử lý/hiển thị, không ghi làm `Device.status`.

## 4. Năm bảng dữ liệu [ĐÃ NỘP]

| Bảng | Trường theo BTH1 | Ý nghĩa |
| --- | --- | --- |
| `User` | `id` BIGINT PK; `username` UNIQUE; `passwordHash`; `fullName`; `studentCode` UNIQUE; `email` UNIQUE; `githubUrl`, `figmaUrl`, `apiDocsUrl`, `reportUrl`, `avatarUrl` nullable; `createdAt`, `updatedAt` | Một tài khoản, thông tin Profile và tài nguyên. Không đưa password hash vào response. |
| `Sensor` | `id` BIGINT PK; `code` UNIQUE; `name`, `type`, `unit`, `active`, `createdAt`, `updatedAt` | Ba sensor logic và metadata đơn vị. |
| `SensorData` | `id` BIGINT PK; `sensorId` FK; `value` DECIMAL(12,4); `recordedAt` | **Một dòng = một giá trị của một sensor**. Không có `SensorSample`/`sampleId`. |
| `Device` | `id` BIGINT PK; `code` UNIQUE; `name`, `type`, `status`, `active`, `createdAt`, `updatedAt` | LED1, LED2; `status` chỉ ON/OFF đã xác nhận gần nhất. |
| `ActionHistory` | `id` BIGINT PK; `userId` FK; `deviceId` FK; `action`, `status`, `createdAt`, `confirmedAt` nullable | Một yêu cầu User, trạng thái chụp tại lúc tạo rồi cập nhật khi xác nhận. `id` chính là `requestId`. |

Quan hệ: `User 1—N ActionHistory N—1 Device`; `Sensor 1—N SensorData`. Không có bảng `Profile`, `HardwareStatus`, `Notification` trong BTH1. Một chu kỳ bình thường có tối đa ba reading/ba dòng `SensorData` nhưng không bảo đảm luôn đủ ba: khi DHT11 đọc lỗi, firmware đang bỏ temp/humidity và vẫn gửi ánh sáng. Không suy ra có một thực thể sample lưu trong CSDL.

**Ý nghĩa bản ghi chưa xác nhận:** Khi tạo lệnh, `ActionHistory.action = yêu cầu`, `ActionHistory.status = Device.status` lúc đó, `confirmedAt = NULL`. Vì vậy một dòng `action = OFF`, `status = ON`, `confirmedAt = NULL` có nghĩa là đã yêu cầu tắt nhưng LED vẫn được ghi nhận gần nhất là bật. Khi xác nhận hợp lệ, ghi trạng thái được ESP32 báo và thời điểm xác nhận; `action` không đổi. Trang lịch sử cần thể hiện đủ `Action`, `Status` và trạng thái đang chờ/không phản hồi dựa trên `confirmedAt` và deadline, tránh đọc nhầm `status` là kết quả của lệnh khi `confirmedAt` còn NULL.

## 5. Sáu use case và năm màn hình [ĐÃ NỘP]

| UC | Màn hình | Yêu cầu chính |
| --- | --- | --- |
| UC01 Đăng nhập | Login | Username/password tài khoản có sẵn; backend xác thực và cấp JWT; lỗi thì ở lại Login. |
| UC02 Xem Dashboard | Dashboard | Nhiệt độ/độ ẩm/ánh sáng mới nhất, tối đa **15 điểm** chart, hardware Online/Offline, trạng thái LED1/LED2, realtime. |
| UC03 Điều khiển thiết bị | Dashboard | Mỗi lần ON/OFF tạo history, kể cả lệnh trùng trạng thái; chờ xác nhận, timeout giữ trạng thái cũ. |
| UC04 Tra cứu dữ liệu cảm biến | Data Sensor | Dòng `ID, Sensor Type, Value, Time`; Search → From/To → Sort → Pagination, tối đa **20 dòng/trang**. |
| UC05 Tra cứu lịch sử điều khiển | Action History | Dòng `ID, Device, Action, Status, Time`; tìm kiếm/lọc/sắp xếp/phân trang, tối đa **20 dòng/trang**. |
| UC06 Xem và cập nhật Profile | Profile | Xem/sửa trường được phép, avatar và GitHub/Figma/API Docs/Report; không sửa tài khoản bất kỳ theo `userId` client. |

Năm wireframe trong `Cac_giao_dien.docx`: Login có form; Dashboard có sidebar, ba card, biểu đồ, hai ô LED; Data Sensor và Action History có vùng truy vấn, bảng, điều hướng trang; Profile có thông tin và nút chỉnh sửa. UI triển khai có thể hoàn thiện responsive/trạng thái lỗi nhưng phải nhận ra cùng chức năng và cột dữ liệu. Không đưa `Register`, `Forgot Password` hay bộ lọc Min/Max vào baseline.

### Truy vấn và thời gian

- Data Sensor: `page`, `size=20`, `searchField`, `search`, `from`, `to`, `sortBy`, `order`. Search/Sort: ID, Sensor Type, Value, Time. Lọc khoảng thời gian rồi sắp xếp rồi phân trang; đổi điều kiện truy vấn đưa về trang đầu.
- Action History: các tham số trên cộng `device`, `action`, `status`; Search: ID/Device; Filter: Device/Action/Status/From/To; Sort: ID/Device/Action/Status/Time. Pipeline Search/Filter → Sort → Pagination.
- BTH1 ghi định dạng nhập From/To là `dd/MM/yyyy HH:mm:ss`; API cần một quy ước serialize/parse và timezone thống nhất. Không trộn chuỗi hiển thị với timestamp lưu/trao đổi nếu chưa chuyển đổi rõ. Khoảng `from > to` hoặc sai định dạng phải báo lỗi và giữ điều kiện truy vấn trước đó.
- Phân trang UI: Trang đầu, Trước, số trang/ô nhảy trang, Sau, Trang cuối; backend nên dùng `page` zero based và UI hiển thị one based nếu chọn quy ước của contract V1. **[CẦN KHÓA]** thành contract chính thức.

## 6. Ba luồng nghiệp vụ cốt lõi [ĐÃ NỘP]

### 6.1 Telemetry

1. ESP32 đọc DHT11 và LDR, chuyển ADC ánh sáng thành lux ước lượng; gửi từng reading `{sensorCode, value}` qua MQTT.
2. Backend kiểm tra `sensorCode`, giá trị số hữu hạn/hợp lệ, tìm `Sensor`, tạo từng `SensorData` với `recordedAt` ở backend, cập nhật giá trị mới nhất/hardware liveness.
3. Backend phát sensor update qua STOMP; frontend cập nhật card và chart, giới hạn tối đa 15 điểm. Sau reload, REST lấy dữ liệu ban đầu từ backend rồi nối realtime.
4. Nếu 30 giây không nhận **telemetry hợp lệ được chấp nhận**, báo `Hardware Offline`, giữ giá trị cuối và đánh dấu dữ liệu cũ. Khi có dữ liệu hợp lệ trở lại thì chuyển Online. Offline không đồng nghĩa LED OFF.

### 6.2 Lệnh điều khiển và xác nhận

1. User nhấn ON/OFF cho LED1/LED2; frontend hiện Pending nhưng vẫn hiển thị `Device.status` đã xác nhận.
2. Backend xác thực JWT và Device, tạo `ActionHistory` với `status = Device.status`, `confirmedAt = NULL`; lấy `requestId = ActionHistory.id`, publish `{requestId, deviceCode, action}`.
3. ESP32 nhận đúng topic, parse và kiểm tra mã LED/hành động; thao tác GPIO, publish `{requestId, deviceCode, status}` lên status topic.
4. Backend xác thực và đối chiếu `requestId` với đúng history/device, xử lý trùng/đến muộn; cập nhật history và `Device.status` nếu xác nhận hợp lệ và không ghi đè xác nhận mới hơn; push STOMP cho frontend. `Action` có thể khác `Status`.
5. Nếu hết thời gian chờ không có xác nhận: dừng Pending, hiện `Device not responding`, giữ `Device.status` cũ, `confirmedAt` vẫn NULL. Xác nhận đến muộn có thể hoàn tất history; quy tắc chống ghi đè trạng thái mới hơn vẫn áp dụng.

**Cần triển khai cẩn thận:** Có thể nhận command mới trước khi command cũ được xác nhận. Chỉ so `requestId` theo thứ tự là một chính sách hợp lý khi `ActionHistory.id` tăng theo lệnh; cần chốt hành vi lệnh đồng thời/cách chọn xác nhận mới hơn trong backend. `digitalRead(outputPin)` trong firmware phản ánh mức GPIO, **không phải cảm biến kiểm chứng LED thật sự sáng**; khi thuyết trình chỉ gọi là trạng thái đầu ra được ESP32 phản hồi.

### 6.3 Profile

GET Profile theo User từ JWT. PUT chỉ cho sửa `fullName`, `studentCode`, `email`, `githubUrl`, `figmaUrl`, `apiDocsUrl`, `reportUrl`, `avatarUrl`; backend kiểm tra định dạng/unique và chỉ định User từ JWT. Không nhận `passwordHash`, `id` hoặc `userId` như trường cập nhật. Chọn ảnh/preview là UI; lưu ảnh bền vững cần giải pháp upload/storage thực tế, chưa được chứng minh chỉ bằng bản frontend mock.

## 7. Trạng thái bất thường cần phân biệt

| Tình huống | Điều kiện và UI | Dữ liệu giữ nguyên |
| --- | --- | --- |
| Hardware Offline | Không có telemetry được chấp nhận trong **30 giây**; đánh dấu các reading cuối là cũ, hiển thị lần nhận cuối. | Giá trị Sensor cuối và trạng thái LED xác nhận. |
| Device Command Timeout | Một `requestId` không được xác nhận trước deadline cấu hình; hết spinner, báo không phản hồi. | `Device.status`; history còn `confirmedAt = NULL`. |
| Realtime Disconnected | STOMP gián đoạn; báo mất realtime, reconnect, REST refetch sau nối lại để tránh thiếu sự kiện. | Dữ liệu đang hiển thị cho tới khi có dữ liệu mới. |
| Backend Unavailable | REST thất bại; hiển thị lỗi và không khẳng định request đã được nhận nếu chưa có response rõ ràng. | Trạng thái xác nhận gần nhất đã tải, nếu có. |
| Chưa có dữ liệu | Sensor card hiển thị N/A, chart rỗng; không chế tạo reading. | Không có giá trị để giữ. |

V5 đề xuất timeout lệnh **10 giây**, nhưng BTH1 chỉ yêu cầu “trong thời gian chờ”. Đây là giá trị **[CẦN KHÓA]** khi viết backend/FE. LWT/availability là cải tiến kết nối MQTT, không thay thế quy tắc 30 giây của nghiệp vụ.

## 8. Giao tiếp: phần đã chốt về nghĩa, phần chưa chốt về hình dạng

### REST [ĐÃ NỘP về chức năng]

| Method + path ghi trong BTH1 | Request/response tối thiểu | Ghi chú |
| --- | --- | --- |
| `POST /api/auth/login` | `{username,password}` → `{token}` | Public; bảo vệ các API còn lại bằng JWT. |
| `GET /api/dashboard` | latest 3 sensor, tối đa 15 chart points, hardware, LED1/LED2 | BTH1 mô tả nội dung chứ chưa khóa JSON hoàn chỉnh. |
| `POST /api/devices/{deviceId}/actions` | `{action:"ON"}` → `{requestId:101,status:"ACCEPTED"}` | Đây là **đường dẫn trong bài đã nộp**. Contract V1 dùng `{deviceCode}/commands` khác; phải chọn một canonical endpoint trước tích hợp. |
| `GET /api/sensor-data` | query mục 5 → page các dòng SensorData + Sensor | 20/trang. |
| `GET /api/action-history` | query mục 5 → page các dòng gồm `action`, `status`, thời gian | 20/trang, có thể thêm `confirmedAt` để diễn giải Pending. |
| `GET /api/profile`; `PUT /api/profile` | safe Profile DTO; PUT allowlist mục 6.3 | Xác định User từ JWT. |

**Đề nghị để không lệch bài nộp:** triển khai `POST /api/devices/{deviceId}/actions` làm endpoint chính; trả `requestId`/`ACCEPTED`; backend map `deviceId → Device.code` là `LED1`/`LED2` cho MQTT. Nếu nhóm muốn dùng `{deviceCode}/commands` vì frontend thuận tiện, ghi rõ đây là thay đổi/alias và cập nhật FE, BE, tài liệu thống nhất; không dùng `ESP32_01` làm `deviceCode`.

### MQTT [BTH2 đã chạy ở mức firmware + broker]

| Topic thực tế trong `DemoB2.ino` | Chiều | Payload ví dụ |
| --- | --- | --- |
| `iot/sensor/data` | ESP32 → Backend | `{"sensorCode":"DHT11_TEMP","value":29.1}`; tương tự `DHT11_HUM`, `LDR_LIGHT` |
| `iot/device/command` | Backend → ESP32 | `{"requestId":101,"deviceCode":"LED1","action":"ON"}` |
| `iot/device/status` | ESP32 → Backend | `{"requestId":101,"deviceCode":"LED1","status":"ON"}` |

**[CẦN KHÓA]** Contract V1 đề xuất `iot/telemetry` thay cho topic sensor đang chạy `iot/sensor/data`. Trước BTH4 chọn một topic duy nhất rồi sửa publisher/subscriber và tài liệu. Đề nghị giữ topic đang demo để giảm đổi firmware, trừ khi có lý do phải chuyển. JSON key luôn là **`requestId`** (đúng chữ hoa/thường), không dùng `requestID`. `requestId` terminal BTH2 có thể đặt số tùy ý khi demo độc lập; khi có backend nó phải bằng `ActionHistory.id` thực.

### STOMP over native WebSocket [DỰ KIẾN]

Contract V1 đề xuất endpoint `/ws`, destinations `/topic/sensors`, `/topic/hardware`, `/topic/devices`, `/topic/notifications`. Chưa có bằng chứng server/FE đã chạy end to end. Có thể dùng bộ tên đó khi triển khai; khóa DTO/event name cho bốn nhóm, JWT khi kết nối nếu yêu cầu, reconnect + REST refetch. Không dùng SockJS nếu tiếp tục theo V5.

### Các điểm contract V1 phải sửa

1. `ESP32_01` bị dùng ở vị trí đường dẫn/mảng `devices`, trong khi dữ liệu và lệnh cần LED1/LED2; tách controller ID khỏi Device.code.
2. `/api/devices/{deviceCode}/commands` khác BTH1 `/api/devices/{deviceId}/actions`.
3. `iot/telemetry` khác topic BTH2 `iot/sensor/data`.
4. Dashboard response mẫu thiếu mảng chart 15 điểm; Action History response mẫu thiếu `status` (và nên có `createdAt`), trái cột giao diện BTH1.
5. Các đề xuất QoS 0/1, retain false cho telemetry/command/status, LWT availability, client ID, reconnect là **thiết kế để triển khai**, không phải hành vi đã chứng minh trong `DemoB2.ino`.

## 9. Firmware BTH2: đúng hiện trạng [ĐÃ DEMO]

| Thành phần | Giá trị trong `DemoB2.ino` |
| --- | --- |
| Board | ESP32 DevKit V1; Arduino framework; WiFi, PubSubClient, ArduinoJson, DHT |
| DHT11 | GPIO 4; temp/humidity, bỏ hai reading này nếu `NaN` |
| LDR AO | GPIO 34 ADC; trung bình **10 mẫu**, cách 10 ms; `adcToLux` ánh xạ tuyến tính từng đoạn mang tính ước lượng, chưa có đường chuẩn đo lux độc lập |
| LED1, LED2 | GPIO 18, 19; setup đặt LOW |
| Chu kỳ | `millis()` với `SENSOR_INTERVAL = 2000` ms; `client.loop()` chạy trong vòng lặp, nhưng `connectMQTT()` và lấy 10 mẫu vẫn có delay chặn tạm thời |
| MQTT | Broker IP/port lấy từ cấu hình cục bộ; firmware dùng username/password; subscribe command, publish sensor/status theo ba topic mục 8 |
| Command | Parse `requestId`/`deviceCode`/`action`, chỉ nhận LED1/LED2 và ON/OFF; `digitalWrite`, `digitalRead` chân output, publish status cùng `requestId` |

**Giới hạn cần xử lý ở BTH4:** `requestId` thiếu/sai sẽ mặc định 0 trong code hiện có; cần từ chối thay vì phát xác nhận sai. `client.publish()` chưa kiểm tra thành công; reconnect MQTT có vòng lặp blocking. ESP32 có thể khởi động lại và đặt LED LOW trong khi MySQL còn lưu ON; cần chính sách hòa giải trạng thái khi reconnect/khởi động. Không có LWT trong firmware hiện tại. Chuyển lux là ước lượng từ ADC, không khẳng định độ chính xác đo sáng tuyệt đối. Không đưa SSID, password Wi‑Fi/MQTT hoặc IP LAN tạm thời của file demo vào tài liệu công khai; cấu hình chúng theo máy/mạng demo.

## 10. Frontend hiện có và mục tiêu BTH3

`SrcCode_Frontend_V1.docx` ghi code React/Vite với `App`, `ProtectedRoute`, `Sidebar`, `SensorCard`, `DeviceControl`, `Pagination`, năm trang, `mockData`, `api.js`, CSS responsive. Dashboard có chart, hiển thị liveness/pending; hai trang tra cứu có query/pagination; Profile có view/edit. **Đây là mã chép trong DOCX, không đồng nghĩa repository source thực tế đã được kiểm thử tại workspace này.**

Các điểm mock quan sát được: Login so username/password với `mockUser` và đặt `localStorage.isAuthenticated`; dashboard sinh chart theo timer, giả lập xác nhận LED và lưu status bằng localStorage; Data Sensor/Action History đọc mock arrays; Profile lưu localStorage/ảnh browser. BTH3 có thể trình bày UI bằng mock theo đúng yêu cầu, nhưng phải giải thích rõ nó chưa phải xác thực JWT, MQTT confirmation, MySQL persistence hay STOMP thật. Không dùng timer mock 700 ms để tuyên bố LED đã xác nhận.

**Việc làm BTH3 theo thứ tự:**

1. Khôi phục source `.jsx/.css/package.json` thành dự án chạy được từ bản gốc của bạn; đối chiếu từng màn với wireframe nộp và sáu use case. Không tự sinh backend giả như nguồn sự thật.
2. Chuẩn hóa một mô hình dữ liệu UI: SensorData mỗi hàng một reading; Action History phải có Action, Status, Time; trạng thái Pending/Offline/Realtime Disconnected tách khỏi trạng thái ON/OFF xác nhận.
3. Đảm bảo filter/search/sort trước pagination, reset trang sau đổi điều kiện; 20/trang; chart tối đa 15; xử lý rỗng/lỗi/sai khoảng thời gian, responsive.
4. Tách adapter `mock` và `api`; chuẩn bị DTO và các hàm REST/STOMP theo contract đã khóa. Đối với BTH3 demo mock, gắn nhãn trong lời thuyết trình; BTH4 thay nguồn dữ liệu và xác thực thật.
5. Test bằng thao tác UI: đăng nhập đúng/sai, reload, query, phân trang, sửa/hủy Profile, lệnh trùng trạng thái, pending/timeout, liveness giả lập; kiểm tra không tạo xác nhận thật từ click.

## 11. Backend BTH4: các module cần hoàn thành [DỰ KIẾN]

- Spring Boot Security/JWT, account seed duy nhất và password hash; MySQL/JPA với **5 bảng** và ràng buộc unique/FK.
- REST controllers/service/DTO: Auth, Dashboard, Sensor Data, Action History, Device Command, Profile; whitelist sort/filter và validate thời gian; trả mã lỗi rõ ràng.
- MQTT subscriber `sensor/data` + `device/status`, publisher `device/command`; cấu hình broker từ môi trường; không commit secrets. Validate JSON, `sensorCode`, number hữu hạn, `requestId`, `deviceCode`, `status`; ghi dữ liệu rồi push STOMP.
- Ghi lệnh và publish với xử lý thất bại tường minh: request tạo history vẫn chưa xác nhận khi publish lỗi; tránh đổi `Device.status`. Correlate/idempotency khi trùng status; xử lý xác nhận muộn và lệnh cạnh tranh.
- Theo dõi telemetry được chấp nhận và 30 s offline, timeout lệnh theo deadline đã chốt; phát update/notification. Khởi động lại backend cần lấy dữ liệu và trạng thái từ DB, không dựng từ localStorage của FE.
- Profile GET/PUT dựa trên JWT, không cho đổi trường cấm; thiết kế upload avatar thật hoặc chọn URL bền vững nếu muốn BTH4 lưu ảnh qua server.
- Đồng bộ một contract REST/MQTT/STOMP rõ path, field, kiểu, timestamp, lỗi, timeout, timezone và pagination rồi cho FE/firmware cùng sử dụng.

## 12. Kịch bản demo BTH4 và câu hỏi vấn đáp

1. Khởi động Wi‑Fi chung, Mosquitto (listener trên LAN và xác thực), MySQL, backend, frontend; xem Serial để xác nhận ESP32 nối đúng IP broker và subscribe command.
2. Login thật → Dashboard GET từ DB → nhận telemetry mỗi khoảng 2 s → bảng SensorData có từng reading; chart giới hạn 15.
3. Nhấn LED1 ON: chỉ Pending → history có `action=ON`, `status=trạng thái cũ`, `confirmedAt=NULL` → MQTT command với `requestId=history.id` → ESP32 GPIO và status → backend correlate/ghi DB → WS đẩy ON; reload vẫn ON.
4. Gửi lệnh trùng ON, chứng minh có history riêng. Điều khiển LED2. Truy vấn history/sensor với search/filter/sort/pagination và hiển thị đúng status.
5. Ngắt phần cứng hoặc telemetry đủ 30 s → Hardware Offline, giữ giá trị và LED đã xác nhận. Ngắt xác nhận của một command → timeout riêng, history còn unconfirmed. Nối lại để kiểm tra phục hồi/xác nhận muộn.
6. Cập nhật Profile hợp lệ, reload vẫn giữ; thử dữ liệu lỗi. Kiểm tra reconnect WS và reload để chứng minh backend là nguồn dữ liệu.

**Câu phải giải thích được:** (a) MQTT đi qua Wi‑Fi, USB chỉ nạp/cấp điện/Serial; (b) `publish` terminal → broker → `client.loop`/callback → parse JSON → GPIO → topic status → `sub` và, khi có backend, DB/WS; (c) `requestId` liên kết đúng dòng history; (d) `Action ≠ Status` có nghĩa gì; (e) tại sao click/timeout/offline không thể tự đổi `Device.status`; (f) DHT11 lỗi thì sao, lux được tính thế nào và giới hạn phép đo; (g) phân biệt Offline, Timeout, WS mất kết nối; (h) 5 bảng, 6 UC và 5 màn hình.

## 13. Ma trận kiểm chứng nhanh

| Bất biến | Cách kiểm chứng khi có mã tích hợp |
| --- | --- |
| Chỉ 5 bảng | Schema/migration và ERD trùng BTH1. |
| Một MQTT reading → một SensorData | Gửi riêng ba JSON và đếm ba dòng đúng `sensorId`, đơn vị do Sensor cung cấp. |
| Click chưa phải xác nhận | Chặn status topic, UI và DB giữ Device.status cũ; history mới `confirmedAt=NULL`. |
| Xác nhận đúng cặp | Status sai `requestId` hoặc sai `deviceCode` bị bỏ; đúng id cập nhật một lần. |
| Lệnh trùng trạng thái vẫn ghi nhận | ON khi đang ON tạo history mới, gửi MQTT và chờ status. |
| Timeout và Offline độc lập | Mất command confirmation không tự báo hardware offline; mất telemetry 30 s không tự đặt LED OFF. |
| Reload giữ trạng thái | Frontend tải REST từ backend/DB, không dùng localStorage làm nguồn ON/OFF cuối. |
| Tra cứu chuẩn | Test search/filter/sort trước phân trang, trang tối đa 20, biên khoảng thời gian và trang rỗng. |

## 14. Những lỗi trong tài liệu nguồn không được chép tiếp

- Bảng tổng hợp use case trong BTH1 gán nhầm mô tả UC01–UC03; lấy tên UC và mục đặc tả chi tiết ở chương III làm đúng.
- Bảng endpoint `/api/action-history` trong BTH1 ghi nhầm chức năng “Tra cứu dữ liệu cảm biến”; chức năng là **tra cứu lịch sử điều khiển**.
- Tài liệu lịch sử từng ghi ESP8266 và `SensorSample`/6 bảng; baseline đã nộp là **ESP32, 5 bảng**.
- Contract V1 có `ESP32_01` trong vị trí Device code và response thiếu chart/history status; sửa trước khi copy làm API thật.
- Kế hoạch backend có chỗ ví dụ telemetry gộp `temperature/humidity/light`; firmware BTH2 đang publish **từng** `{sensorCode,value}`. Không ghi một sample gộp vào schema hiện tại.

## 15. Điểm phải khóa trước lúc nối BTH4

| Quyết định | Hiện trạng | Đề nghị / tiêu chí hoàn thành |
| --- | --- | --- |
| REST Device Command path | TH1: `{deviceId}/actions`; contract: `{deviceCode}/commands` | Dùng TH1 làm canonical hoặc tài liệu hóa alias. Phải đồng nhất FE–BE và map LED code trong MQTT. |
| MQTT telemetry topic | Firmware `iot/sensor/data`; contract `iot/telemetry` | Đề nghị giữ topic đã demo, sửa backend/contract. |
| Command timeout | TH1 chưa nêu số; V5 đề xuất 10 s | Chọn một số cấu hình và một nơi authoritative (backend). |
| JSON Dashboard/history | TH1 nêu nội dung; V1 ví dụ thiếu trường | Định nghĩa DTO chart 15, LED1/LED2, action/status/createdAt/confirmedAt, hardware timestamp. |
| Thời gian và phân trang | BTH1 dd/MM/yyyy HH:mm:ss UI; contract page=0 | Khóa timezone, format API và cách convert UI; `page`/sort enums. |
| WS auth và reconnect | V1 nêu endpoint/destinations | Chọn cách gửi JWT khi STOMP CONNECT, quyền subscribe, reconnect + GET refetch. |
| MQTT QoS/LWT/reconnect | Contract đề xuất, firmware chưa thể hiện | BTH4 triển khai và thử hoặc ghi rõ lược bớt mà vẫn đạt 30 s offline. |
| Startup LED và late confirm | Firmware reset LOW; DB có thể lưu ON | Chốt cách đồng bộ thực tế với trạng thái lưu, xử lý stale request/idempotency. |
| Avatar | BTH3 mock browser storage | Chọn upload/storage bền vững hoặc URL có thể truy cập trong BTH4. |

## 16. Nhật ký quyết định và hướng cập nhật

Khi một mục **[CẦN KHÓA]** được chọn, ghi ở đây: ngày, quyết định, lý do, tài liệu/FE/BE/firmware đã đổi, cách kiểm thử. Nếu thay đổi cam kết BTH1 thì ghi rõ sai khác để giải thích trong báo cáo BTH4, không âm thầm sửa bản TH1 đã nộp.

| Ngày | Quyết định | Lý do | File cần đồng bộ | Kiểm chứng |
| --- | --- | --- | --- | --- |
| 05/10/2026 | Khởi tạo base theo bài TH1 đã nộp và firmware BTH2. Các hàng mục 15 chưa chốt cuối. | Dọn xung đột giữa V5, contract, FE mock và firmware. | FE, BE, ESP32, contract, báo cáo BTH4 sau khi triển khai. | Đối chiếu checklist mục 13. |

---

**Quy tắc một câu:** Mọi màn hình và phần mềm triển khai sau này phải kể cùng một câu chuyện với BTH1: ba reading độc lập, hai LED, năm bảng, lệnh có history và chỉ xác nhận hợp lệ từ ESP32 mới thay đổi trạng thái LED được ghi nhận.
