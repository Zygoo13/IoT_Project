# Rà ảnh cập nhật cuối — 27/10/2026

**Chốt sau rà soát phần cứng ngày 27/10:** dùng [bộ kiểm tra cuối](../Evidence/2026-10-27-final-review/README.md) và [danh mục ảnh mới](../Evidence/2026-10-27-final-review/IMAGE_CATALOG.md). Có 522 reading khớp SQL, tám xác nhận LED thật (617–622, 627–628), bốn timeout chủ động (623–626), hàng Processing thật, ba tác giả và ảnh History/Swagger đủ khung. ESP32 đã cắm lại, Dashboard tự Online. Các đoạn/bảng ghi rõ phiên 21/10 vẫn là số liệu lịch sử, không cộng chung thành một phiên đo.

Ưu tiên [IMAGE_CATALOG mới](../Evidence/2026-10-27-final-review/IMAGE_CATALOG.md). Đã nhìn trực tiếp Dashboard, Data Sensor, History, Processing, pending/timeout và Swagger. Ảnh ba tác giả10 hàng cắt phân trang là ảnh phụ. Profile phần trên và phần nút dùng thành cặp. Đánh giá27 ảnh trước đây bên dưới giữ để truy nguyên nguồn, các ghi chú “chưa chụp lại” của đợt đó đã được giải quyết trong bộ mới.

---

# Rà soát ảnh báo cáo — 27/10/2026

Đã mở ảnh tổng hợp của toàn bộ **27 PNG**, xem bản gốc các ảnh cần đọc chi tiết, kiểm tra khả năng giải mã, kích thước và hash trùng. Có **26 nội dung ảnh khác nhau**, không có PNG hỏng. Kiểm tra nội dung ảnh không thay cho đối chiếu MQTT/SQL đã lưu.

## 1. Những điểm cần sửa trong cách chọn ảnh

1. **History mới chưa đạt làm ảnh chính:** `history-username.png` chỉ 688×853, mất tiêu đề trang/phần trên và cắt cột Thời gian ở bên phải. Có thấy cột Người thực hiện nhưng chưa đủ minh họa cả màn hình/sáu cột. Không tiếp tục coi ảnh này là Hình 3.22 hoàn chỉnh.
2. **Hai ảnh LED trùng hoàn toàn:** F13c và F13d có cùng SHA256, cùng cảnh cả hai LED ON. Chỉ chọn F13d nếu cần cảnh này; không dùng hai ảnh như hai kết quả độc lập.
3. **Ảnh F13i cắt phần đầu card LED:** thông báo timeout đọc được nhưng mất tiêu đề/phần trên. Dùng F15 toàn Dashboard để minh họa lỗi có ngữ cảnh, F13i chỉ làm ảnh phụ.
4. **Ảnh Profile edit F20b sát mép dưới:** bản gốc còn đủ phần đầu và tiêu đề, nhưng nút Hủy/Lưu và khung form chạm mép ảnh. Không kết luận ảnh bị mất đầu từ bản thu nhỏ. Nên chụp lại toàn form nếu đưa hình sửa hồ sơ vào bài; ảnh Profile view F20 vẫn dùng được.
5. **Ảnh Swagger quá dài cho một hình chính:** 1424×2151, phần danh sách schema chiếm hơn nửa ảnh. Đọc được ở bản gốc nhưng khi ép vào một trang Word chữ sẽ nhỏ. Dùng làm nguồn/phụ lục; ảnh chính nên chụp riêng tổng quan endpoint và riêng schema HistoryRow hiện tại.
6. **Ảnh History 21/10 chỉ có năm cột:** đúng sản phẩm tại thời điểm thử, không phải bố cục hiện tại. Ảnh Processing là bảng rỗng, không có hàng đang chờ.
7. **Ảnh pending LED 21/10 dùng màu cam:** đúng ảnh gốc, chưa phản ánh màu ON xanh/OFF đỏ của bản mới. Không dùng để chứng minh màu sau cập nhật.

Không thấy mật khẩu, JWT hoặc passwordHash trong các ảnh. Ảnh Profile có ảnh chân dung, email và mã sinh viên của chủ tài khoản; chỉ dùng trong báo cáo của dự án theo nhu cầu. Không công bố kèm file môi trường hoặc config.h.

## 2. Kiểm tra từng ảnh

Thư mục gốc ảnh 21/10: [images](../Evidence/2026-10-21/images/). Trạng thái “dùng được” nghĩa là nội dung phù hợp mục nêu trong bảng, không khẳng định luôn phản ánh UI mới nhất.

