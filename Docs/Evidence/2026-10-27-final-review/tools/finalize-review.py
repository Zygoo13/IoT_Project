"""Summarize captured evidence without modifying application/database or old evidence."""
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[4]
E = Path(__file__).resolve().parents[1]
R = ROOT / 'Docs/Report'
def read(p): return p.read_text(encoding='utf-8-sig')
def write(p, s): p.write_text(s, encoding='utf-8')
api = json.loads(read(E/'data/api-review.json'))
telemetry = json.loads(read(E/'data/telemetry-comparison.json'))
cases = json.loads(read(E/'data/command-comparison.json'))
planned = [c for c in cases if 617 <= int(c['database']['id']) <= 628]
assert len(planned) == 12
for c in planned:
    i = int(c['database']['id'])
    c['source'] = 'Authenticated REST API audit' if i <= 622 else 'Browser UI audit'
    c['expected'] = 'TIMEOUT' if 623 <= i <= 626 else 'CONFIRMED'
    c['verified'] = bool(c['mqttCommand'] and (
        c['mqttStatus'] and c['stompConfirmation'] and c['database']['confirmedAt'] != 'NULL'
        if c['expected'] == 'CONFIRMED' else
        not c['mqttStatus'] and c['stompTimeout'] and c['database']['confirmedAt'] == 'NULL'))
assert all(c['verified'] for c in planned)
write(E/'data/planned-command-results.json', json.dumps(planned, ensure_ascii=False, indent=2))
old=ROOT/'Docs/Evidence/2026-10-21'
integrity=[]
for line in read(old/'SHA256SUMS.txt').splitlines():
    digest, name=line.split('  ',1)
    p=old/name
    integrity.append({'file':name,'match':p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==digest})
assert all(x['match'] for x in integrity)
write(E/'data/old-evidence-integrity.json',json.dumps(integrity,indent=2))
summary={'date':'2026-10-27','apiPass':sum(x['result']=='PASS' for x in api['tests']),
 'apiFail':sum(x['result']=='FAIL' for x in api['tests']), 'apiObserved':1,
 'frontendTests':{'pass':12,'fail':0},'backendTests':{'pass':4,'fail':0,'environment':'H2 + mocked MQTT'},
 'builds':['Vite PASS','Docker app image build PASS; running services not restarted'],
 'sensorReadings':telemetry['sensorEvents'],'sqlMismatches':len(telemetry['mismatches']),
 'commandsConfirmed':[617,618,619,620,621,622,627,628], 'commandsTimeout':[623,624,625,626],
 'oldEvidenceFilesVerified':len(integrity), 'brokerFaultInjection':'NOT TESTED',
 'lateDuplicateReorderedHardwareAck':'NOT TESTED','physicalLedPhotoConfirmation':'Not collected in this session',
 'finalHardware':'ONLINE; telemetry resumed; LED1 OFF, LED2 OFF'}
write(E/'data/final-review-summary.json',json.dumps(summary,ensure_ascii=False,indent=2))
# Clarify two filenames that previously overstated their content.
renames={'profile-edit-complete.png':'profile-edit-upper.png',
         'dashboard-timeout-final.png':'dashboard-offline-after-navigation.png',
         'history-processing-final.png':'history-processing-empty-after-timeout.png'}
for before,after in renames.items():
    if (E/'images'/before).exists(): (E/'images'/before).rename(E/'images'/after)
index=json.loads(read(E/'images/index.json'))
for row in index: row['file']=renames.get(row['file'],row['file'])
known={row['file'] for row in index}
for p in sorted((E/'images').glob('*.png')):
    if p.name not in known:
        index.append({'file':p.name,'savedAt':datetime.fromtimestamp(p.stat().st_mtime,timezone.utc).isoformat(),
                      'timestampSource':'filesystem save time'})
