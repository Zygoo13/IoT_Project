# Thứ tự triển khai và cổng kiểm tra

Làm từng giai đoạn nhỏ. Kết thúc mỗi giai đoạn bằng chạy kiểm tra thật, ghi kết
quả và chỉ chuyển sang giai đoạn sau khi cổng của giai đoạn hiện tại đạt.

| Giai đoạn | Phần việc | Tiêu chí kiểm tra thực tế |
| --- | --- | --- |
| 0. Khảo sát | Đọc TH1, base, wireframe, firmware; kiểm tra workspace và runtime. | Xác nhận 5 bảng, 3 sensor, 2 LED, 3 topic, API command và giới hạn môi trường. Đã hoàn tất 05/10/2026. |
| 1. Khung Backend | Tạo dự án Spring Boot Maven tối thiểu; ghi hợp đồng và kế hoạch. | `mvn -o package` tạo JAR thường với JDK 17; chỉ có file mới trong `Backend`, không đổi `Frontend`. Đây là giai đoạn của lượt đầu. |
| 2. MySQL và seed | Bổ sung plugin đóng gói chạy được, migration tạo đúng 5 bảng, JPA/repository và seed 1/3/2. Cấu hình DB và secrets qua môi trường. | Chạy trên MySQL thật; kiểm tra tên/cột/FK/unique, số dòng 1/3/0/2/0 sau hai lần restart; không có bảng thứ sáu. |
| 3. Auth và Profile | BCrypt, login JWT, security filter, GET/PUT Profile với allowlist. | Đã hoàn tất 05/10/2026: login đúng/sai, token thiếu/sai/hết hạn, GET không lộ hash, PUT hợp lệ lưu qua restart, input sai và trường cấm bị từ chối trên MySQL thật. |
| 4. REST đọc | Dashboard, Sensor Data, Action History với DTO, lọc/sort/pagination và lỗi rõ ràng. | Đã hoàn tất 05/10/2026: DB rỗng trả null/rỗng; fixture tạm kiểm tra chart ≤15/series, trang ≤20, Search/Filter/Sort/Page, 400 query sai; fixture đã dọn. Giai đoạn 5 sẽ kiểm tra lại với telemetry MQTT thật. |
| 5. MQTT telemetry | Kết nối Mosquitto, subscribe `iot/sensor/data`, kiểm tra payload, ghi từng SensorData. | Đã hoàn tất 05/10/2026: ba JSON thật qua Mosquitto tạo đúng ba dòng; payload sai/inactive không ghi, Online→Offline sau 30 giây; broker ngắt REST vẫn 200, bật lại nhận reading thứ tư; dọn bốn dòng thử. |
| 6. Command/status | Tạo history, publish MQTT, đối chiếu status, timeout và late confirm. | Đã hoàn tất 05/10/2026: history commit trước publish; PENDING/CONFIRMED/TIMEOUT, sai/lặp/muộn/ngược thứ tự, publish lỗi 503 có requestId; LED2 sau reconnect; tám history thử đã dọn. |
| 7. STOMP realtime | `/ws` và bốn topic, auth CONNECT/subscribe, push sau commit. | Đã hoàn tất 05/10/2026: client Node v24 nhận sensor/hardware/device/notification; origin/JWT/topic/SEND sai bị chặn; Offline/Online, timeout một lần, late ack và reconnect + GET đúng. Dọn 5 reading/2 history thử. |
| 8. Tích hợp ESP32 và frontend mới | Đồng bộ cấu hình mạng, firmware, adapter REST/WS của frontend mới theo wireframe. | Demo login → telemetry → LED1/LED2 → history → offline/timeout → reload, không dùng mock làm nguồn dữ liệu. |

Giai đoạn 4 đã kiểm tra với fixture tạm có dọn dẹp; cần kiểm tra lại với dữ liệu
telemetry thật sau giai đoạn 5. Không seed lịch sử hay số đo để làm đẹp giao diện.

## Nhật ký cổng kiểm tra

| Ngày | Giai đoạn | Lệnh hoặc thao tác | Kết quả |
| --- | --- | --- | --- |
| 05/10/2026 | 0 | Đọc bốn nguồn, xem năm wireframe; kiểm tra công cụ và Git bằng safe.directory tạm thời. | Đạt; Docker daemon và dịch vụ DB/MQTT chưa sẵn sàng. |
| 05/10/2026 | 1 | Maven 3.9.12, JDK 17.0.18, offline `clean package` với Maven cache hiện có. | Đạt: biên dịch sạch 1 class, tạo JAR thường. Không có test case hoặc dịch vụ tích hợp ở giai đoạn này. |
| 05/10/2026 | 2 | Build JAR Spring Boot; chạy với container MySQL 8.0.46; truy vấn trực tiếp sau lần khởi động thứ nhất và thứ hai. | Đạt: đúng 5 bảng, số dòng cả hai lần `1/3/0/2/0`; unique/FK và BCrypt đã kiểm tra. Không triển khai các giai đoạn 3–8. |
| 05/10/2026 | 3 | Build JAR; gọi login, GET/PUT Profile trên MySQL thật; restart và thử token hết hạn. | Đạt: login đúng/sai, JWT thiếu/sai/hết hạn, hash không lộ, PUT bền vững, input/trường cấm 400. |
| 05/10/2026 | 4 | Build sạch; gọi ba GET với JWT khi DB rỗng; fixture 23 reading + 23 history kiểm tra giới hạn, truy vấn, liveness/delivery state và 21 query lỗi; dọn fixture trong finally. | Đạt: ba API trả 200; thiếu JWT 401; query sai 400; sau dọn số dòng về `1/3/0/2/0`. Phát hiện và sửa lệch JDBC 7 giờ bằng JVM UTC; hiệu chỉnh timestamp seed cũ một lần. |
| 05/10/2026 | 5 | Build JAR, chạy Mosquitto 2.1.2 localhost có xác thực và MySQL 8.0.46; publish ba reading, nhiều payload lỗi, thử Sensor inactive; đợi >30 giây rồi ngắt/bật broker. | Đạt: 3 reading đúng Sensor/UTC/REST, payload lỗi không đổi `lastSeenAt`, Offline giữ giá trị, REST 200 khi broker ngắt, reconnect và nhận reading mới; dọn đúng 4 dòng, DB về `1/3/0/2/0`. |
| 05/10/2026 | 6 | Build JAR; terminal nhận sáu MQTT command và gửi status giả lập ESP32; thử 503 khi ngắt broker, LED2 sau reconnect. | Đạt: sáu payload command đúng thứ tự/JSON; PENDING→CONFIRMED, lệnh trùng, Action khác Status, status sai/lặp, TIMEOUT sau 10 giây, late ack, đảo thứ tự giữ trạng thái mới, 503 có requestId; LED2 xác nhận sau reconnect. Dọn đúng tám history, trả Device về trạng thái trước thử. |
| 05/10/2026 | 7 | Build JAR; `node scripts/verify-stomp.mjs` với WebSocket/STOMP thật, Mosquitto loopback và MySQL 8.0.46. | Đạt: origin/JWT/topic/SEND sai bị chặn; 3 reading phát sensor event, REST đọc được; Offline một lần sau 30 giây rồi Online; ack đúng phát device event khớp DB, sai/lặp không phát; timeout phát một notification, late ack phát xác nhận; reconnect + GET giữ state. Dọn 5 reading và 2 history, DB về 1/3/0/2/0. |