| # | Ảnh | Kích thước | Đánh giá và cách dùng |
| --- | --- | --- | --- |
| 01 | [F08 Login](../Evidence/2026-10-21/images/F08-login-empty-no-credentials.png) | 1440×1000 | Dùng được: cả form, hai ô trống, không lộ thông tin xác thực |
| 02 | [F10 Dashboard both off](../Evidence/2026-10-21/images/F10-dashboard-online-both-off.png) | 1440×1000 | Dùng được: banner Online, ba card, chart và hai LED OFF; là phiên 21/10 |
| 03 | [F10b Dashboard both on](../Evidence/2026-10-21/images/F10b-dashboard-online-both-on.png) | 1440×1000 | Ảnh phụ: đủ màn hình, hai LED ON; phần lớn bố cục trùng F10e |
| 04 | [F10c Tooltip](../Evidence/2026-10-21/images/F10c-chart-tooltip-real-readings.png) | 1113×384 | Dùng được: giá trị/đơn vị/thời gian rõ; có viền focus xanh của UI, không phải viền được thêm vào ảnh |
| 05 | [F10d Light response](../Evidence/2026-10-21/images/F10d-dashboard-light-response.png) | 1440×1000 | Dùng được: biến đổi thật tại thời điểm chụp; không chỉnh các điểm/thang Y để làm mượt ảnh |
| 06 | [F10e Dashboard sau đổi sáng](../Evidence/2026-10-21/images/F10e-dashboard-after-light-change.png) | 1440×1000 | Ưu tiên làm ảnh Dashboard chính: đủ phần và biến đổi ánh sáng; hai LED ON |
| 07 | [F10f Offline](../Evidence/2026-10-21/images/F10f-dashboard-hardware-offline.png) | 1440×1000 | Dùng được: banner không nhận dữ liệu, số đo cuối, hai LED OFF; không diễn giải là dữ liệu đang tiếp tục tới |
| 08 | [F10g Chart](../Evidence/2026-10-21/images/F10g-chart-light-change.png) | 1113×384 | Dùng được: hình riêng biểu đồ có tiêu đề, đơn vị, mốc giờ và chú giải |
| 09 | [F13a Before](../Evidence/2026-10-21/images/F13a-led-before.png) | 1113×158 | Dùng được: cả hai card OFF trước thử |
| 10 | [F13b LED1 ON](../Evidence/2026-10-21/images/F13b-led1-on-led2-off.png) | 1113×158 | Dùng được: LED1 ON/LED2 OFF, không có trạng thái đang chờ |
| 11 | [F13c Both ON](../Evidence/2026-10-21/images/F13c-led2-confirmed-on.png) | 1113×158 | Không chọn thêm: trùng byte với F13d; không gọi là pending hoặc kết quả khác |
| 12 | [F13d Both ON](../Evidence/2026-10-21/images/F13d-led-both-on.png) | 1113×158 | Chọn thay F13c khi cần hai LED ON; chỉ minh chứng trạng thái UI/xác nhận phần mềm |
| 13 | [F13e LED1 OFF, LED2 ON](../Evidence/2026-10-21/images/F13e-led1-confirmed-off-led2-on.png) | 1113×158 | Dùng được làm ảnh phụ sau xác nhận; không có spinner pending |
| 14 | [F13f Both OFF confirmed](../Evidence/2026-10-21/images/F13f-led-both-off-confirmed.png) | 1113×158 | Dùng được: hai LED OFF sau chuỗi thử, cần F24 để chứng minh xác nhận |
| 15 | [F13g LED1 đang chờ](../Evidence/2026-10-21/images/F13g-offline-command-progress.png) | 1113×184 | Ảnh phụ: LED1 spinner/chờ bật; chưa có chữ mất kết nối nên riêng crop này không chứng minh Hardware đã chuyển Offline |
| 16 | [F13h LED2 pending](../Evidence/2026-10-21/images/F13h-offline-led2-pending.png) | 1113×204 | Dùng được cho trạng thái chờ lịch sử: rõ tên hai LED, spinner và mất kết nối; màu thông báo cũ |
| 17 | [F13i Timeout crop](../Evidence/2026-10-21/images/F13i-led2-timeout-message.png) | 1113×204 | Ảnh phụ vì cắt phần đầu card; thông báo đọc được; ưu tiên F15 làm hình chính |
| 18 | [F15 Offline/timeout](../Evidence/2026-10-21/images/F15-dashboard-offline-command-timeout.png) | 1440×1000 | Ưu tiên: đủ Dashboard, banner Offline, LED2 báo không phản hồi; phù hợp thay crop F13i |
| 19 | [F16 Sensor Data](../Evidence/2026-10-21/images/F16-sensor-data-real.png) | 1440×1000 | Dùng được: đủ tiêu đề, truy vấn, bốn cột và phân trang |
| 20 | [F16b Tìm giá trị](../Evidence/2026-10-21/images/F16b-sensor-search-temperature-value.png) | 1440×1000 | Dùng được: Nhiệt độ, 32.0 °C, 38 kết quả đúng caption |
| 21 | [F16c Tìm ngày](../Evidence/2026-10-21/images/F16c-sensor-search-date.png) | 1440×1000 | Dùng được: ngày 21/10, 8090 kết quả toàn bộ query; năm hàng đầu có 9282–9284. Không nhầm tổng 8090 với 420 reading của tập đối chiếu |
| 22 | [F18 History cũ](../Evidence/2026-10-21/images/F18-history-four-confirmations-and-timeout.png) | 1440×1000 | Chỉ minh chứng phiên 21/10: ID 568..564, năm cột; số 265 là tổng query, không phải số testcase. TẮT không tự chứng minh CONFIRMED |
| 23 | [F18a Processing rỗng](../Evidence/2026-10-21/images/F18a-history-processing-empty-after-timeout.png) | 1440×1000 | Chỉ minh họa kết quả rỗng sau timeout; không chứng minh một hàng đang Processing và không phải UI sáu cột |
| 24 | [F20 Profile view](../Evidence/2026-10-21/images/F20-profile-view.png) | 1440×1000 | Dùng được: đủ hồ sơ và nút sửa; có thông tin cá nhân của chủ tài khoản |
| 25 | [F20b Profile edit](../Evidence/2026-10-21/images/F20b-profile-edit.png) | 1440×1000 | Ảnh phụ, nên chụp lại toàn form; mép dưới sát nút, không chứng minh PUT đã thành công |
| 26 | [F22 Swagger](../Evidence/2026-10-21/images/F22-swagger-overview-no-token.png) | 1424×2151 | Nguồn/phụ lục: thấy bảy thao tác, không token; không phù hợp thu nhỏ toàn ảnh vào một hình Word và không chứng minh schema username mới |
| 27 | [History username mới](../Evidence/2026-10-27/images/history-username.png) | 688×853 | CẦN CHỤP LẠI: ảnh hẹp, mất tiêu đề và cắt Thời gian; chỉ chứng minh đã thấy cột Người thực hiện, không dùng làm ảnh bố cục hoàn chỉnh |

