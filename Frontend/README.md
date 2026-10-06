# Frontend IoT

Chạy cùng Backend trong một container tại `http://localhost:8088`: xem
[README gốc](../README.md). Bản Docker phục vụ file React đã build qua Nginx;
không cần Vite, các đường `/api` và `/ws` dùng cùng origin.

Giao diện React/Vite cho năm màn hình của bài TH1. Dữ liệu nghiệp vụ lấy từ Backend thật; không có seed hoặc mock trong React.

## Chạy cục bộ

1. Khởi động MySQL, Mosquitto và Backend theo `../Backend/README.md`.
2. Trong thư mục `Frontend`, chạy `npm install` rồi `npm run dev`.
3. Mở **http://localhost:5173**. Dùng tài khoản User seed đã cấu hình ở Backend.

`vite.config.js` chuyển `/api` và WebSocket gốc `/ws` đến Backend tại `127.0.0.1:8080` trong lúc phát triển. Backend chỉ cho phép WebSocket origin `http://localhost:5173` theo mặc định. Khi triển khai bản build ở origin khác, cần cấu hình reverse proxy tương ứng và đổi `IOT_FRONTEND_ORIGIN` ở Backend; Vite proxy chỉ hoạt động với dev server.

Login lấy JWT từ `POST /api/auth/login`. Các REST request khác gửi Bearer JWT; STOMP gửi JWT trong frame `CONNECT`. Sau mỗi lần WebSocket kết nối lại, màn hình đang mở tải lại REST. Nút LED chỉ gửi yêu cầu; trạng thái LED đổi theo xác nhận của Backend. Không có upload ảnh: Profile chỉ lưu `avatarUrl` HTTPS.

Khi chưa có reading, Dashboard hiện `N/A` và biểu đồ rỗng. `GET /api/sensor-data` và `GET /api/action-history` là nguồn cho hai bảng, mỗi trang tối đa 20 dòng. Thời gian hiển thị/nhập theo `dd/MM/yyyy HH:mm:ss` tại `Asia/Ho_Chi_Minh`; request lọc thời gian chuyển sang UTC ISO 8601.

## Đọc code theo luồng

- `src/main.jsx` → `App.jsx`: khởi động React và khai báo route. `ProtectedRoute` kiểm tra phiên; `Layout` giữ sidebar và vòng đời kết nối realtime.
- `pages/Login.jsx` → `services/api.js`: đăng nhập, lưu JWT, gửi Bearer cho REST. API trả 401 thì xóa phiên và về Login; 401 ở Login chỉ báo sai thông tin.
- `services/realtime.js`: tạo WebSocket gốc, gửi STOMP CONNECT, subscribe bốn topic, ghép frame và kết nối lại sau 5 giây. `onRealtime` trả hàm hủy đăng ký khi trang đóng.
- `pages/Dashboard.jsx`: `loadDashboard` lấy trạng thái ban đầu; `applySensorUpdate` giữ tối đa 15 điểm mỗi sensor; `buildChartRows` ghép theo thời gian để vẽ. `handleRealtimeEvent` xử lý từng topic và tải lại REST khi kết nối lại.
- Lệnh LED: `handleDeviceControl` gửi POST; `commandStates` chỉ giữ tiến độ yêu cầu. `DeviceControl` luôn vẽ trạng thái/icon từ `device.status`. `reconcileRequest` đọc history để kiểm tra CONFIRMED/TIMEOUT; timer 11 giây chỉ gọi REST, không tự xác nhận lệnh.
- `pages/DataSensor.jsx` và `ActionHistory.jsx`: state `...Input` là dữ liệu đang nhập, `applied...` là điều kiện đã áp dụng. Effect gửi Search/Filter/Sort/Page lên Backend, 20 dòng/trang và sort theo ID. Đổi điều kiện về trang đầu; response cũ bị bỏ qua khi truy vấn đã đổi.
- `pages/Profile.jsx`: tách form đang sửa khỏi profile đã lưu. Hủy không gửi PUT; `createProfileUpdate` chỉ gửi tám trường được phép, URL trống thành null.
- `utils/dateTime.js` chuyển giờ Việt Nam sang UTC khi lọc và kiểm tra ngày/khoảng thời gian; `formatValue.js` hiển thị một chữ số thập phân.

Component giữ phần hiển thị và sự kiện UI; page giữ state và luồng nghiệp vụ. Các hằng số tên sensor, đơn vị, lựa chọn ON/OFF là thông tin giao diện; số đo, trạng thái thiết bị và Profile vẫn lấy từ Backend. `src/styles.css` được giữ nguyên trong đợt chỉnh code này.

## Kiểm tra đợt chỉnh code (06/10/2026)

- Build từng nhóm file và build cuối bằng `npm run build`: thành công. Vite còn cảnh báo bundle trên 500 kB; không thêm thư viện hoặc đổi cách chia bundle trong lượt này.
- Browser với phiên đã đăng nhập: Dashboard/biểu đồ, chuyển trang, hai bảng Search/Filter/Sort/Page, khoảng thời gian sai và kết quả rỗng; Profile sửa/hủy, PUT các giá trị hiện có và reload đều đã thử.
- LED qua UI + Mosquitto/MySQL thật: LED2 OFF Pending rồi xác nhận muộn; LED1 OFF Pending rồi Timeout, LED1 vẫn ON. REST/DB xác nhận deliveryState tương ứng. Chỉ dọn hai history do lượt thử tạo; dữ liệu demo giữ nguyên.
- Browser Login sai hiển thị lỗi; login đúng qua API trả thành công. Phiên browser cũ hết hạn khi ngắt/bật Vite và được đưa về Login. Chưa hoàn tất phép thử browser reconnect với token mới còn hiệu lực; cần đăng nhập lại để thử phần này.
- Kiểm tra riêng các hàm: mã hóa query, UTC/ngày không hợp lệ, hiển thị một chữ số thập phân, JWT/401; CONNECT/SUBSCRIBE, frame STOMP nhận từng phần, JSON sai, vòng reconnect và hủy kết nối đều qua. Phép thử STOMP này dùng môi trường JavaScript cô lập, không thay thế phép thử reconnect trong browser.
- Chưa thử phần cứng ESP32; phản hồi MQTT trong lượt này do terminal gửi. Không có dữ liệu giả trong React.
