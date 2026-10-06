# Quyết định giao tiếp Backend

Ngày khóa: 05/10/2026. Nguồn ưu tiên: bài TH1 đã nộp, sau đó là firmware
`DemoB2.ino`, rồi `IOT_PROJECT_BASE.md`. Tài liệu này là hợp đồng để các giai
đoạn Backend, firmware và frontend mới dùng chung. Bài TH1 gốc được giữ nguyên.

| Chủ đề | Quyết định thống nhất | Kiểm tra khi tích hợp |
| --- | --- | --- |
| Phạm vi dữ liệu | Đúng 5 bảng `User`, `Sensor`, `SensorData`, `Device`, `ActionHistory`; không có `SensorSample`. Một MQTT reading hợp lệ tạo một dòng `SensorData`. | Kiểm tra schema và số dòng sau ba payload độc lập. |
| Seed | Chỉ 1 User, 3 Sensor `DHT11_TEMP`, `DHT11_HUM`, `LDR_LIGHT`, 2 Device `LED1`, `LED2`. Không seed `SensorData` hoặc `ActionHistory`. Mật khẩu seed lấy từ môi trường và lưu hash. | DB mới có số dòng lần lượt 1/3/0/2/0; khởi động lại không nhân bản. |
| REST command | Canonical `POST /api/devices/{deviceId}/actions`, body `{"action":"ON"}` hoặc `OFF`. `deviceId` là ID số của bảng `Device`; backend đổi sang `Device.code` cho MQTT. Thành công trả HTTP 202 và `{"requestId":101,"status":"ACCEPTED"}`. Không dùng đường `{deviceCode}/commands` song song. | Gửi LED1 theo ID và thấy payload MQTT mang `deviceCode:"LED1"`. |
| REST khác | `POST /api/auth/login`, `GET /api/dashboard`, `GET /api/sensor-data`, `GET /api/action-history`, `GET/PUT /api/profile` theo TH1. Mọi endpoint trừ login cần JWT. Profile lấy User từ token, không nhận `userId` từ client. | 401 khi thiếu token; Profile không lộ password hash. |
| Auth/JWT | Login kiểm tra BCrypt và trả `{ "token": "..." }`. JWT ký HS256 bằng khóa Base64 từ môi trường, `iss=iot-backend`, `sub=User.id`, hết hạn sau `IOT_JWT_TTL_SECONDS` (mặc định 3600). Backend xác thực chữ ký, issuer và hạn dùng trên mọi API khác login; không có đăng ký. | Login sai 401; token thiếu/sai/hết hạn 401; đổi secret làm token cũ hết hiệu lực. |
| MQTT topics và payload | Giữ `iot/sensor/data` với `{sensorCode,value}`; `iot/device/command` với `{requestId,deviceCode,action}`; `iot/device/status` với `{requestId,deviceCode,status}`. Key đúng chữ hoa/thường như firmware. Không đưa IP hoặc credentials demo vào cấu hình mặc định. | Publish/subscriber đúng ba topic; từ chối JSON sai. |
| MQTT telemetry validation | Chỉ nhận JSON object tối đa 256 byte với đúng hai key `sensorCode` (string) và `value` (JSON number hữu hạn). Sensor phải tồn tại và active; số phải vừa `DECIMAL(12,4)` (làm tròn 4 chữ số), độ ẩm trong 0..100 và ánh sáng không âm. Bỏ qua retained message. Chỉ dòng `SensorData` ghi thành công mới cập nhật mốc Online; không lưu payload lỗi. | Một publish hợp lệ tạo đúng một dòng; malformed/unknown/inactive/out-of-range không tạo dòng hay kéo dài Online. |
| MQTT delivery | QoS 0, retained=false cho ba topic để tương thích firmware hiện tại. Backend tự reconnect và subscribe lại; không dựa vào LWT cho trạng thái nghiệp vụ. Có thể nâng QoS/LWT sau khi sửa và kiểm thử cả firmware. | Ngắt/nối broker, telemetry và status tiếp tục được xử lý; không phát lại retained command. |
| Command và xác nhận | Mọi lần bấm, kể cả lệnh trùng trạng thái, tạo `ActionHistory` với `action` được yêu cầu, `status=Device.status` lúc tạo và `confirmedAt=NULL`. `requestId=ActionHistory.id`. Commit history trước khi publish. Chỉ status JSON có đúng ba key `requestId,deviceCode,status`, ID nguyên dương tồn tại, code khớp và status ON/OFF mới xác nhận; phản hồi lặp không đổi xác nhận đầu tiên. `action` không bị sửa theo status thực tế. Publish lỗi vẫn giữ history chưa xác nhận, trả HTTP 503 `{"code":"MQTT_PUBLISH_FAILED","message":"Command saved but MQTT publish failed","requestId":...}`. | Chặn status: Device không đổi; status sai ID/code bị bỏ; publish lỗi không mất history. |
| Lệnh cạnh tranh | Một tiến trình Backend tạo ID và publish tuần tự, nên thứ tự publish theo ID. Status của request cũ vẫn hoàn tất history, nhưng không ghi đè `Device.status` nếu đã có request ID lớn hơn được xác nhận. Firmware xử lý callback nối tiếp trên một topic. Nếu triển khai nhiều Backend replica sau này, cần cơ chế thứ tự dùng chung. | Gửi hai lệnh nhanh và đảo thứ tự phản hồi thử; DB giữ trạng thái của ID mới hơn. |
| Timeout | Backend là nguồn quyết định: 10 giây tính từ `ActionHistory.createdAt`. Quá hạn thì hiện `TIMEOUT`, `confirmedAt` vẫn NULL, `Device.status` giữ nguyên. Xác nhận hợp lệ đến muộn có thể hoàn tất history; quy tắc ID mới hơn vẫn áp dụng. Không ghi `TIMEOUT` vào cột status. | Chặn phản hồi 10 giây rồi gửi lại status muộn. |
| Hardware liveness | `ONLINE` khi có telemetry hợp lệ trong 30 giây gần nhất; ngoài khoảng đó là `OFFLINE`. Lấy mốc từ `SensorData.recordedAt` để phục hồi sau restart. Giữ số đo cuối và LED status đã ghi; đánh dấu giá trị cũ. | Gửi payload lỗi không kéo dài Online; tắt ESP32 30 giây và kiểm tra. |
| Khởi động ESP32 | Firmware hiện đặt hai GPIO LOW khi boot. Device seed dùng `OFF` theo mặc định đó. Sau mất kết nối hoặc khởi động lại, UI trình bày `Device.status` là trạng thái **được ghi nhận gần nhất**, không cam kết mức GPIO hiện thời cho đến xác nhận lệnh mới. Không tự tạo ActionHistory giả để đồng bộ. | Reboot ESP32 khi DB đang ON; UI không khẳng định đó là trạng thái vật lý mới. |
| Thời gian | CSDL lưu UTC, REST/WS dùng ISO 8601 UTC (`...Z`), `from`/`to` nhận ISO 8601 có offset và lọc bao gồm hai đầu. Frontend mới nhập/hiển thị `dd/MM/yyyy HH:mm:ss` theo `Asia/Ho_Chi_Minh` rồi chuyển sang UTC khi gọi API. | Cùng một bản ghi qua REST/WS hiện cùng giờ địa phương; `from>to` trả 400. |
| Phân trang và sort | `page` bắt đầu từ 0, `size` mặc định và tối đa 20. Search/filter rồi sort theo whitelist rồi mới phân trang; `order=ASC/DESC`. Data Sensor search/sort `ID,SENSOR_TYPE,VALUE,TIME`; Action History search `ID,DEVICE`, sort `ID,DEVICE,ACTION,STATUS,TIME`, filter `device,action,status,from,to`. | Truy vấn nhiều trang; điều kiện sai trả 400, không đưa tên cột tùy ý vào SQL. |
| Dashboard JSON | Trả `latest` theo ba sensor, mỗi mục có `sensorCode,value,unit,recordedAt` hoặc `null`; `chart` gồm ba series độc lập, mỗi series tối đa 15 reading thực; `hardware` có `status,lastSeenAt`; `devices` có `id,code,status`. Không tạo một sample gộp trong DB. | DB rỗng: latest null, chart rỗng, hardware Offline; có dữ liệu: mỗi series tối đa 15. |
| REST đọc JSON | `latest` và `chart` là object khóa theo ba `Sensor.code`; chart point gồm `value,recordedAt`, theo thời gian tăng dần. Latest thêm `stale` khi reading cũ hơn 30 giây. Hai API bảng trả `{content,page,size,totalElements,totalPages}`. Sensor row có `id,sensorCode,sensorType,value,unit,recordedAt`; History row theo hàng dưới. | GET rỗng vẫn trả đủ key và metadata; không tạo bảng hoặc dữ liệu tổng hợp. |
| REST đọc query | `page=0`, `size=20`, `sortBy=TIME`, `order=DESC` mặc định; sort ổn định theo ID phụ. `search` không có `searchField` là tìm chung trên các cột hiển thị: Sensor gồm ID, mã/tên/loại/đơn vị, giá trị, thời gian; History gồm ID, thiết bị, action/status, thời gian tạo/xác nhận và deliveryState. Chuỗi tìm không phân biệt hoa/thường; ngày hiển thị `dd/MM/yyyy` hoặc thời điểm đầy đủ `dd/MM/yyyy HH:mm:ss` được hiểu theo `Asia/Ho_Chi_Minh`. `searchField` cũ vẫn được nhận khi đi cùng `search`: Sensor `ID,SENSOR_TYPE,VALUE,TIME`; History `ID,DEVICE`; `searchField=ALL` tương đương tìm chung. ID/VALUE theo cột cũ tìm đúng số; TIME theo cột cũ nhận ngày UTC `yyyy-MM-dd` hoặc giây ISO 8601 có offset. `device` lọc đúng LED1/LED2; `action,status` nhận ON/OFF. `from,to` là ISO 8601 có offset, bao gồm hai đầu. Tham số sai trả 400. | Search/filter trước sort/page; trang vượt cuối trả `content=[]`; không ghép input vào tên cột SQL. |
| History JSON | Mỗi dòng có `id,deviceId,deviceCode,action,status,createdAt,confirmedAt` và `deliveryState` suy ra `PENDING/TIMEOUT/CONFIRMED`. `status` vẫn chỉ ON/OFF. | History chưa xác nhận không bị hiển thị như lệnh đã thành công. |
| WebSocket | Native STOMP endpoint `/ws`, không SockJS; origin frontend development mặc định `http://localhost:5173`, đổi bằng `IOT_FRONTEND_ORIGIN` (một origin rõ ràng). JWT gửi ở STOMP `CONNECT` qua header `Authorization: Bearer ...`; server xác thực CONNECT và chỉ cho SUBSCRIBE bốn topic ở bảng dưới. Client `SEND` bị từ chối. Mất kết nối thì frontend reconnect và gọi lại REST. | Origin lạ, token thiếu/sai, topic lạ và client SEND bị từ chối; nối lại tải state từ REST. |
| Profile/avatar | `GET/PUT /api/profile`; PUT chỉ nhận `fullName,studentCode,email,githubUrl,figmaUrl,apiDocsUrl,reportUrl,avatarUrl`. `fullName`, `studentCode`, `email` bắt buộc; URL khác nhận HTTP/HTTPS hoặc null; `avatarUrl` là URL HTTPS bền vững do User cung cấp. PUT thay đủ tám trường, null hoặc thiếu URL sẽ xóa URL đó. Giai đoạn đầu không có upload ảnh. | Không sửa được id, username, passwordHash; URL/unique được kiểm tra. |
| Lỗi REST | 400 input sai, 401 token thiếu/sai, 404 Device không tồn tại, 503 khi broker không nhận publish. Error body có `code,message` và `requestId` khi lệnh đã được ghi. | Client phân biệt lệnh đã lưu nhưng chưa gửi được với lỗi trước khi tạo history. |