## 3. Danh sách hình chính nên dùng

- Login: F08.
- Dashboard: F10e; chart chi tiết F10g hoặc F10c cho tooltip.
- LED: F13b và F13d hoặc F13f; dùng ít ảnh, tránh trùng.
- Chờ/timeout: F13h cho chờ, F15 cho toàn cảnh lỗi; caption ghi phiên 21/10.
- Sensor Data: F16, F16b/F16c tùy nội dung cần giải thích.
- History hiện tại: để chỗ chờ Hình 3.22; chưa có ảnh desktop đạt. F18 cũ chỉ làm minh chứng test trước cập nhật.
- Hồ sơ: F20; chỉ thêm F20b nếu cần giải thích form và chấp nhận ghi chú ảnh phụ.
- Swagger: dùng nguồn F22 để tra cứu, chuẩn bị ảnh tổng quan ngắn và ảnh schema HistoryRow riêng trước khi chốt hình Word.

## 4. Việc chưa hoàn tất

Thử chụp lại bằng cửa sổ Edge đã bị công cụ Computer Use dừng trước khi thao tác vì không xác định được URL đủ tin cậy để áp dụng kiểm soát truy cập. Không có ảnh desktop mới được tạo. Không đổi viewport bằng thủ thuật, không ghép ảnh hoặc sửa số liệu để lấp cột bị cắt.

Khi chụp được: mở History ở cửa sổ desktop, về đầu trang, giữ đủ tiêu đề, bộ lọc, cả sáu cột gồm ngày giờ đầy đủ và phân trang. Chỉ đọc; không cần gửi lệnh LED hoặc tạo history cho tài khoản mới. Chụp form Profile sao cho đủ hai nút và mép cuối; Swagger tổng quan chỉ cần nhóm endpoint, schema username chụp riêng. Ảnh phần cứng/Serial vẫn chưa có trong thư mục hardware-photos ngoài README hướng dẫn.

Không xóa/sửa 27 ảnh đã có. Các ảnh nguồn vẫn giữ nguyên; thay đổi lần này là đánh giá và cách dùng trong báo cáo.
