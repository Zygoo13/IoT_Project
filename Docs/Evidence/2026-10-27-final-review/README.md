# Rà soát cuối trước khi viết báo cáo — 27/10/2026

Kết luận: các luồng chính đã đạt trong tập kiểm tra thực hiện. Có thể dùng bộ này để viết báo cáo BTL; không coi đây là chứng nhận chạy tải lớn hoặc vận hành sản xuất.

## Kết quả chốt

| Hạng mục | Kết quả và bằng chứng |
| --- | --- |
| Phiên phần cứng chính | 18:41:54–18:50:36 ngày 27/10, giờ Việt Nam; [session 03](data/live-session-03/capture-summary.json) |
| Telemetry | 522 MQTT sensor messages, 522 STOMP sensor events, 174 mỗi cảm biến; 522 hàng SQL khớp ID/mã/giá trị/đơn vị/timestamp, 0 sai lệch; [đối chiếu](data/telemetry-comparison.json) |
| Biến đổi ánh sáng | Người dùng xác nhận đã thao tác sáng/tối; LDR quan sát 4,32–96,832 lux trong session 03. Lux ước lượng, chưa hiệu chuẩn. Không đổi số liệu để tạo đường đẹp |
| LED qua REST | 617–622: user123/LED1, user124/LED2, user125/LED1, mỗi người ON rồi OFF; cả sáu có MQTT command/status, STOMP, SQL confirmedAt và REST xác nhận đúng người gửi |
| LED qua Web | 627/628: LED2 ON/OFF sau khi cắm lại, cả hai xác nhận; kết thúc hai Device OFF |
| Không có ESP32 | 623–626 gửi từ Web khi đã rút: không có MQTT status, confirmedAt NULL, có STOMP DEVICE_TIMEOUT; Device không tự đổi. 625 được chụp khi còn Processing |
| Offline → Online | Backend đánh dấu Offline sau reading cuối khoảng 30 giây; Dashboard tự Online và tiếp tục nhận số đo sau khi cắm lại, không restart dịch vụ |
| API | 142 kiểm tra PASS, 0 FAIL và 1 mục OBSERVED trạng thái hardware; [api-review](data/api-review.json). Các mục kiểm tra không phải 142 endpoint hoặc 142 ca độc lập |
| Profile | PUT tạm user125, GET xác nhận, chặn email trùng/username giả/avatar HTTP, khôi phục tám trường trong finally; user123 không đổi. updatedAt của user125 có thay đổi do PUT |
| JWT | Không token/token sai/token hết hạn bị từ chối; ba tài khoản login và đọc hồ sơ đúng chủ thể. Phiên UI cũ hết hạn được chuyển về Login và đăng nhập lại thành công |
| History | Người thực hiện khớp JWT và User liên kết; page 5/10/15/20, sort/filter được rà bằng API; có ảnh sáu cột đủ ngày giờ, Processing thật và ảnh phụ ba tác giả |
| Data Sensor | Dropdown chỉ chọn trường tìm, chưa lọc ngay; tìm giá trị sau submit; tìm 27/10/2026 18:44:00 trả ba reading đúng một giây; có ảnh |
| Chart | Một SVG, 15 điểm mỗi đường, X đầu=60/cuối=1026 cùng nhau ở viewport desktop; timestamp thật từng sensor trong tooltip; ẩn/hiện chú giải và reload được kiểm tra; [DOM](data/chart-dom-online.json) |
| Thông báo LED | Pending ON xanh, OFF đỏ, nền transparent, padding 0; [CSS thực tế](data/pending-message-style.json), ảnh pending và timeout |
| Responsive/console | History desktop đủ sáu cột; mobile390×844 cuộn bảng trong vùng riêng. Console lần kiểm tra cuối không có warn/error được ghi nhận |
| Kiểm thử tự động | 12 Frontend PASS; 4 Backend H2/MQTT mock PASS (không phải bốn thử nghiệm ESP32); Vite và Docker app image build thành công |
| Runtime | App/broker healthy, MySQL đọc được; IOT_LED_DEMO_ENABLED=false, app dùng tcp://mosquitto:1883; MQTT LAN host port1325. Credentials có cấu hình, không lưu giá trị ở báo cáo |

Chi tiết 12 lệnh chủ động: [planned-command-results](data/planned-command-results.json). Các ID595–616 có trong export quan sát rộng nhưng không tính vào 12 ca trên. Session đầu bị gián đoạn bởi runtime restart trước đó; session02 là quan sát bổ sung. Chỉ dùng số liệu session03 cho bảng chốt, không cộng các đoạn thành một phép đo liên tục.

## Ảnh nên dùng

Xem [IMAGE_CATALOG](IMAGE_CATALOG.md). Ảnh được chụp từ trang thật, không sửa đường biểu đồ hoặc số đo. Chọn ảnh đủ khung cho hình chính; ảnh bảng10 hàng bị cắt phân trang chỉ dùng phụ.

## Giới hạn còn lại

- Chưa cắt broker/Wi-Fi, thử ACK muộn/lặp/đảo thứ tự với phần cứng thật, chạy dài hạn hoặc tải nhiều client. Không đánh dấu PASS cho các mục này.
- MQTT telemetry chỉ có sensorCode/value: Backend gán recordedAt, không có sampleId/timestamp đo chung. 15 vị trí X là thứ tự reading của từng sensor; nhãn theo nhiệt độ, không phải ba phép đo cùng thời điểm. Sau rút/cắm, các điểm cũ có thể nằm cạnh reading mới đúng theo thứ tự.
- Khoảng ngắt lớn nhất của session03 bao gồm thao tác rút ESP32 có chủ đích; không diễn giải thành độ trễ mạng tự phát. Các số ms command/status là cùng observer, không phải thời gian đèn phát sáng.
- Trạng thái GPIO được firmware phản hồi qua MQTT; chưa có ảnh/xác nhận quang học riêng cho từng lần LED trong phiên này. Người dùng đã xác nhận hoàn tất thao tác ánh sáng, chưa xác nhận riêng hai LED bằng lời.
- Bổ sung ảnh mạch toàn cảnh/cận chân nối/Serial và xác nhận firmware đang nạp; không suy ra firmware thực từ sketch trên máy. Không công bố config.h, credentials hoặc JWT.
- Cảnh báo timeout gắn với thao tác trên Dashboard hiện tại; rời trang rồi quay lại không giữ nguyên thông báo tạm. ActionHistory và trạng thái thiết bị vẫn được đọc từ Backend; kiểm thử đã chụp timeout khi giữ nguyên trang.

## Bảo toàn

Không sửa firmware, broker, schema, không xóa dữ liệu/volume hoặc restart container trong lượt chốt. Có tạo history kiểm thử và PUT tạm user125 rồi khôi phục các trường. Build lại image để giữ bản CSS hiện tại khi tạo lại app về sau; không chạy up/down. Bộ21/10 giữ nguyên và được đối chiếu SHA256, xem [integrity](data/old-evidence-integrity.json). Không commit/push.
