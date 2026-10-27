"""Update report references to the separately preserved final-review evidence."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
R=ROOT/'Docs/Report'
def read(p): return p.read_text(encoding='utf-8-sig')
def write(p,s): p.write_text(s,encoding='utf-8')
base='../Evidence/2026-10-27-final-review'
note=f'''**Chốt sau rà soát phần cứng ngày 27/10:** dùng [bộ kiểm tra cuối]({base}/README.md) và [danh mục ảnh mới]({base}/IMAGE_CATALOG.md). Có 522 reading khớp SQL, tám xác nhận LED thật (617–622, 627–628), bốn timeout chủ động (623–626), hàng Processing thật, ba tác giả và ảnh History/Swagger đủ khung. ESP32 đã cắm lại, Dashboard tự Online. Các đoạn/bảng ghi rõ phiên 21/10 vẫn là số liệu lịch sử, không cộng chung thành một phiên đo.

'''
for name in ['README.md','RESOURCE_INDEX.md']:
    p=R/name;s=read(p);a,b=s.split('\n',1);s=a+'\n\n'+note+b.lstrip('\n')
    s=s.replace('History mới cần chụp lại, chưa chốt ảnh Word.','có ảnh History desktop mới, xem mục cập nhật cuối trong tài liệu.')
    s=s.replace('**Sau rà ảnh:** đọc [IMAGE_REVIEW](IMAGE_REVIEW.md). 27 PNG không hỏng nhưng có một cặp trùng; History mới chưa đạt làm ảnh chính vì cắt cột Thời gian. Chương 3 đã để chỗ chờ Hình 3.22, dùng F15 thay crop timeout và chưa nhúng toàn ảnh Swagger quá dài vào bài.',
        '**Sau rà ảnh:** [IMAGE_REVIEW](IMAGE_REVIEW.md) giữ đánh giá ảnh cũ và bổ sung danh mục ảnh mới. Hình 3.22 và 3.26 đã thay bằng ảnh desktop/Swagger của lượt kiểm tra cuối.')
    s=s.replace('Rà ảnh cho thấy History mới bị cắt cột Thời gian; bản thảo đã đưa Hình 3.22 về trạng thái cần chụp lại. Crop timeout được thay bằng toàn cảnh F15. Ảnh Swagger dài chỉ giữ làm nguồn, chưa dùng nguyên ảnh như một hình Word. Hai ảnh LED trùng chỉ chọn một; nguồn gốc không bị sửa/xóa.',
        'Ảnh History hẹp và Swagger dài trước đây đã có ảnh mới thay thế ở lượt kiểm tra cuối. Ảnh cũ giữ nguyên làm nguồn; Hình 3.22 và 3.26 dùng khung hình mới, Processing và màu thông báo cũng có ảnh thật.')
    s=s.replace('Chưa có phép thử LED thật bằng hai tài khoản mới.','Đợt đầu chỉ kiểm tra phần mềm; lượt cuối đã có sáu lệnh ESP32 thật dưới ba tài khoản, xem bộ kiểm tra cuối.')
    s=s.replace('Ba login/GET Profile đã kiểm tra; chưa thử PUT thật hoặc toàn bộ nhánh JWT','Lượt cuối đã thử PUT/khôi phục user125, JWT thiếu/sai/hết hạn; xem api-review.json')
    s=s.replace('CẦN CHỤP LẠI; [ảnh hẹp đã có](../Evidence/2026-10-27/images/history-username.png) chỉ để đối chiếu | Cắt cột Thời gian và mất đầu trang; chưa dùng làm Hình 3.22 hoặc thay ảnh cũ như một màn hình hoàn chỉnh',
        f'[History desktop]({base}/images/history-six-columns-desktop.png) | Đủ tiêu đề/bộ lọc/sáu cột/phân trang; dùng Hình 3.22')
    s=s.replace('Ảnh chụp ngày 21/10 không bị sửa hoặc đổi tên để giả làm ảnh mới. Bộ gốc và SHA256 giữ nguyên. Muốn minh họa chính xác màu thông báo ON/OFF mới hoặc history do hai tài khoản mới gửi, cần thu riêng trong lượt kiểm tra phù hợp; không chỉnh ảnh/DB để tạo kết quả.',
        'Ảnh ngày 21/10 giữ nguyên SHA256. Lượt kiểm tra cuối đã thu màu thông báo mới và history do cả ba tài khoản gửi thật; xem bộ riêng, không thay đổi ảnh/DB cũ để tạo kết quả.')
    s=s.replace('Chụp lại History desktop là việc bắt buộc trước khi chốt ảnh UI. Lần thử dùng Edge bị Computer Use dừng vì chưa xác định URL đủ tin cậy, chưa có ảnh desktop mới. Các bước và khung hình cần chụp ghi trong IMAGE_REVIEW; không tự đánh dấu đã thay ảnh.',
        'History desktop, Swagger tổng quan và schema username đã chụp lại bằng trình duyệt trong app. Ảnh mạch/Serial, xác nhận firmware đang nạp và định dạng Word vẫn cần người viết bổ sung.')
    write(p,s)
write(R/'NEXT_SESSION.md', f'''# Tiếp tục viết báo cáo — chốt 27/10/2026

Đọc [RESOURCE_INDEX](RESOURCE_INDEX.md), [báo cáo rà soát cuối]({base}/README.md) và [danh mục ảnh mới]({base}/IMAGE_CATALOG.md) trước khi viết.

## Đã hoàn tất

- Có bản thảo bốn chương; từng chức năng đi UI → sequence → API/message → dữ liệu/triển khai → kiểm tra. Người dùng tự định dạng Word theo TH1.
- Lượt cuối với ESP32: 522 MQTT sensor readings, 522 STOMP, 174/Sensor, 522 SQL khớp; ánh sáng biến đổi thật. Không gộp số này với 420 reading của 21/10 hoặc các đoạn quan sát khác.
- 617–622: sáu xác nhận LED thật qua REST dưới ba JWT; 627/628: hai xác nhận Web sau cắm lại. 623–626: bốn timeout khi rút. Có ảnh hàng Processing625, pending ON xanh/OFF đỏ không nền, timeout và tự Online sau cắm lại.
- 142 mục kiểm tra API PASS, 1 OBSERVED, 0 FAIL; PUT tạm user125 được khôi phục tám trường, updatedAt có đổi. Có thử token thiếu/sai/hết hạn và đăng nhập lại UI.
- 12 test Frontend, 4 Backend H2/MQTT mock đạt; Vite/Docker app image build đạt. Không restart container hoặc thay schema/broker/firmware/volume trong lượt chốt.
- History sáu cột và Swagger đã có ảnh mới đủ khung. 73 file bộ21/10 đối chiếu hash đúng; giữ bộ cũ nguyên vẹn.
- Kết thúc ESP32 đã cắm lại, Dashboard Online, hai Device OFF; không cần cắm lại chỉ để viết những mục đã có minh chứng.

## Việc còn lại cho báo cáo

1. Người dùng bổ sung ảnh toàn bộ mạch, cận chân nối và Serial, xác nhận board/module/nguồn/điện trở/GPIO và firmware thực đang nạp. Sketch trên máy không đủ để kết luận bản trên ESP32. Không chụp secrets/config.h.
2. Chọn hình theo danh mục mới. Hình3.22 dùng History desktop; ảnh10hàng ba tác giả chỉ là ảnh phụ vì cắt phân trang. Profile sửa có cặp trên/dưới, không gọi một ảnh là toàn form.
3. Đọc/chỉnh văn phong, thông tin bìa từ TH1, các nhãn CẦN BỔ SUNG/CẦN XÁC NHẬN. Xuất Mermaid rồi kiểm tra bố cục, thêm tài liệu tham khảo chính thức khi sử dụng.
4. Đưa vào Word, caption/mục lục tự động, kiểm tra ngắt trang. Giữ đúng bốn chương.

## Không suy diễn quá bằng chứng

- 15 reading mỗi cảm biến theo thứ tự, không phải15chu kỳ đồng bộ; timestamp do Backend gán, tooltip giữ giờ từng sensor. Lux ước lượng, chưa hiệu chuẩn.
- ACK là phần mềm/GPIO, chưa có phản hồi vật lý độc lập. Người dùng xác nhận thao tác ánh sáng, chưa xác nhận riêng từng LED bằng ảnh/lời trong lượt này.
- Broker/Wi-Fi lỗi, ACK muộn/lặp/đảo thứ tự thật, tải lớn/chạy dài hạn chưa thử; không tự ghi PASS. Không cần phá runtime để bổ sung các mục này chỉ phục vụ viết bài.
- Các chỉ số ms cùng observer không phải thời gian phát sáng. Khoảng ngắt176giây trong session03 là lần rút ESP32 chủ động.
- Có thể viết báo cáo theo phạm vi hiện có; không tuyên bố đã kiểm chứng mọi tình huống hoặc an toàn vận hành sản xuất.
''')
# Preserve prior visual review as history; put the current choice first.
p=R/'IMAGE_REVIEW.md';s=read(p)
write(p, '# Rà ảnh cập nhật cuối — 27/10/2026\n\n'+note+f'Ưu tiên [IMAGE_CATALOG mới]({base}/IMAGE_CATALOG.md). Đã nhìn trực tiếp Dashboard, Data Sensor, History, Processing, pending/timeout và Swagger. Ảnh ba tác giả10hàng cắt phân trang là ảnh phụ. Profile phần trên và phần nút dùng thành cặp. Đánh giá27ảnh trước đây bên dưới giữ để truy nguyên nguồn, các ghi chú “chưa chụp lại” của đợt đó đã được giải quyết trong bộ mới.\n\n---\n\n'+s)
p=R/'03_THIET_KE.md';s=read(p)
lines=s.splitlines()
for i,line in enumerate(lines):
    if line.startswith('**[CẦN CHỤP LẠI — Hình 3.22]'):
        lines[i]=f'![Hình 3.22. Lịch sử điều khiển sáu cột, có Người thực hiện và thời gian đầy đủ, ngày 27/10/2026]({base}/images/history-six-columns-desktop.png)'
    if line.startswith('**[CẦN CHỌN KHUNG HÌNH — Hình 3.26]'):
        lines[i]=f'![Hình 3.26. Swagger/OpenAPI với bảy thao tác REST, ngày 27/10/2026]({base}/images/swagger-seven-endpoints.png)\n\nSchema username xem [ảnh HistoryRow]({base}/images/swagger-historyrow-username.png).'
    if line.startswith('Ngày 27/10, test Backend cô lập xác nhận history'):
        lines[i]=f'Ngày 27/10, test Backend cô lập xác nhận tác giả từ ba JWT, phân trang/lọc, body giả actor, seed lặp và bảng rỗng. Lượt kiểm tra cuối đã gửi sáu lệnh thật617–622 dưới ba tài khoản tới ESP32, tất cả có MQTT status/STOMP/SQL/REST xác nhận đúng username. Hai lệnh Web627/628 sau cắm lại cũng xác nhận. Xem [kết quả từng request]({base}/data/planned-command-results.json); không gọi test H2 là test phần cứng.'
    if line.startswith('Phiên thu minh chứng ngày 21/10 đã GET hồ sơ'):
        lines[i]=f'Phiên21/10 chỉ GET/mở sửa/Hủy. Lượt cuối27/10 đã PUT tạm user125, GET xác nhận, thử email trùng409, avatarHTTP400 và body username400; cuối cùng khôi phục tám trường và xác nhận user123 không đổi. updatedAt của user125 có đổi do PUT. Xem [api-review]({base}/data/api-review.json).'
    if line.startswith('Trong môi trường chạy, giao diện tài liệu tại'):
        lines[i]=line.replace('Ảnh Swagger tổng quan phía trên được chụp ngày 21/10; không dùng ảnh tổng quan để chứng minh schema username mới.','Ảnh Swagger phía trên thu ngày27/10 trong lượt cuối; ảnh schema username được lưu riêng, không dùng tổng quan endpoint để chứng minh trường schema.')
    if line.startswith('| History Processing |'):
        lines[i]=f'| History Processing | Chụp request625 khi còn PENDING | [Ảnh thật]({base}/images/history-processing-pending-row.png), sau đó timeout |'
    if line.startswith('| Profile PUT |'):
        lines[i]='| Profile PUT | PUT user125, xác nhận lưu và khôi phục tám trường; chặn dữ liệu sai/xung đột | Lượt cuối27/10; không coi updatedAt bất biến |'
s='\n'.join(lines)+'\n'
s+=f'''\n### Bổ sung rà soát phần cứng cuối ngày27/10\n\n522reading trong session03 khớp MQTT/STOMP/SQL, 174mỗi Sensor. Tám request617–622/627–628 có xác nhận; bốn request623–626 không ACK và có timeout. Dashboard tự Offline/Online khi rút/cắm, Web điều khiển lại thành công. Có142mục API PASS, 0FAIL, 1OBSERVED và kiểm tra giao diện tìm giá trị/thời gian, chú giải, tooltip, reload. [Bộ minh chứng cuối]({base}/README.md) phân biệt các kết quả mới với bảng phiên21/10 phía trên; không cộng thành một phiên đo.\n'''
write(p,s)
p=R/'04_KET_LUAN.md';s=read(p)
s=s.replace('Chưa kiểm tra mọi nhánh JWT hoặc PUT hồ sơ thật','Lượt cuối đã thử PUT/khôi phục user125, JWT thiếu/sai/hết hạn; không khẳng định bao phủ mọi nhánh')
marker='## 4.2. Hạn chế'
s=s.replace(marker,f'''Lượt rà soát cuối ngày27/10 bổ sung522reading MQTT/STOMP khớp SQL, tám lệnh617–622/627–628 xác nhận và bốn timeout623–626. Ba tài khoản có lệnh thật được ghi đúng người thực hiện. Có ảnh Processing, thông báo ON xanh/OFF đỏ không nền và Dashboard tự Online sau cắm lại;142mục API PASS, không có FAIL. PUT tạm user125 đã khôi phục các trường, JWT thiếu/sai/hết hạn bị chặn. Xem [báo cáo chốt]({base}/README.md). Các số liệu21/10 ở bảng trên giữ đúng nguồn lịch sử, không gộp chung với lượt cuối.\n\n'''+marker)
s=s.replace('Trong quan sát vẫn có khoảng trống/burst MQTT tới khoảng 10,25 giây, chưa xác định được nguyên nhân chính xác tại ESP32, Wi-Fi hay broker.','Phiên21/10 từng ghi nhận khoảng trống/burst MQTT tới10,25giây, chưa xác định nguyên nhân. Khoảng ngắt lớn của session03 ngày27/10 tương ứng thao tác rút ESP32 chủ động, không phải bằng chứng độ trễ mạng tự phát.')
write(p,s)
p=ROOT/'Docs/Evidence/README.md';s=read(p)
s=s.replace('## Nguồn hiện tại', 'Ưu tiên [bộ rà soát cuối27/10](2026-10-27-final-review/README.md): telemetry/LED thật dưới ba tài khoản, Processing/timeout, ảnh History desktop và Swagger mới. Các bảng/nhận định bên dưới mô tả hai bộ trước đó; bộ mới quản lý riêng, không sửa bằng chứng cũ.\n\n## Nguồn hiện tại')
s=s.replace('Trong phiên 27/10 không gửi lệnh LED thật.','Trong bộ cập nhật phần mềm27/10 ban đầu không gửi lệnh LED thật; bộ final-review sau đó đã kiểm tra ESP32 thật và lưu riêng.')
write(p,s)
print('Updated report resources and chapters; old evidence untouched.')
