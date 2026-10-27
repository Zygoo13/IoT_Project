# CHƯƠNG 1. GIỚI THIỆU

## 1.1. Đặt vấn đề

Theo dõi điều kiện môi trường và điều khiển thiết bị từ xa là một bài toán ứng dụng của Internet vạn vật. Với một không gian nhỏ như góc học tập hoặc phòng thực hành, người sử dụng cần biết nhiệt độ, độ ẩm và mức ánh sáng, đồng thời có thể thao tác thiết bị trên cùng một giao diện. Việc chỉ đọc số liệu tại Serial Monitor chưa đáp ứng yêu cầu lưu trữ, tra cứu lịch sử hoặc truy cập bằng trình duyệt.

Đề tài xây dựng hệ thống IoT giám sát môi trường và điều khiển hai LED qua Web. ESP32 thu thập số đo và trao đổi với hệ thống qua MQTT. Backend kiểm tra, lưu dữ liệu vào MySQL và cung cấp REST API. Frontend nhận cập nhật qua STOMP/WebSocket để người dùng theo dõi mà không phải tải lại trang liên tục.

Một yêu cầu quan trọng là phân biệt yêu cầu điều khiển với trạng thái được xác nhận. Khi người dùng bấm Bật đèn, hệ thống cần ghi lại lệnh và chờ phản hồi từ ESP32; việc gửi yêu cầu thành công không đủ để khẳng định thiết bị đã bật. Yêu cầu này được thể hiện xuyên suốt trong thiết kế lịch sử, xử lý timeout và giao diện Dashboard.

## 1.2. Mục tiêu đề tài

| Mã | Mục tiêu | Tiêu chí đánh giá |
| --- | --- | --- |
| MT01 | Thu thập nhiệt độ, độ ẩm và ánh sáng | Dữ liệu từ MQTT được lưu đúng Sensor, giá trị và thời gian; có thể đối chiếu với sự kiện realtime |
| MT02 | Giám sát trên Dashboard | Hiển thị số đo cuối, một biểu đồ ba đường và tình trạng kết nối phần cứng |
| MT03 | Điều khiển hai LED có xác nhận | Lệnh có requestId; phản hồi được ghép đúng lịch sử; không tự đổi trạng thái khi chưa có xác nhận |
| MT04 | Tra cứu dữ liệu và lịch sử điều khiển | Tìm kiếm, lọc, sắp xếp và phân trang được thực hiện qua API |
| MT05 | Bảo vệ thao tác người dùng | Đăng nhập, kiểm tra JWT và quản lý thông tin hồ sơ |
| MT06 | Chuẩn bị triển khai và giải thích hệ thống | Có cấu hình môi trường, hướng dẫn khởi động và Swagger/OpenAPI |

## 1.3. Phạm vi thực hiện

Hệ thống phục vụ môi trường thực hành trong mạng Wi-Fi nội bộ. Phần cứng gồm ESP32, cảm biến DHT11, cảm biến ánh sáng dùng LDR và hai LED. DHT11 tạo hai nguồn dữ liệu logic là nhiệt độ và độ ẩm; LDR tạo nguồn ánh sáng. Hai LED đại diện cho thiết bị chấp hành trong mô hình.

Ứng dụng có năm màn hình: Đăng nhập, Dashboard, Dữ liệu cảm biến, Lịch sử điều khiển và Hồ sơ. Bản hiện tại chuẩn bị ba tài khoản user123, user124 và user125 dùng chung các chức năng; lịch sử xác định người thực hiện từng lệnh bằng username. Đề tài không triển khai đăng ký, quên mật khẩu hoặc quản trị nhiều vai trò. Việc điều khiển dừng ở mô hình LED, chưa điều khiển thiết bị điện lưới.

Ánh sáng được quy đổi từ ADC theo công thức của firmware để phục vụ quan sát biến đổi. Giá trị lux là ước lượng chưa hiệu chuẩn, không được dùng để khẳng định độ chính xác của một thiết bị đo chuyên dụng. Bản firmware nằm trong repository cũng cần được đối chiếu với chương trình đã nạp và mạch thực tế trước khi hoàn thiện hồ sơ phần cứng.

## 1.4. Phương pháp thực hiện

Đề tài được thực hiện qua các bước: phân tích yêu cầu và mô hình trong TH1; thiết kế phần cứng, dữ liệu và giao diện; xây dựng Backend/Frontend; tích hợp MQTT và WebSocket; cuối cùng kiểm tra các luồng với ESP32. Kết quả được đối chiếu giữa nhiều lớp để tránh đánh giá chỉ dựa vào một ảnh giao diện.

Trong phiên thu minh chứng ngày 21/10/2026, hệ thống được quan sát tại MQTT, STOMP, REST và MySQL. Các thao tác LED được thực hiện từ Web; sau đó rút ESP32 để kiểm tra trạng thái Offline và trường hợp không có xác nhận. Dữ liệu, ảnh và bảng đối chiếu được lưu cùng dự án để truy nguyên khi viết báo cáo.

Ngày 27/10/2026, sau khi thêm hai tài khoản và cột Người thực hiện, hệ thống được kiểm tra hồi quy bằng test Backend/Frontend và kiểm tra đăng nhập, hồ sơ, API lịch sử với cả ba tài khoản. Các test điều khiển đa tài khoản dùng cơ sở dữ liệu cô lập và MQTT mock; phiên kiểm tra này không phát lệnh LED thật. Vì vậy kết quả phần mềm mới được dẫn riêng, không cộng vào số phép thử phần cứng trước đó.

## 1.5. Bố cục báo cáo

Báo cáo gồm bốn chương. Chương 1 giới thiệu bài toán, mục tiêu và phạm vi. Chương 2 phân tích chức năng, dữ liệu, quy tắc và tiêu chí đánh giá. Chương 3 trình bày kiến trúc và thiết kế từng chức năng, kèm giao diện, luồng xử lý, API và kết quả kiểm tra tương ứng. Chương 4 tổng hợp kết quả, các hạn chế và hướng phát triển.
