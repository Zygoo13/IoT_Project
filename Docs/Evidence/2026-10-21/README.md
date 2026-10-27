# Bộ minh chứng báo cáo BTL — 21/10/2026

## Bắt đầu từ đây

Đã thu phần cần ESP32 trước khi người dùng rút phần cứng. Có thể viết báo cáo và dùng lại các bằng chứng này khi ESP32 không cắm. Đây là dữ liệu quan sát, không phải fixture BTH3 hoặc kết quả mô phỏng.

- **26 ảnh PNG** giao diện cuối: Login, Dashboard, biểu đồ, LED trước/sau/chờ/lỗi, dữ liệu cảm biến, tìm giá trị/ngày, History, Profile và Swagger.
- **420 reading**: 140 mỗi Sensor; MQTT và STOMP khớp giá trị theo thứ tự quan sát. Cả 420 event STOMP khớp SQL theo ID, Sensor, giá trị và timestamp tới micro giây.
- **4 phép thử ON/OFF thành công**: LED1 ON 564, LED2 ON 565, LED1 OFF 566, LED2 OFF 567. Có command, status, STOMP và history cùng requestId.
- **2 phép thử không có phần cứng**: 568/569 timeout, không có status/confirmedAt, Device giữ OFF. Đã thu banner Offline thật sau khi người dùng báo rút ESP32.
- Cấu trúc 5 bảng, FK, phiên bản môi trường và OpenAPI 7 thao tác đã xuất; không xuất User rows, mật khẩu, password hash hoặc JWT.

Khoảng quan sát: 2026-10-20T19:27:59.652Z → 2026-10-20T19:35:42.365Z (UTC), tương ứng khoảng 02:27:59–02:35:42 ngày 21/10/2026 giờ Việt Nam. Sau khi rút ESP32, giá trị cuối vẫn giữ nguyên: đây là hành vi Offline, không phải telemetry tiếp tục chạy.

## Nên mở theo thứ tự

1. [Danh mục ảnh và caption](IMAGE_CATALOG.md).
2. [Đối chiếu telemetry F23](F23_TELEMETRY.md).
3. [Đối chiếu điều khiển F24](F24_LED_CONTROL.md).
4. [Bảng kiểm thử đầy đủ](data/test-results.tsv).
5. [Ảnh mạch/Serial cần người dùng thêm](hardware-photos/README.md).

## Gắn bằng chứng vào báo cáo theo từng chức năng

| Mục báo cáo | Dùng ngay | Việc còn lại khi viết |
| --- | --- | --- |
| 3.1 Kiến trúc/triển khai | data/environment.json; cấu hình source | Vẽ sơ đồ Browser–Nginx/Spring–MySQL/Mosquitto–ESP32; MySQL vẫn container riêng |
| 3.2 Phần cứng | hardware-photos/README.md | Người dùng thêm ảnh mạch, chân dây và xác nhận firmware đã nạp |
| 3.3 CSDL | db-columns.tsv, db-foreign-keys.tsv, db-table-counts.tsv | Vẽ ERD, viết từ điển dữ liệu từ schema thực |
| 3.4 Đăng nhập | F08, OpenAPI | Viết UI → sequence → API → xử lý, không đưa credentials vào ví dụ |
| 3.5 Dashboard/telemetry | F10/F16c; F23_TELEMETRY.md | Giải thích 15 điểm mỗi Sensor, nhãn mốc nhiệt độ, timestamp riêng, trạng thái online/offline |
| 3.6 LED | F13/F15; F24_LED_CONTROL.md | UI → sequence → REST/MQTT/status → DB/STOMP; bổ sung ảnh đèn thật |
| 3.7 Data Sensor | F16/F16b/F16c | Gắn query/search/UTC/sort/page vào luồng cùng màn hình |
| 3.8 History | F18 và F24 JSON | Phân biệt action/status/deliveryState, không diễn giải TẮT sau timeout là lệnh thành công |
| 3.9 Profile | F20/F20b | Đã GET và mở/Hủy form; chưa thử PUT trong lượt này |
| 3.10 Vận hành/Swagger | F22; environment.json; openapi-no-examples.json | Bảy thao tác REST, schema, JWT và Compose theo source |
| 3.11 Kiểm thử | test-results.tsv, F23/F24 và ảnh Offline | Chỉ ghi PASS các hàng đã đo; mô tả giới hạn dưới đây |

## Số liệu có thể dùng

| Sensor | MQTT / STOMP | Min–max trong lượt quan sát | Bản ghi cuối đối chiếu |
| --- | --- | --- | --- |
| DHT11_TEMP | 140 / 140 | 31.7–32.3 °C | 9282 |
| DHT11_HUM | 140 / 140 | 48.4–50.8 %RH | 9283 |
| LDR_LIGHT | 140 / 140 | 0–200 lux ước lượng | 9284 |

Người dùng đã báo bắt đầu chiếu sáng/che cảm biến trong lượt thu; số đo tăng/giảm được giữ nguyên trong trace và ảnh. Không tự suy lux ước lượng là phép đo đã hiệu chuẩn.

## Những điều chưa được phép kết luận

- Ảnh mạch, chân dây, Serial và binary đã nạp do người dùng bổ sung/xác nhận. ACK GPIO không chứng minh độc lập rằng bóng LED vật lý phát sáng.
- Trace có các khoảng nhận dồn tại MQTT tới khoảng **10.25 giây**. Dữ liệu khớp trong lượt quan sát không chứng minh Wi-Fi/broker ổn định dài hạn; chưa định vị được nguyên nhân cụ thể.
- Chưa thử MQTT mất kết nối, mất Wi-Fi, reconnect sau cắm lại, ACK muộn/lặp/đảo thứ tự với firmware thật. Không lấy kiểm thử terminal hoặc demo BTH3 cũ thay cho bằng chứng này.
- Ảnh lọc Processing là kết quả rỗng sau timeout. Có ảnh Dashboard pending, nhưng không có ảnh hàng History còn PENDING; nếu cần hình đó có thể thu sau mà không phải bịa kết quả.
- IDs 570–572 là yêu cầu bổ sung xuất hiện trong khoảng quan sát, nguồn bấm chưa quy thuộc; lưu riêng, không tính vào 6 testcase chủ động. Không xóa history đã phát sinh.
- Lịch sử/DB có dữ liệu cũ. Chỉ các ID và thời gian đối chiếu ở F23/F24 được dùng làm bằng chứng của lượt này.
- Không có stress test, GPIO đo bằng đồng hồ/logic analyzer hoặc đo độ trễ quang học. Các số ms là quan sát cùng host, không phải cam kết chất lượng hệ thống.

## Cách bảo quản

- Dùng ảnh trong images/ và số liệu trong data/ khi viết; không cần bật lại phần cứng để dựng lại các kết quả đã thu.
- SHA256SUMS.txt ghi hash các file để nhận biết thay đổi. Bản gốc không chỉnh sửa nội dung ảnh/số liệu; nếu cần crop để đưa Word, tạo bản dẫn xuất khác.
- Source cách đo lưu trong tools/ để truy vết. Không cần chạy lại; các script ghi file đầu ra cùng thư mục, nên dùng thư mục/lượt mới nếu tái đo.
- Bộ này không chứa .env/config.h/password file/JWT. Ảnh Profile có thông tin cá nhân của chính tài khoản dùng cho báo cáo.
- Các sơ đồ use case, kiến trúc, ERD, sequence và nội dung bốn chương có thể hoàn thành khi không cắm phần cứng, theo [kế hoạch BTL](../../BTL_REPORT_PLAN.md).
