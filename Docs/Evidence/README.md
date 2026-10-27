# Chỉ mục minh chứng báo cáo

Ưu tiên [bộ rà soát cuối27/10](2026-10-27-final-review/README.md): telemetry/LED thật dưới ba tài khoản, Processing/timeout, ảnh History desktop và Swagger mới. Các bảng/nhận định bên dưới mô tả hai bộ trước đó; bộ mới quản lý riêng, không sửa bằng chứng cũ.

## Nguồn hiện tại

| Phiên | Mục đích | Dùng cho báo cáo |
| --- | --- | --- |
| [21/10/2026](2026-10-21/README.md) | Đo với ESP32, thu cảm biến, ON/OFF, Offline/timeout và UI tại thời điểm đó | Số liệu phần cứng, F23/F24, Dashboard/Data Sensor/Profile, kiến trúc và schema |
| [27/10/2026](2026-10-27/README.md) | Thêm hai tài khoản, cột Người thực hiện và kiểm tra phần mềm | UI History mới, username trong API, test đa tài khoản và OpenAPI hiện tại |

Đọc [RESOURCE_INDEX](../Report/RESOURCE_INDEX.md) để ghép nguồn vào từng mục báo cáo. Không dùng một ảnh cũ để khẳng định bố cục/schema mới; không sửa tập bằng chứng gốc để nâng kết quả thử nghiệm.

## Ảnh/API cần ưu tiên

- History hiện tại: [ảnh có Người thực hiện](2026-10-27/images/history-username.png) **chưa đạt làm ảnh chính** vì cắt cột Thời gian; [danh mục ảnh mới](2026-10-27/IMAGE_CATALOG.md) và [rà soát ảnh](../Report/IMAGE_REVIEW.md) chỉ rõ cần chụp lại desktop.
- API hiện tại: [OpenAPI 27/10](2026-10-27/data/openapi-no-examples.json), có HistoryRow.username, vẫn bảy thao tác REST.
- Dashboard/cảm biến/LED thật: [danh mục ảnh 21/10](2026-10-21/IMAGE_CATALOG.md), [telemetry](2026-10-21/F23_TELEMETRY.md), [điều khiển](2026-10-21/F24_LED_CONTROL.md).
- Kết quả đa tài khoản: [verification.json](2026-10-27/verification.json), chỉ ghi kết quả và username, không có mật khẩu hoặc JWT.

Trong bộ cập nhật phần mềm27/10 ban đầu không gửi lệnh LED thật; bộ final-review sau đó đã kiểm tra ESP32 thật và lưu riêng. Ba tài khoản login được không đồng nghĩa đã thử ON/OFF với ESP32 bằng cả ba. Các ảnh pending cũ chưa thể hiện màu thông báo ON xanh/OFF đỏ sau cập nhật. Bộ 21/10 vẫn giữ nguyên hash gốc; file SHA256 của bộ 27/10 quản lý riêng.
