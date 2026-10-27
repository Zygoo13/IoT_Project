# CHƯƠNG 4. KẾT LUẬN

## 4.1. Kết quả đạt được

Đề tài đã xây dựng hệ thống kết nối ESP32, Mosquitto, Spring Boot, MySQL và React cho bài toán giám sát môi trường và điều khiển hai LED. Ứng dụng cung cấp năm màn hình, ba tài khoản cùng nhóm chức năng, xác thực bằng JWT, lưu trữ năm bảng và tài liệu REST API bằng Swagger/OpenAPI. Giao diện sử dụng một biểu đồ chung cho ba đại lượng và phân biệt thao tác điều khiển với trạng thái được xác nhận. Lịch sử ghi nhận username của người thực hiện từng lệnh.

| Mục tiêu | Kết quả theo phiên thu minh chứng |
| --- | --- |
| MT01 — Thu thập cảm biến | 420 sự kiện STOMP được đối chiếu SQL theo ID, Sensor, giá trị và timestamp, không có sai lệch trong tập quan sát |
| MT02 — Giám sát Dashboard | Có ảnh Dashboard, tooltip, biến đổi ánh sáng thật và trạng thái Offline; biểu đồ tối đa 15 reading mỗi Sensor |
| MT03 — Điều khiển có xác nhận | Bốn lệnh ON/OFF có xác nhận xuyên suốt phần mềm; hai ca sau khi rút ESP32 xác minh timeout và giữ Device OFF |
| MT04 — Tra cứu | Có ảnh dữ liệu thật, tìm giá trị/ngày và lịch sử tương ứng các request đã đối chiếu; ngày 27/10 bổ sung username và kiểm tra khớp SQL qua các trang/bộ lọc |
| MT05 — Xác thực và hồ sơ | Ngày 27/10, cả ba tài khoản đăng nhập và GET hồ sơ đúng chủ thể; request không token tới History trả 401. Lượt cuối đã thử PUT/khôi phục user125, JWT thiếu/sai/hết hạn; không khẳng định bao phủ mọi nhánh |
| MT06 — Triển khai và API docs | Có cấu hình app/broker, sử dụng MySQL container/volume hiện có và Swagger bảy thao tác REST |

Kết quả quan trọng là có thể truy nguyên một reading từ sự kiện realtime tới hàng SQL, và một lệnh LED từ requestId tới MQTT status, lịch sử và giao diện. Các phép thử timeout cho thấy hệ thống không tự coi việc tiếp nhận lệnh là điều khiển thành công khi thiết bị không phản hồi.

Bản cập nhật ngày 27/10 vượt qua 4 test Backend cô lập và 12 test Frontend; kiểm tra API thật xác nhận ba tài khoản hoạt động và lịch sử cũ giữ nguyên tác giả. Test xác định người gửi dưới ba JWT dùng MQTT mock, nên không bổ sung số lần điều khiển phần cứng thành công. Các kết quả này nằm trong [minh chứng đa tài khoản](../Evidence/2026-10-27/README.md), tách khỏi phiên phần cứng ngày 21/10.

Lượt rà soát cuối ngày 27/10 bổ sung522 reading MQTT/STOMP khớp SQL, tám lệnh617–622/627–628 xác nhận và bốn timeout 623–626. Ba tài khoản có lệnh thật được ghi đúng người thực hiện. Có ảnh Processing, thông báo ON xanh/OFF đỏ không nền và Dashboard tự Online sau cắm lại;142 mục API PASS, không có FAIL. PUT tạm user125 đã khôi phục các trường, JWT thiếu/sai/hết hạn bị chặn. Xem [báo cáo chốt](../Evidence/2026-10-27-final-review/README.md). Các số liệu21/10 ở bảng trên giữ đúng nguồn lịch sử, không gộp chung với lượt cuối.

## 4.2. Hạn chế

Payload cảm biến hiện chỉ chứa mã và giá trị; chưa có thời điểm lấy mẫu hoặc mã chu kỳ. Thời gian lưu do Backend gán, nên các reading của ba Sensor có thể khác nhau dù được in cạnh nhau trên Serial. Cách biểu diễn theo 15 vị trí giúp so sánh xu hướng, nhưng không chứng minh đồng bộ thời gian đo. Phiên21/10 từng ghi nhận khoảng trống/burst MQTT tới10,25 giây, chưa xác định nguyên nhân. Khoảng ngắt lớn của session03 ngày 27/10 tương ứng thao tác rút ESP32 chủ động, không phải bằng chứng độ trễ mạng tự phát.

Ánh sáng dùng hàm quy đổi ADC chưa hiệu chuẩn. Trạng thái LED được xác nhận qua chương trình và mức GPIO, chưa có phản hồi vật lý độc lập. Ảnh mạch, thông số đấu dây và xác nhận firmware đã nạp cần bổ sung trước khi hoàn thiện hồ sơ.

Phạm vi kiểm tra chưa bao gồm chạy dài hạn, tải nhiều client, cắt broker/Wi-Fi, phản hồi muộn/lặp/đảo thứ tự với phần cứng thật và toàn bộ nhánh lỗi API. Vì vậy, báo cáo chỉ kết luận theo tập bằng chứng đã lưu, chưa khẳng định hệ thống đáp ứng vận hành sản xuất hoặc bảo đảm không mất bản tin. Cấu hình mạng thực hành cũng chưa áp dụng TLS đầy đủ.

## 4.3. Hướng phát triển

Ưu tiên tiếp theo là bổ sung định danh chu kỳ và timestamp lấy mẫu nếu cần so sánh ba đại lượng theo thời gian thực; việc này phải cập nhật hợp đồng MQTT và kiểm thử tương thích. Đồng thời cần đo riêng các chặng ESP32–broker–Backend để tìm nguyên nhân burst, thay vì chỉ điều chỉnh hiệu ứng biểu đồ.

Về phần cứng, có thể hiệu chuẩn phép đo ánh sáng bằng thiết bị tham chiếu và bổ sung cơ chế phản hồi độc lập cho thiết bị chấp hành. Về kiểm thử, cần kiểm tra broker mất kết nối, reconnect, xác nhận đến muộn và tải kéo dài. Về triển khai, có thể đưa MySQL vào cùng Compose bằng quy trình chuyển dữ liệu được kiểm tra, bổ sung TLS, quản lý secrets và sao lưu phục hồi.

Nhìn chung, hệ thống đã có luồng nghiệp vụ và bộ bằng chứng đủ làm nền cho báo cáo cuối kỳ. Những giới hạn còn lại được tách rõ để tiếp tục hoàn thiện, đồng thời giữ nguyên tính trung thực của kết quả thực nghiệm.
