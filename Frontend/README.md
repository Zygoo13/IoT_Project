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
- `pages/Dashboard.jsx`: `taiDashboard` lấy trạng thái ban đầu; `utils/dashboard.js` giữ tối đa 15 điểm mỗi sensor theo timestamp thật; EnvironmentChart vẽ ba đường chung một biểu đồ SVG. `xuLyRealtime` xử lý từng topic và tải lại REST khi kết nối lại.
- Lệnh LED: `dieuKhienThietBi` gửi POST; `trangThaiLenh` chỉ giữ tiến độ yêu cầu. `DeviceControl` luôn vẽ trạng thái/icon từ `device.status`. `kiemTraYeuCau` đọc history để kiểm tra CONFIRMED/TIMEOUT; timer 11 giây chỉ gọi REST, không tự xác nhận lệnh.
- `pages/DataSensor.jsx` và `ActionHistory.jsx`: state `tuKhoa` là dữ liệu đang nhập, `tuKhoaDaApDung`/`thoiGianDaApDung` là điều kiện đã áp dụng. Effect gửi Search/Filter/Sort/Page lên Backend, mặc định 5 dòng/trang (chọn 5/10/15/20) và sort theo ID. Đổi điều kiện về trang đầu; response cũ bị bỏ qua khi truy vấn đã đổi.
- `pages/Profile.jsx`: tách form đang sửa khỏi profile đã lưu. Hủy không gửi PUT; `taoDuLieuCapNhat` chỉ gửi tám trường được phép, URL trống thành null.
- `utils/dateTime.js` chuyển giờ Việt Nam sang UTC khi lọc và kiểm tra ngày/khoảng thời gian; `formatValue.js` hiển thị một chữ số thập phân.

Component giữ phần hiển thị và sự kiện UI; page giữ state và luồng nghiệp vụ. Các hằng số tên sensor, đơn vị, lựa chọn ON/OFF là thông tin giao diện; số đo, trạng thái thiết bị và Profile vẫn lấy từ Backend.

## Biểu đồ hiện tại — 21/10/2026

`Dashboard.jsx` tải REST ban đầu và nhận STOMP → `utils/dashboard.js` giữ tối đa 15 reading mới nhất mỗi Sensor → `components/EnvironmentChart.jsx` và `utils/chartModel.js` vẽ ba đường chung một SVG.

- Một biểu đồ chung; trục X có 15 vị trí cách đều tương ứng 15 bản ghi gần nhất của từng Sensor. Nhãn giờ HH:mm:ss lấy từ bản ghi nhiệt độ ở đúng vị trí (nếu chưa có nhiệt độ thì dùng Sensor có dữ liệu đầu tiên); đây không phải thang thời gian liên tục hoặc định danh chu kỳ đo chung. Ba đường đủ 15 reading cùng bắt đầu/kết thúc ở mép vùng vẽ. Chưa đủ 15 thì để trống bên trái, không bịa số đo.
- Trục Y chung giữ nguyên giá trị °C/%RH/lux. Chú giải chỉ còn tên, màu, đơn vị; bấm để ẩn/hiện đường, tối thiểu còn một đường. Không có nút tạm dừng, dòng mô tả 15 bản ghi, chữ Bản ghi (cũ → mới) hoặc bộ đếm 15/15.
- Tooltip lấy đúng điểm ở vị trí chọn của từng Sensor, ghi giá trị/đơn vị và ngày giờ thật riêng. Cùng vị trí không khẳng định cùng lần đo. Hỗ trợ chuột, trái/phải, Home/End, Escape.
- Không timer/requestAnimationFrame/tự trượt hoặc nội suy số đo. Mỗi đường giữ 15 bản ghi không phụ thuộc số giây, giữ nguyên zero/spike. Reading đến muộn không làm card/latest lùi.
- ResizeObserver cập nhật chiều rộng SVG và được hủy khi rời trang. Nhãn giờ căn giữa đúng X của điểm và cập nhật khi bản ghi mới vào; không đặt giờ nội suy giữa các reading. Khi thiếu chỗ chỉ giảm số chữ trên trục, giữ đủ 15 điểm và nhãn đầu/cuối. Không đổi mốc giờ khi ẩn/hiện đường.
- recordedAt là lúc lưu tại Backend; firmware chưa có thời gian đo/cycleId. Không tự sửa timestamp để giả đồng bộ ba phép đo.

## Kiểm tra

`npm test`: 12 kiểm tra qua, gồm ba Sensor lệch timestamp nhưng cùng 15 tọa độ X, nhãn khớp điểm, dữ liệu chưa đủ/rỗng, zero/spike và giá trị gốc trong tooltip. Build local/Docker thành công: JS 266.88 kB (gzip 84.32 kB). Chi tiết: [biên bản kiểm tra](../Docs/PROJECT_REVIEW_2026-10-21.md).
