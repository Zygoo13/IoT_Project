# Resource viết báo cáo — phiên bản 27/10/2026

**Chốt sau rà soát phần cứng ngày 27/10:** dùng [bộ kiểm tra cuối](../Evidence/2026-10-27-final-review/README.md) và [danh mục ảnh mới](../Evidence/2026-10-27-final-review/IMAGE_CATALOG.md). Có 522 reading khớp SQL, tám xác nhận LED thật (617–622, 627–628), bốn timeout chủ động (623–626), hàng Processing thật, ba tác giả và ảnh History/Swagger đủ khung. ESP32 đã cắm lại, Dashboard tự Online. Các đoạn/bảng ghi rõ phiên 21/10 vẫn là số liệu lịch sử, không cộng chung thành một phiên đo.

Đây là chỉ mục chọn nguồn khi viết tiếp, đồng bộ với thay đổi ba tài khoản và cột Người thực hiện. Cấu trúc báo cáo vẫn bốn chương; mỗi chức năng đi liền giao diện → sequence → API/message → triển khai/dữ liệu → kiểm tra. Không cần dựng lại bằng chứng phần cứng đã lưu.

**Sau rà ảnh:** [IMAGE_REVIEW](IMAGE_REVIEW.md) giữ đánh giá ảnh cũ và bổ sung danh mục ảnh mới. Hình 3.22 và 3.26 đã thay bằng ảnh desktop/Swagger của lượt kiểm tra cuối.

## 1. Bản sản phẩm cần mô tả

| Nội dung | Giá trị/ý nghĩa hiện tại |
| --- | --- |
| Tài khoản | user123, user124, user125, cùng chức năng; chưa có phân quyền hoặc đăng ký |
| History trên UI | ID → Thiết bị → **Người thực hiện** → Lệnh → Trạng thái → Thời gian |
| Người thực hiện | Tên đăng nhập `username`, không phải họ tên; lấy từ User của từng ActionHistory |
| Ghi người gửi | JWT đã xác thực → subject User.id → ActionHistory.userId; body điều khiển vẫn chỉ action |
| Đọc người gửi | ActionHistory.userId → User.username → HistoryRow.username → ô Người thực hiện |
| Danh sách lịch sử | Dùng chung giữa các tài khoản; đổi người xem không đổi tác giả của hàng cũ |
| Seed | Thêm username còn thiếu, không đặt lại tài khoản/hồ sơ/mật khẩu cũ; bỏ ràng buộc đúng một User |
| DB | Năm bảng/40 cột; các FK và schema không đổi; không thêm username vào ActionHistory |
| MQTT | Giữ ba topic và payload cũ; không thêm username vào command/status |
| LED | ON màu xanh/OFF màu đỏ cho thông báo thao tác; lỗi đỏ; trạng thái đèn chỉ đổi theo xác nhận |
| Phạm vi khác | Năm màn hình, một chart tối đa 15 reading mỗi Sensor; REST vẫn bảy thao tác |

## 2. Chọn đúng nguồn theo chức năng