## DTO STOMP và thời điểm phát

JSON trên mỗi topic là một object; thời gian dùng ISO 8601 UTC `Z` giống REST.
Không phát snapshot lúc SUBSCRIBE; client GET REST trước và GET lại sau reconnect.

| Destination | Ví dụ JSON | Quy tắc |
| --- | --- | --- |
| `/topic/sensors` | `{"id":201,"sensorCode":"DHT11_TEMP","sensorType":"TEMPERATURE","value":29.1000,"unit":"°C","recordedAt":"2026-10-05T14:00:00Z"}` | Một event cho mỗi `SensorData` đã commit. Không phát cho MQTT payload lỗi. |
| `/topic/hardware` | `{"status":"ONLINE","lastSeenAt":"2026-10-05T14:00:00Z"}` hoặc `OFFLINE` với cùng mốc cuối | Chỉ phát khi chuyển Online/Offline theo reading hợp lệ trong 30 giây. Không đổi LED; Dashboard giữ giá trị cuối. |
| `/topic/devices` | `{"requestId":101,"deviceCode":"LED1","status":"ON","historyStatus":"ON","confirmedAt":"2026-10-05T14:00:01Z","deviceStatusUpdated":true,"deliveryState":"CONFIRMED"}` | Chỉ phát sau khi xác nhận hợp lệ commit. `status` là **Device.status hiện tại** để UI không bị status cũ ghi đè; `historyStatus` là trạng thái phản hồi của chính request. `deviceStatusUpdated=false` khi Device không thực sự đổi. Status sai/lặp không phát. Xác nhận muộn vẫn phát. |
| `/topic/notifications` | `{"type":"DEVICE_TIMEOUT","requestId":102,"deviceCode":"LED1","occurredAt":"2026-10-05T14:00:10Z"}` | Mốc `occurredAt=createdAt+10s`; chỉ một lần khi một history chưa xác nhận chuyển sang TIMEOUT trong phiên Backend đang chạy. Không lưu notification vào DB, không đổi `status` hoặc `confirmedAt`. History đã timeout trước khi Backend khởi động không được phát lại. |

