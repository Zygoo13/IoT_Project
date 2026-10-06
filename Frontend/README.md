# Frontend IoT

Giao diện React/Vite cho năm màn hình của bài TH1. Dữ liệu nghiệp vụ lấy từ Backend thật; không có seed hoặc mock trong React.

## Chạy cục bộ

1. Khởi động MySQL, Mosquitto và Backend theo `../Backend/README.md`.
2. Trong thư mục `Frontend`, chạy `npm install` rồi `npm run dev`.
3. Mở **http://localhost:5173**. Dùng tài khoản User seed đã cấu hình ở Backend.

`vite.config.js` chuyển `/api` và WebSocket gốc `/ws` đến Backend tại `127.0.0.1:8080` trong lúc phát triển. Backend chỉ cho phép WebSocket origin `http://localhost:5173` theo mặc định. Khi triển khai bản build ở origin khác, cần cấu hình reverse proxy tương ứng và đổi `IOT_FRONTEND_ORIGIN` ở Backend; Vite proxy chỉ hoạt động với dev server.

Login lấy JWT từ `POST /api/auth/login`. Các REST request khác gửi Bearer JWT; STOMP gửi JWT trong frame `CONNECT`. Sau mỗi lần WebSocket kết nối lại, màn hình đang mở tải lại REST. Nút LED chỉ gửi yêu cầu; trạng thái LED đổi theo xác nhận của Backend. Không có upload ảnh: Profile chỉ lưu `avatarUrl` HTTPS.

Khi chưa có reading, Dashboard hiện `N/A` và biểu đồ rỗng. `GET /api/sensor-data` và `GET /api/action-history` là nguồn cho hai bảng, mỗi trang tối đa 20 dòng. Thời gian hiển thị/nhập theo `dd/MM/yyyy HH:mm:ss` tại `Asia/Ho_Chi_Minh`; request lọc thời gian chuyển sang UTC ISO 8601.