| Phần báo cáo | Nguồn nên dùng | Lưu ý |
| --- | --- | --- |
| Giới thiệu, Phân tích | [Chương 1](01_GIOI_THIEU.md), [Chương 2](02_PHAN_TICH.md) đã cập nhật | Ba tài khoản không có nghĩa ba vai trò |
| CSDL | [Từ điển](PHU_LUC_DU_LIEU.md), schema và snapshot cột 21/10 | Thêm User là thêm hàng; vẫn năm bảng/40 cột |
| Login/Profile | Ảnh 21/10 + [verification 27/10](../Evidence/2026-10-27/verification.json) | Lượt cuối đã thử PUT/khôi phục user125, JWT thiếu/sai/hết hạn; xem api-review.json |
| Dashboard và telemetry | [Bộ phần cứng 21/10](../Evidence/2026-10-21/README.md), F23 và các ảnh F10 | 420 reading đối chiếu SQL; không tự cập nhật số đo khi ESP32 đã rút |
| LED ON/OFF, Offline, timeout | [F24](../Evidence/2026-10-21/F24_LED_CONTROL.md), ảnh F13/F15 | Bốn xác nhận + hai timeout của phiên 21/10; ảnh pending cũ chưa phản ánh màu thông báo mới |
| Data Sensor | Ảnh F16/F16b/F16c trong bộ 21/10 | Luồng này không đổi bởi cột History; ngày của dữ liệu trong ảnh là 21/10 |
| History — bố cục hiện tại | [History desktop](../Evidence/2026-10-27-final-review/images/history-six-columns-desktop.png) | Đủ tiêu đề/bộ lọc/sáu cột/phân trang; dùng Hình 3.22 |
| History — giải thích lệnh thật | [Ảnh F18 cũ](../Evidence/2026-10-21/images/F18-history-four-confirmations-and-timeout.png) + F24 | Có thể dùng như bằng chứng lịch sử phiên 21/10, không gọi là bố cục hiện tại |
| API hiện tại | [OpenAPI 27/10](../Evidence/2026-10-27/data/openapi-no-examples.json), [metadata xuất](../Evidence/2026-10-27/data/openapi-export.json) | Có HistoryRow.username; bản 21/10 chưa có trường này |
| Test đa tài khoản | [README 27/10](../Evidence/2026-10-27/README.md), verification và test source | Phân biệt H2/MQTT mock với API thật và ESP32 thật |
| Kết luận | [Chương 4](04_KET_LUAN.md) | Tách kết quả phần cứng 21/10 và hồi quy phần mềm 27/10 |

Ảnh ngày 21/10 giữ nguyên SHA256. Lượt kiểm tra cuối đã thu màu thông báo mới và history do cả ba tài khoản gửi thật; xem bộ riêng, không thay đổi ảnh/DB cũ để tạo kết quả.

F13c và F13d trùng hoàn toàn: chỉ chọn F13d. F13i bị cắt đầu card: dùng F15 có đủ ngữ cảnh để minh họa timeout. F20b có nút cuối form sát mép dưới nên là ảnh phụ, F20 đủ tốt cho hồ sơ xem. F22 nguồn rất dài: cần chọn ảnh tổng quan endpoint và schema riêng trước khi đưa vào Word. Không xóa nguồn để xử lý ảnh trùng/cũ.

## 3. API History và sequence cần đưa vào bài

### 3.1. Response hiện tại

`GET /api/action-history` vẫn trả `content`, `page`, `size`, `totalElements`, `totalPages`. Trong content:

| Trường | Giải thích |
| --- | --- |
| id | Khóa ActionHistory, đồng thời là requestId |
| deviceId | Khóa Device |
| deviceCode | LED1 hoặc LED2 |
| username | Tên đăng nhập của User gắn với hàng lịch sử |
| action | ON/OFF người dùng yêu cầu |
| status | ON/OFF đã ghi nhận cho history, không tự đồng nghĩa lệnh hoàn tất |
| createdAt | Thời điểm tạo, JSON UTC |
| confirmedAt | Thời điểm xác nhận hoặc null |
| deliveryState | PENDING, TIMEOUT hoặc CONFIRMED, suy ra theo lịch sử/thời gian |

Không thêm bộ lọc theo username trong lần sửa này; tham số tìm/lọc/sort/page giữ nguyên. API không trả passwordHash. Đổi tài khoản xem trang vẫn phải thấy đúng tác giả cũ. Hiện các hàng thật trong ảnh thuộc user123; không tự gán cho user124/user125.

### 3.2. Hai luồng cần giải thích

**Ghi:** React POST body chỉ action → Backend lấy User.id từ JWT → lưu ActionHistory(user, device, action) → commit → MQTT command có requestId → ESP32/status → cập nhật history và Device theo quy tắc cũ.

**Đọc:** React GET History → lọc và phân trang DB, tải User/Device bằng EntityGraph → DTO thêm username → render sáu cột. Không lấy username từ localStorage hay hồ sơ của người đang xem để điền mọi hàng.

Sequence trong Chương 3 đã được sửa theo hai luồng này. ERD không thêm bảng/cột hoặc đổi quan hệ.

