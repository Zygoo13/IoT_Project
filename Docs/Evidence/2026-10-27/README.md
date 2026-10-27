# Minh chứng cập nhật lịch sử đa tài khoản — 27/10/2026

## Thay đổi

- Cột Người thực hiện nằm trước Lệnh, lấy `ActionHistory.user.username`.
- API bổ sung `HistoryRow.username`; chỉ bổ sung trường, giữ các trường và tham số hiện có.
- Repository tải User/Device cùng trang history để tránh truy vấn bổ sung từng hàng.
- Thêm hai tài khoản `user124`, `user125`; tổng kiểm tra thực tế là ba, gồm tài khoản chính `user123`.
- Bỏ ràng buộc khởi động chỉ có đúng một User. Seed không sửa các tài khoản đã có; mật khẩu mới đọc từ môi trường, lưu BCrypt. Không thay schema năm bảng.

## Kiểm tra đã thực hiện

| Phạm vi | Kết quả | Giới hạn |
| --- | --- | --- |
| Frontend | 12/12 test hiện có; build thành công | Các test hiện có tập trung biểu đồ, realtime và thời gian |
| Backend | 4/4 test mới; Maven package thành công | Database H2 riêng; MQTT mock, không điều khiển GPIO thật |
| Seed | Gọi lại nhiều lần không thêm trùng, không đặt lại profile/password | Kiểm thử tự động; lần cập nhật app thực tế tạo đủ ba tài khoản |
| Tác giả lệnh | Ba JWT test tạo history gắn đúng người; từ chối body khai thêm userId/username | Thực hiện trong test cô lập, không publish tới broker thật |
| API thật | Cả ba tài khoản login thành công; Profile đúng tài khoản; đọc Dashboard/SensorData/History được | Không gửi POST điều khiển hoặc PUT Profile trên hệ thống thật |
| Lịch sử thật | Hai trang và các bộ lọc trả username khớp SQL; Swagger có username; không token trả 401 | Lịch sử hiện có là của tài khoản cũ; không tạo lịch sử giả cho hai tài khoản mới |
| Bảo toàn dữ liệu | Primary User giữ nguyên fingerprint toàn hàng; giữ liên kết tác giả và nội dung bất biến của lịch sử cũ; SensorData không giảm | Chỉ lưu digest kiểm tra ở tmp, không sao chép passwordHash vào tài liệu |
| UI | Cột đứng trước Lệnh, các hàng hiển thị user123 đúng lịch sử | Ảnh hẹp cắt Thời gian và mất đầu trang; chưa đạt làm ảnh báo cáo tổng quan, cần chụp lại |
| Runtime | Cập nhật riêng app, healthcheck thành công | Không restart broker hoặc MySQL; không đổi volume |

Trước cập nhật có một User và 270 ActionHistory. Công cụ kiểm tra live chỉ dùng GET/login và SQL SELECT. Không có lệnh LED thật do phiên kiểm tra này gửi, không tạo reading hoặc history mẫu.

## Tệp minh chứng

- [Danh mục ảnh và caption mới](IMAGE_CATALOG.md).
- [Rà soát toàn bộ ảnh](../../Report/IMAGE_REVIEW.md), có các ảnh trùng/cắt/không còn đúng bố cục hiện tại.
- [Ảnh cột Người thực hiện](images/history-username.png).
- [Kết quả kiểm tra API và SQL](verification.json), không có JWT/mật khẩu/hash.
- [OpenAPI hiện tại đã lược example](data/openapi-no-examples.json), có HistoryRow.username; [metadata thời điểm xuất](data/openapi-export.json).
- [Cách xuất schema công khai](tools/export-openapi.py), chỉ GET, không token hoặc lệnh điều khiển.
- [Test hồi quy Backend](../../../Backend/src/test/java/zygoo13/iot/api/HistoryUsersIntegrationTest.java).
- [Công cụ kiểm tra live chỉ đọc](../../../Backend/scripts/verify-history-users.py).

Bộ bằng chứng phần cứng ngày 21/10 vẫn giữ nguyên. Hai tài khoản mới chưa được dùng gửi lệnh phần cứng trong phiên này; không xem các history cũ là thao tác của chúng.

Các lần kiểm tra đa tài khoản là kết quả đã lưu của lượt triển khai. Lượt đồng bộ resource sau đó chỉ đọc lại OpenAPI công khai để có schema mới, không chạy lại lệnh LED, không đổi database hoặc runtime. Xem [chỉ mục viết báo cáo](../../Report/RESOURCE_INDEX.md) để chọn đúng tài liệu. SHA256SUMS.txt của thư mục này quản lý bộ cập nhật riêng, không thay manifest gốc 21/10.
