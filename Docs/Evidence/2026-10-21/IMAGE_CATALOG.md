# Danh mục ảnh dùng cho báo cáo

Các ảnh là chụp trực tiếp bản UI đang chạy ngày 21/10/2026. Tên F chỉ để tra cứu trong bộ minh chứng, không tự coi là số Hình cuối cùng của báo cáo; F12/F15 trong kế hoạch thiết kế có thể là sơ đồ riêng. Khi viết sẽ đánh số theo chương và mạch chức năng.

| File | Đặt ở | Caption/ý nghĩa đúng |
| --- | --- | --- |
| [F08-login-empty-no-credentials.png](images/F08-login-empty-no-credentials.png) | 3.4 Đăng nhập | Giao diện Login, đã xóa dữ liệu tự điền; không chứa mật khẩu/token. |
| [F10-dashboard-online-both-off.png](images/F10-dashboard-online-both-off.png) | 3.5 Dashboard | Phần cứng online, ba số đo thật, hai LED OFF trước thử. |
| [F10d-dashboard-light-response.png](images/F10d-dashboard-light-response.png) | 3.5 Dashboard | Ánh sáng thật thay đổi sau khi người dùng chiếu/che cảm biến. |
| [F10e-dashboard-after-light-change.png](images/F10e-dashboard-after-light-change.png) | 3.5 Dashboard | Dashboard sau thay đổi ánh sáng, giữ số đo và UI thực tế. |
| [F10g-chart-light-change.png](images/F10g-chart-light-change.png) | 3.5 Biểu đồ | Crop biểu đồ theo số đo thật; không làm đẹp hoặc tạo giá trị. |
| [F10c-chart-tooltip-real-readings.png](images/F10c-chart-tooltip-real-readings.png) | 3.5 Tooltip | Giá trị, đơn vị và thời gian riêng từng Sensor. |
| [F13a-led-before.png](images/F13a-led-before.png) | 3.6 LED | Cả hai LED được ghi nhận OFF trước thử. |
| [F13b-led1-on-led2-off.png](images/F13b-led1-on-led2-off.png) | 3.6 LED | LED1 đã được xác nhận ON, LED2 OFF. |
| [F13d-led-both-on.png](images/F13d-led-both-on.png) | 3.6 LED | Cả hai LED được xác nhận ON; bổ sung ảnh bóng thật riêng. |
| [F13f-led-both-off-confirmed.png](images/F13f-led-both-off-confirmed.png) | 3.6 LED | Hai LED đã được xác nhận OFF trước khi rút phần cứng. |
| [F13h-offline-led2-pending.png](images/F13h-offline-led2-pending.png) | 3.6 Nhánh lỗi | Dashboard đang chờ bật LED2 khi phần cứng đã mất kết nối. |
| [F13i-led2-timeout-message.png](images/F13i-led2-timeout-message.png) | 3.6 Nhánh lỗi | Thông báo chưa nhận phản hồi, LED2 vẫn OFF. |
| [F15-dashboard-offline-command-timeout.png](images/F15-dashboard-offline-command-timeout.png) | 3.6/3.11 Timeout | Toàn Dashboard offline và lỗi lệnh; số đo cuối giữ nguyên. |
| [F10f-dashboard-hardware-offline.png](images/F10f-dashboard-hardware-offline.png) | 3.5/3.11 Offline | Banner không nhận dữ liệu từ phần cứng sau khi rút ESP32. |
| [F16-sensor-data-real.png](images/F16-sensor-data-real.png) | 3.7 Dữ liệu cảm biến | Bảng nhận telemetry thật trong lúc phần cứng còn online. |
| [F16b-sensor-search-temperature-value.png](images/F16b-sensor-search-temperature-value.png) | 3.7 Tìm giá trị | Tìm 32.0 °C theo Nhiệt độ; kết quả lấy từ dữ liệu thật. |
| [F16c-sensor-search-date.png](images/F16c-sensor-search-date.png) | 3.7 Tìm thời gian | Tìm ngày 21/10/2026, có các ID 9282–9284 đã đối chiếu SQL/STOMP. |
| [F18-history-four-confirmations-and-timeout.png](images/F18-history-four-confirmations-and-timeout.png) | 3.8 Lịch sử | requestId 564–567 xác nhận thật, 568 không có phản hồi. Nhãn TẮT ở cột trạng thái không thay thế deliveryState TIMEOUT. |
| [F18a-history-processing-empty-after-timeout.png](images/F18a-history-processing-empty-after-timeout.png) | 3.8 Kết quả rỗng | Bộ lọc Processing trả rỗng sau khi lệnh timeout; KHÔNG là ảnh một hàng đang Processing. |
| [F20-profile-view.png](images/F20-profile-view.png) | 3.9 Hồ sơ | Hồ sơ tài khoản của người dùng, có thông tin cá nhân thật. |
| [F20b-profile-edit.png](images/F20b-profile-edit.png) | 3.9 Hồ sơ | Form chỉnh sửa; đã bấm Hủy, không PUT thay đổi hồ sơ. |
| [F22-swagger-overview-no-token.png](images/F22-swagger-overview-no-token.png) | 3.10 API docs | Tổng quan 7 thao tác REST, không mở Authorize hoặc lộ JWT. |

## Ảnh phụ/không cần đưa hết vào bài

F10b, F13c, F13e là trạng thái xác nhận bổ sung. F13c và F13e đã được kiểm tra ảnh: không còn spinner/chờ, vì phản hồi nhanh; không gán chúng làm hình PENDING. F13g là ảnh tiến trình thử offline bổ sung. Chọn bộ 8–12 ảnh chính phù hợp dung lượng báo cáo, đưa ảnh trùng/phụ vào phụ lục nếu cần.

Ảnh mạch/Serial phải bổ sung vào hardware-photos theo README ở đó. Không dùng ảnh màn hình Dashboard để chứng minh bóng LED vật lý sáng.