## 4. Kết quả và giới hạn phải giữ khi viết

- **21/10:** 420 MQTT + 420 STOMP, 140/Sensor; 420 STOMP khớp SQL. Request 564–567 xác nhận, 568–569 timeout sau khi rút ESP32. Các giới hạn sampleId, lux ước lượng và phản hồi GPIO vẫn còn.
- **27/10, cô lập:** 4 test Backend dùng H2/MQTT mock: seed lặp/bảo toàn User, ghi người gửi ba JWT và lọc/page, chặn body giả actor, History rỗng. Bộ test còn kiểm tra dữ liệu hồ sơ seed hợp lệ và response không lộ mật khẩu. Frontend có 12 test hiện có; không gọi chúng là 12 test mới cho cột username.
- **27/10, API thật:** ba tài khoản login thành công; Profile đúng chủ thể; History hai trang và các bộ lọc khớp username SQL; Dashboard/SensorData đọc được; thiếu token trả 401; Swagger có username. Kiểm tra giữ nguyên tài khoản chính, tác giả/nội dung bất biến của lịch sử cũ, SensorData không giảm.
- **Chưa làm:** không gửi lệnh LED thật bằng hai tài khoản mới trong lượt này, không PUT hồ sơ thật, không kiểm tra broker/Wi-Fi lỗi hoặc ACK muộn/lặp bằng phần cứng. Không cộng test mock vào bốn ON/OFF đã xác nhận.
- Snapshot OpenAPI vừa xuất là phép đọc schema công khai, không phải chạy lại các phép thử tích hợp.

## 5. Mã nguồn đối chiếu

| Nội dung | Tệp |
| --- | --- |
| Định nghĩa DTO/Swagger | [ReadController.java](../../Backend/src/main/java/zygoo13/iot/api/ReadController.java) |
| Mapping username | [ReadService.java](../../Backend/src/main/java/zygoo13/iot/api/ReadService.java) |
| Tải User/Device cùng trang | [ActionHistoryRepository.java](../../Backend/src/main/java/zygoo13/iot/repository/ActionHistoryRepository.java) |
| Hiển thị sáu cột và colSpan rỗng | [ActionHistory.jsx](../../Frontend/src/pages/ActionHistory.jsx) |
| Seed tài khoản còn thiếu | [SeedData.java](../../Backend/src/main/java/zygoo13/iot/seed/SeedData.java) |
| User lấy từ JWT, body chỉ action | [DeviceCommandController.java](../../Backend/src/main/java/zygoo13/iot/api/DeviceCommandController.java) |
| Lưu actor trước publish | [DeviceCommandService.java](../../Backend/src/main/java/zygoo13/iot/api/DeviceCommandService.java) |
| Test đa tài khoản cô lập | [HistoryUsersIntegrationTest.java](../../Backend/src/test/java/zygoo13/iot/api/HistoryUsersIntegrationTest.java) |
| Công cụ live chỉ đọc | [verify-history-users.py](../../Backend/scripts/verify-history-users.py) |
| Màu thông báo | [DeviceControl.jsx](../../Frontend/src/components/DeviceControl.jsx), [styles.css](../../Frontend/src/styles.css) |

Không đưa mật khẩu đăng nhập, file môi trường, config.h, passwordHash hoặc JWT thật vào bài. Hai hồ sơ bổ sung dùng thông tin khởi tạo phục vụ tài khoản, không phải hai sinh viên/tác giả báo cáo.

## 6. Phần còn chờ

Ảnh mạch/Serial và xác nhận bản firmware đã nạp; xuất/soát hình từ Mermaid; hoàn thiện tài liệu tham khảo; người dùng định dạng Word theo TH1. Chi tiết ở [NEXT_SESSION](NEXT_SESSION.md). Không thay đổi runtime hoặc phần cứng chỉ để hoàn thành các đoạn văn đã có dữ liệu.

History desktop, Swagger tổng quan và schema username đã chụp lại bằng trình duyệt trong app. Ảnh mạch/Serial, xác nhận firmware đang nạp và định dạng Word vẫn cần người viết bổ sung.