write(E/'images/index.json',json.dumps(index,ensure_ascii=False,indent=2))
write(E/'README.md', '''# Rà soát cuối trước khi viết báo cáo — 27/10/2026

Kết luận: các luồng chính đã đạt trong tập kiểm tra thực hiện. Có thể dùng bộ này để viết báo cáo BTL; không coi đây là chứng nhận chạy tải lớn hoặc vận hành sản xuất.

## Kết quả chốt

| Hạng mục | Kết quả và bằng chứng |
| --- | --- |
| Phiên phần cứng chính | 18:41:54–18:50:36 ngày 27/10, giờ Việt Nam; [session 03](data/live-session-03/capture-summary.json) |
| Telemetry | 522 MQTT sensor messages, 522 STOMP sensor events, 174 mỗi cảm biến; 522 hàng SQL khớp ID/mã/giá trị/đơn vị/timestamp, 0 sai lệch; [đối chiếu](data/telemetry-comparison.json) |
| Biến đổi ánh sáng | Người dùng xác nhận đã thao tác sáng/tối; LDR quan sát 4,32–96,832 lux trong session 03. Lux ước lượng, chưa hiệu chuẩn. Không đổi số liệu để tạo đường đẹp |
| LED qua REST | 617–622: user123/LED1, user124/LED2, user125/LED1, mỗi người ON rồi OFF; cả sáu có MQTT command/status, STOMP, SQL confirmedAt và REST xác nhận đúng người gửi |
| LED qua Web | 627/628: LED2 ON/OFF sau khi cắm lại, cả hai xác nhận; kết thúc hai Device OFF |
| Không có ESP32 | 623–626 gửi từ Web khi đã rút: không có MQTT status, confirmedAt NULL, có STOMP DEVICE_TIMEOUT; Device không tự đổi. 625 được chụp khi còn Processing |
| Offline → Online | Backend đánh dấu Offline sau reading cuối khoảng 30 giây; Dashboard tự Online và tiếp tục nhận số đo sau khi cắm lại, không restart dịch vụ |
| API | 142 kiểm tra PASS, 0 FAIL và 1 mục OBSERVED trạng thái hardware; [api-review](data/api-review.json). Các mục kiểm tra không phải 142 endpoint hoặc 142 ca độc lập |
| Profile | PUT tạm user125, GET xác nhận, chặn email trùng/username giả/avatar HTTP, khôi phục tám trường trong finally; user123 không đổi. updatedAt của user125 có thay đổi do PUT |
| JWT | Không token/token sai/token hết hạn bị từ chối; ba tài khoản login và đọc hồ sơ đúng chủ thể. Phiên UI cũ hết hạn được chuyển về Login và đăng nhập lại thành công |
| History | Người thực hiện khớp JWT và User liên kết; page 5/10/15/20, sort/filter được rà bằng API; có ảnh sáu cột đủ ngày giờ, Processing thật và ảnh phụ ba tác giả |
| Data Sensor | Dropdown chỉ chọn trường tìm, chưa lọc ngay; tìm giá trị sau submit; tìm 27/10/2026 18:44:00 trả ba reading đúng một giây; có ảnh |
| Chart | Một SVG, 15 điểm mỗi đường, X đầu=60/cuối=1026 cùng nhau ở viewport desktop; timestamp thật từng sensor trong tooltip; ẩn/hiện chú giải và reload được kiểm tra; [DOM](data/chart-dom-online.json) |
| Thông báo LED | Pending ON xanh, OFF đỏ, nền transparent, padding 0; [CSS thực tế](data/pending-message-style.json), ảnh pending và timeout |
| Responsive/console | History desktop đủ sáu cột; mobile390×844 cuộn bảng trong vùng riêng. Console lần kiểm tra cuối không có warn/error được ghi nhận |
| Kiểm thử tự động | 12 Frontend PASS; 4 Backend H2/MQTT mock PASS (không phải bốn thử nghiệm ESP32); Vite và Docker app image build thành công |
| Runtime | App/broker healthy, MySQL đọc được; IOT_LED_DEMO_ENABLED=false, app dùng tcp://mosquitto:1883; MQTT LAN host port1325. Credentials có cấu hình, không lưu giá trị ở báo cáo |

Chi tiết 12 lệnh chủ động: [planned-command-results](data/planned-command-results.json). Các ID595–616 có trong export quan sát rộng nhưng không tính vào 12 ca trên. Session đầu bị gián đoạn bởi runtime restart trước đó; session02 là quan sát bổ sung. Chỉ dùng số liệu session03 cho bảng chốt, không cộng các đoạn thành một phép đo liên tục.

## Ảnh nên dùng

Xem [IMAGE_CATALOG](IMAGE_CATALOG.md). Ảnh được chụp từ trang thật, không sửa đường biểu đồ hoặc số đo. Chọn ảnh đủ khung cho hình chính; ảnh bảng10hàng bị cắt phân trang chỉ dùng phụ.

## Giới hạn còn lại

- Chưa cắt broker/Wi-Fi, thử ACK muộn/lặp/đảo thứ tự với phần cứng thật, chạy dài hạn hoặc tải nhiều client. Không đánh dấu PASS cho các mục này.
- MQTT telemetry chỉ có sensorCode/value: Backend gán recordedAt, không có sampleId/timestamp đo chung. 15 vị trí X là thứ tự reading của từng sensor; nhãn theo nhiệt độ, không phải ba phép đo cùng thời điểm. Sau rút/cắm, các điểm cũ có thể nằm cạnh reading mới đúng theo thứ tự.
- Khoảng ngắt lớn nhất của session03 bao gồm thao tác rút ESP32 có chủ đích; không diễn giải thành độ trễ mạng tự phát. Các số ms command/status là cùng observer, không phải thời gian đèn phát sáng.
- Trạng thái GPIO được firmware phản hồi qua MQTT; chưa có ảnh/xác nhận quang học riêng cho từng lần LED trong phiên này. Người dùng đã xác nhận hoàn tất thao tác ánh sáng, chưa xác nhận riêng hai LED bằng lời.
- Bổ sung ảnh mạch toàn cảnh/cận chân nối/Serial và xác nhận firmware đang nạp; không suy ra firmware thực từ sketch trên máy. Không công bố config.h, credentials hoặc JWT.
- Cảnh báo timeout gắn với thao tác trên Dashboard hiện tại; rời trang rồi quay lại không giữ nguyên thông báo tạm. ActionHistory và trạng thái thiết bị vẫn được đọc từ Backend; kiểm thử đã chụp timeout khi giữ nguyên trang.

## Bảo toàn

Không sửa firmware, broker, schema, không xóa dữ liệu/volume hoặc restart container trong lượt chốt. Có tạo history kiểm thử và PUT tạm user125 rồi khôi phục các trường. Build lại image để giữ bản CSS hiện tại khi tạo lại app về sau; không chạy up/down. Bộ21/10 giữ nguyên và được đối chiếu SHA256, xem [integrity](data/old-evidence-integrity.json). Không commit/push.
''')
write(E/'IMAGE_CATALOG.md', '''# Chọn ảnh cho báo cáo — rà trực quan

| Ảnh | Cách sử dụng |
| --- | --- |
| [Dashboard cuối](images/dashboard-final-after-reload.png) | Hình chính: Online, đủ ba card/chart/hai LED; sau cắm lại và thử Web ON/OFF; cả hai OFF |
| [Dashboard Online](images/dashboard-online-final.png) | Ảnh Online trước ngắt, đủ bố cục và đường biến đổi thật |
| [Data Sensor tìm thời gian](images/sensor-time-search-final.png) | Hình chính: đủ form, ba kết quả đúng18:44:00, thời gian, phân trang |
| [History sáu cột](images/history-six-columns-desktop.png) | Hình chính3.22: đủ tiêu đề, bộ lọc, sáu cột và phân trang; chụp trước chuỗi617–628 |
| [Ba tác giả](images/history-three-users-final.png) | Ảnh phụ: các hàng617–622 thể hiện ba người gửi thật; dưới viewport bị cắt phân trang, không dùng làm hình bố cục chính |
| [Processing thật](images/history-processing-pending-row.png) | Hình chính: request625 khi còn PENDING, đủ toàn bộ bố cục |
| [Pending màu](images/led-pending-on-off-colors.png) | Hình chính: ON xanh/OFF đỏ, không nền, hai nút đang chờ; hardware Offline |
| [Timeout](images/dashboard-timeout-message.png) | Hình chính: Offline và LED2 chưa nhận phản hồi; số đo cuối được giữ |
| [Khôi phục Online](images/dashboard-recovered-online.png) | Ảnh phụ: hardware tự Online; còn cảnh báo cho lệnh cũ chưa ACK, không hiểu là lệnh đã thành công |
| [Swagger bảy thao tác](images/swagger-seven-endpoints.png) | Hình chính3.26: bảy endpoint, không mở JWT/Authorize; ngắn hơn ảnh21/10 |
| [HistoryRow.username](images/swagger-historyrow-username.png) | Hình riêng schema: đủ10trường và mô tả username; không dùng ảnh endpoint để chứng minh trường schema |
| [Profile phần trên](images/profile-edit-upper.png), [nút form](images/profile-edit-form-buttons.png) | Hai ảnh bổ sung nhau; không gọi phần trên là toàn form. Dùng F20 cũ nếu cần một hình xem hồ sơ |
| dashboard-offline-before-tests.png | Ghi nhận Offline ở đoạn trước; không phải Online hiện tại |
| dashboard-offline-after-navigation.png | Offline sau chuyển trang, không có thông báo timeout; không dùng minh họa timeout |
| history-processing-empty-after-timeout.png | Rỗng sau timeout; không chứng minh hàng Processing |

Tên file không thay thế việc đọc nội dung. Các ảnh từ bộ21/10/27/10trước giữ nguyên. Metadata lưu ởimages/index.json; các ảnh thêm cuối ghi thời gian lưu filesystem, không suy đoán thời điểm chính xác của từng click.
''')
# Archive runtime/test summary without embedding secret-bearing files.
write(E/'data/backend-test-result.txt', '\n'.join(read(ROOT/'tmp/runtime-review/final-review-backend-tests.log').splitlines()[-12:])+'\n')
write(E/'data/build-and-ui-checks.json',json.dumps({'frontendTests':12,'frontendBuild':'PASS','dockerImageBuild':'PASS',
 'runtimeRestarted':False,'simulation':False,'mqttUri':'tcp://mosquitto:1883',
 'uiChecks':['dropdown does not apply until submit','value search','exact-second search','legend toggle','chart keyboard tooltip','page reload','expired session relogin','Processing row625','pending ON green/OFF red transparent','timeout message','automatic hardware recovery','Web LED2 ON/OFF627/628'],
 'desktopViewport':'1440x1000','mobileHistoryViewport':'390x844','consoleWarningErrorCount':0},ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False))