`SensorData.recordedAt` và `ActionHistory.confirmedAt` làm tròn xuống micro giây
trước khi ghi `DATETIME(6)`, để timestamp trong WS và REST khớp chính xác.

Hai lỗi chữ trong TH1 không được sao chép vào API: mô tả UC01–UC03 ở bảng
tổng hợp bị lệch, và `/api/action-history` bị ghi nhầm là tra cứu cảm biến. Các
mục use case chi tiết mới là chuẩn.

## Trạng thái kiểm chứng

Các hàng trên là **quyết định thiết kế đã khóa**, chưa phải hành vi đã chạy.
Mỗi hàng chỉ được đánh dấu đã triển khai sau khi đạt phép kiểm tra tương ứng.
Nếu buộc đổi hợp đồng trong giai đoạn sau, cập nhật file này trước rồi đồng bộ
Backend, firmware và frontend mới trong cùng thay đổi.

**Đã kiểm chứng 05/10/2026:** phạm vi 5 bảng, seed 1/3/0/2/0, Auth/Profile,
ba REST đọc, MQTT telemetry và MQTT command/status trên MySQL 8.0.46/Mosquitto
2.1.2 cục bộ. Telemetry: ba payload hợp lệ tạo ba reading; payload lỗi/inactive
không ghi, Online/Offline 30 giây và reconnect đã thử; bốn reading thử đã dọn.
Command/status: đã thử PENDING/CONFIRMED/TIMEOUT, ON từ OFF, lệnh trùng,
Action khác Status, status sai/lặp, xác nhận muộn và đảo thứ tự, publish lỗi 503,
LED2 sau reconnect; tám history thử đã dọn. STOMP native đã thử bằng client
Node v24: origin/JWT/topic/SEND sai bị chặn, ba reading phát sensor và REST
đọc được, Offline một lần rồi Online lại, status đúng/late và timeout phát đúng
event; reconnect + GET phục hồi state. Năm reading và hai history thử đã dọn.
