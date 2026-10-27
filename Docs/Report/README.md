# Bản thảo báo cáo BTL — lần 1

**Bản Word ngắn gọn đã xuất:** [Báo cáo BTL](BAO_CAO_BTL_IOT_HOANG_QUOC_ANH.docx), 23 trang gồm 16 trang nội dung chính, đúng bốn chương; đã kiểm tra bố cục và mục lục. Còn chèn ảnh mạch và Serial tại mục 3.2. Khi sửa trực tiếp Word, không chạy lại builder trong tmp vì sẽ ghi đè bản sửa.

**Chốt sau rà soát phần cứng ngày 27/10:** dùng [bộ kiểm tra cuối](../Evidence/2026-10-27-final-review/README.md) và [danh mục ảnh mới](../Evidence/2026-10-27-final-review/IMAGE_CATALOG.md). Có 522 reading khớp SQL, tám xác nhận LED thật (617–622, 627–628), bốn timeout chủ động (623–626), hàng Processing thật, ba tác giả và ảnh History/Swagger đủ khung. ESP32 đã cắm lại, Dashboard tự Online. Các đoạn/bảng ghi rõ phiên 21/10 vẫn là số liệu lịch sử, không cộng chung thành một phiên đo.

**Đề tài: Hệ thống IoT giám sát môi trường và điều khiển thiết bị**  
Ngày chốt nội dung lần 1: 21/10/2026. Cập nhật nguồn viết báo cáo: **27/10/2026**, sau thay đổi đa tài khoản và cột Người thực hiện.

## Đọc theo thứ tự

1. [Chương 1 — Giới thiệu](01_GIOI_THIEU.md)
2. [Chương 2 — Phân tích](02_PHAN_TICH.md)
3. [Chương 3 — Thiết kế](03_THIET_KE.md)
4. [Chương 4 — Kết luận](04_KET_LUAN.md)

Tài liệu hỗ trợ, không phải chương thứ năm:

- [Chỉ mục resource hiện tại và cách chọn ảnh/API](RESOURCE_INDEX.md) — đọc trước khi viết tiếp.
- [Kết quả rà soát 27 ảnh](IMAGE_REVIEW.md) — có ảnh History desktop mới, xem mục cập nhật cuối trong tài liệu.
- [Phụ lục từ điển dữ liệu](PHU_LUC_DU_LIEU.md).
- [Việc còn lại và cách tiếp tục phiên sau](NEXT_SESSION.md).
- [Đề cương chi tiết đã chốt](../BTL_REPORT_PLAN.md).
- [Chỉ mục chung các phiên minh chứng](../Evidence/README.md).
- [Phần cứng ngày 21/10](../Evidence/2026-10-21/README.md), [danh mục ảnh gốc](../Evidence/2026-10-21/IMAGE_CATALOG.md).
- [Đa tài khoản ngày 27/10](../Evidence/2026-10-27/README.md), [OpenAPI hiện tại](../Evidence/2026-10-27/data/openapi-no-examples.json).

## Trạng thái bản thảo

Đã có nội dung bốn chương, bảng yêu cầu, sơ đồ kiến trúc, ERD, sequence theo chức năng, API và kết quả đo thực tế. Trong Chương 3, từng chức năng được trình bày theo thứ tự **giao diện → luồng xử lý → API/message → dữ liệu và triển khai → kiểm tra**. Điều khiển LED nằm cùng Dashboard về giao diện, được tách mục để giải thích luồng xác nhận.

Ảnh liên kết trực tiếp tới bộ minh chứng thật; không sao chép ảnh của báo cáo mẫu. Mã F trong tên ảnh là mã lưu trữ, không phải số Hình cuối cùng. Các sơ đồ Mermaid là bản nguồn cần xuất ảnh và kiểm tra bố cục khi đưa vào Word. Người viết tự định dạng Word theo TH1; bản này chưa có bìa, mục lục tự động hoặc đánh số trang.

Các nhãn **[CẦN BỔ SUNG]** và **[CẦN XÁC NHẬN]** là ghi chú biên tập, phải xử lý trước khi nộp. Các phép thử chưa thực hiện vẫn được ghi rõ, không tự chuyển thành kết quả đạt.

Ảnh History hẹp và Swagger dài trước đây đã có ảnh mới thay thế ở lượt kiểm tra cuối. Ảnh cũ giữ nguyên làm nguồn; Hình 3.22 và 3.26 dùng khung hình mới, Processing và màu thông báo cũng có ảnh thật.

### Nội dung đã đồng bộ ngày 27/10

- Ba tài khoản: user123, user124, user125; cùng chức năng, chưa có phân quyền hoặc đăng ký.
- History có sáu cột: ID → Thiết bị → Người thực hiện → Lệnh → Trạng thái → Thời gian.
- `HistoryRow.username` lấy từ User của từng history qua userId; người gửi được xác định bằng JWT. Không nhận username/userId trong body điều khiển.
- Schema vẫn năm bảng/40 cột, quan hệ 1–N giữ nguyên; không cần thêm cột SQL để hiển thị username.
- Seed tạo hai tài khoản còn thiếu, không ghi đè tài khoản/hồ sơ/mật khẩu cũ; bỏ ràng buộc chỉ có một User.
- Thông báo lệnh ON màu xanh, OFF màu đỏ; thông báo lỗi vẫn đỏ. Các ảnh chờ ngày 21/10 chỉ chứng minh trạng thái lúc thu, không minh họa màu mới.
- Có ảnh History mới, kết quả 4 test Backend + 12 test Frontend, kiểm tra đăng nhập/đọc API thật và snapshot OpenAPI mới. Đợt đầu chỉ kiểm tra phần mềm; lượt cuối đã có sáu lệnh ESP32 thật dưới ba tài khoản, xem bộ kiểm tra cuối.

## Thông tin phần đầu dự kiến

Kế thừa từ TH1: Hoàng Quốc Anh — B23DCCN022 — nhóm 10 — giảng viên TS. Nguyễn Quốc Uy. **[CẦN XÁC NHẬN]** lại thông tin khi làm bìa; tên trường/khoa và tên môn điền theo mẫu đang sử dụng.

Danh mục từ viết tắt đề xuất: IoT, MQTT, REST, JWT, STOMP, GPIO, ADC, ERD, UTC. Danh mục hình và bảng tạo sau khi chèn vào Word.

## Nguồn và cách sử dụng

Nội dung dựa trên TH1, mã nguồn hiện tại, cấu hình triển khai, quan sát phần cứng ngày 21/10/2026 và kiểm tra phần mềm ngày 27/10/2026. Tài liệu mẫu các năm trước chỉ hỗ trợ cách trình bày. Đối chiếu kỹ thuật chính: [contract Backend](../../Backend/CONTRACT.md), [schema SQL](../../Backend/src/main/resources/schema.sql), [firmware trên máy](../../Hardware/ESP32/IoTMonitor/IoTMonitor.ino), cùng các liên kết mã nguồn trong Chương 3. Khi nguồn cũ khác bản hiện tại, dùng RESOURCE_INDEX để chọn đúng phiên; không sửa số liệu thực nghiệm cũ.

Không đưa file môi trường, `config.h`, mật khẩu, JWT thực hoặc password hash vào báo cáo. Nếu bổ sung tài liệu tham khảo bên ngoài, phải đọc và kiểm tra trực tiếp tài liệu chính thức trước khi trích dẫn; bản thảo này chưa tự gán nguồn tham khảo bên ngoài.
