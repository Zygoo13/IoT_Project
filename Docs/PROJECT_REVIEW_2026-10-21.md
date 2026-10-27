# Kiểm tra Dashboard và luồng dữ liệu — 21/10/2026

## Lượt thu minh chứng báo cáo với ESP32 thật

Ngày 21/10/2026, khoảng 02:27:59–02:35:42 giờ Việt Nam: 420 event Sensor khớp 420 dòng SQL tới micro giây; mỗi Sensor có 140 MQTT message và 140 STOMP event. Đã thao tác Web ON/OFF cả hai LED, requestId 564–567 đều khớp command/status/STOMP/history. Sau khi người dùng rút ESP32, ghi được Offline và timeout thật 568/569, không confirmedAt và Device giữ OFF.

26 ảnh UI và đối chiếu chi tiết lưu ở [Evidence/2026-10-21](Evidence/2026-10-21/README.md). ACK không thay ảnh bóng LED vật lý; người dùng tự bổ sung ảnh mạch/Serial. Có ba yêu cầu bổ sung 570–572 chưa quy nguồn thao tác, không tính vào testcase chủ động; có nhận dồn MQTT tới 10.25 giây, không kết luận mạng ổn định dài hạn. Không đổi source app, broker, firmware hoặc schema trong lượt thu; chỉ các lệnh điều khiển thử tạo History theo nghiệp vụ.


## Bản hiện tại: 15 vị trí cố định, nhãn giờ theo bản ghi

- Giữ một biểu đồ và đủ 15 reading mỗi Sensor. Ba đường đủ dữ liệu có cùng tọa độ X đầu/cuối; X theo thứ tự reading, không giãn theo độ lệch ms của các message.
- Nhãn giờ lấy từ reading nhiệt độ ở từng vị trí, chỉ dùng Sensor khác khi chưa có nhiệt độ. Khi mẫu mới vào, bỏ mẫu cũ, nhãn giờ cập nhật, các vị trí vẫn cố định. Không giả timestamp hoặc tự coi các Sensor là cùng chu kỳ đo.
- Nhãn căn giữa điểm; tự giảm số chữ nếu thiếu chỗ nhưng giữ đủ 15 điểm và nhãn đầu/cuối. Tooltip có mốc giờ chung và ghi rõ mốc Sensor; từng dòng giữ giá trị, đơn vị và thời gian thật riêng.
- Đã bỏ chữ Bản ghi (cũ → mới), giữ việc bỏ tạm dừng/subtitle/bộ đếm. Không thêm animation/tự trượt.
- 12 test qua, gồm mốc giờ từ reading thật, đổi mốc theo mẫu mới, vị trí cố định, không đổi mốc khi ẩn đường, endpoint/nhãn/zero/spike/dữ liệu ít hoặc rỗng. Build local/Docker: JS 266.88 kB, gzip 84.32 kB.
- Chỉ sửa Frontend và hướng dẫn báo cáo. Không đổi firmware/Backend/MQTT/schema/volume; không gửi lệnh LED.

### Kiểm tra browser bản nhãn giờ

- Reload bản mới, đủ 1 biểu đồ/3 đường, mỗi Sensor 15 điểm. Desktop 1820×980: cả ba cùng X đầu 60 và X cuối 1326; đủ 15 nhãn giờ, toàn bộ chữ nằm trong vùng SVG. Viewport mặc định giảm chữ để tránh chồng nhãn, vẫn 15 điểm; đã trả viewport về mặc định.
- Nhãn giờ thay đổi theo reading mới. Tooltip phím End có ngày giờ mốc nhiệt độ và ngày giờ thật từng Sensor. Không còn dòng Bản ghi (cũ → mới), tạm dừng, subtitle hoặc 15/15. Không thấy console warning/error.
- Ảnh bản cuối: tmp/runtime-review/dashboard-record-time-labels.png (Git ignore). App healthy, broker/MySQL không restart, không gửi lệnh LED.

### Giới hạn dữ liệu (đã đo ở lượt trước)

Quan sát MQTT/STOMP 45 giây có 69/69 reading, nhưng khoảng cùng Sensor tại MQTT có lúc tới khoảng 7.8 giây và sau đó nhận dồn. Firmware hiện gửi ba JSON riêng không có thời gian đo/cycleId, Backend ghi recordedAt khi lưu. Serial in cùng lúc không chứng minh ba message được lưu cùng lúc. Chưa đủ bằng chứng quy nguyên nhân cho ESP32, Wi-Fi hay broker; đổi UI không được coi là sửa xong đường truyền.

## Lịch sử: thử nghiệm Canvas đã bỏ

### Thử nghiệm Canvas 2D (đã bỏ)

Bản Canvas này thay thế các thử nghiệm Recharts và thang Y cố định 0–200 được ghi ở phần lịch sử phía dưới. Các thử nghiệm cũ không đáp ứng yêu cầu chuyển động của người dùng; không dùng chúng làm kết luận cho bản hiện tại.

### Chẩn đoán có bằng chứng

- Firmware trên máy publish ba JSON riêng, không có thời gian đo hoặc cycleId. Backend đóng recordedAt khi lưu mỗi SensorData. Serial in cùng lúc không đồng nghĩa ba transaction cùng thời gian.
- Quan sát song song MQTT/STOMP 45 giây: 69/69 reading, mỗi sensor 23. Giá trị tương ứng giống nhau. Khoảng cách cùng sensor tại client MQTT từ 0 ms đến khoảng 7.8 giây: hiện tượng nhận dồn đã xuất hiện trước DB/React.
- Độ trễ MQTT-client → STOMP-client đo cùng đồng hồ Windows khoảng 17–406 ms. Không dùng chênh lệch recordedAt Docker với giờ Windows làm latency vì hai đồng hồ có sai lệch.
- Spike ánh sáng 15.4200 → 67.8880 → 0 trong 234 ms có thật trong DB. Giữ nguyên; không lọc trung bình/xóa để làm đẹp.
- Chưa đủ bằng chứng phân biệt nguyên nhân cụ thể ESP32, Wi-Fi hoặc broker/host. Không tuyên bố sửa xong đường truyền hoặc xác nhận firmware đang nạp chỉ từ source trên máy.

### Thay đổi hiện tại

- Thay phần vẽ bằng Canvas 2D; bỏ Recharts và 39 package phụ thuộc. JS chính từ khoảng 630 kB xuống 267.46 kB, gzip 84.88 kB.
- Cửa sổ 30 giây trượt liên tục bằng requestAnimationFrame khoảng 30 fps, không render React mỗi frame. Clock đơn điệu tránh lệch giờ Windows/Docker; khi mất dữ liệu hiển thị khoảng trống, không kéo dài vô hạn hoặc tạo reading.
- Trục Y thích ứng dữ liệu, có thời gian chờ trước khi thu thang; giữ một trục chung và bố cục Dashboard hiện có.
- Ba đường dùng timestamp riêng, monotone không vượt đỉnh thật; ngắt đoạn nếu gap >6 giây. Tooltip hiện cả ba giá trị gần mốc và thời gian riêng, dấu — nếu không có số đo đủ gần.
- Reading đến muộn được thêm lịch sử đúng thứ tự, không làm card/latest lùi; event lặp không gây cập nhật dư.
- Ẩn thông báo thành công LED cũ có thể mâu thuẫn trạng thái mới; giữ thông báo chờ/lỗi. Không gửi lệnh LED trong lượt kiểm tra.

### Kiểm chứng đã thực hiện

- 12 unit test qua: thời gian/zero/spike, scale, clock đơn điệu, burst/gap, đường cong không overshoot, dữ liệu đến muộn/lặp, giữ 15 điểm, offline không tự đổi LED.
- Build local và Docker thành công; 25 kiểm tra HTTP sau triển khai qua, không ghi DB/publish MQTT. App healthy; chỉ recreate app, broker/MySQL/volume giữ nguyên.
- STOMP thật 30 giây: 45 event. Snapshot cập nhật bằng đúng hàm Frontend đối chiếu REST/MySQL: 15/15 điểm mỗi sensor và card cuối khớp cả giá trị lẫn timestamp.
- Browser: 60 mẫu trong khoảng 6 giây, 59 lần cửa sổ tiến, không lần nào lùi, thang 0–60 với dữ liệu quan sát. Tooltip thật hiển thị đủ ba số đo/đơn vị/thời gian.
- Kiểm tra bản cuối tại Dashboard, desktop 1440×960 và kích thước mặc định; Canvas đổi kích thước đúng, chuyển Data Sensor rồi quay lại vẫn vẽ. Không ghi nhận console warning/error.
- Dấu vết đo và ảnh để trong tmp/runtime-review, đã được Git ignore; không chứa trong báo cáo các credentials/JWT.

### Giới hạn

Nhận dồn trước Backend vẫn được đo thấy, chưa có timestamp/cycleId từ phép đo gốc nên không thể khôi phục chính xác chu kỳ chung. Không sửa firmware, topic, JSON contract, schema hoặc dữ liệu lịch sử. Muốn xác nhận đồng bộ phép đo thực sự cần quan sát Serial và MQTT cùng lượt, rồi bổ sung định danh/thời gian chu kỳ nếu được duyệt. Không ghi phép thử GPIO, mất Wi-Fi, timeout lệnh hoặc tải dài hạn là PASS.

### File chính của bản hiện tại

- Frontend/src/components/EnvironmentChart.jsx
- Frontend/src/utils/chartCanvas.js
- Frontend/src/utils/dashboard.js
- Frontend/src/components/DeviceControl.jsx
- Frontend/src/styles.css
- Frontend/tests/chartCanvas.test.js; Frontend/tests/dashboard.test.js
- Frontend/package.json; Frontend/package-lock.json; Frontend/README.md
- .gitignore; Docs/BTL_REPORT_PLAN.md; biên bản này

## Lịch sử rà soát trước bản Canvas

## Phạm vi

Rà soát luồng chính Frontend → REST/JWT, MQTT → Backend → MySQL → STOMP,
lọc/sort/page, xác nhận lệnh trong source, Profile, Nginx và Compose.
Chỉ sửa Frontend và tài liệu trong lượt này. Không đổi schema, firmware,
broker/topics/credentials; không publish MQTT hoặc gửi lệnh LED.

## Lỗi đã sửa

| Vị trí | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Biểu đồ | Trục X dạng category giãn đều các reading dù timestamp khác nhau; nhãn HH:mm lặp vì chu kỳ khoảng 2s | Dùng timestamp số và scale thời gian, nhãn HH:mm:ss, giữ thời điểm thật của từng cảm biến |
| Đường 0 | Giá trị 0 nằm cùng trục hoành | Thêm padding trục Y, giữ một trục chung và đơn vị °C/%RH/lux |
| Dashboard | lastSeenAt chỉ lấy từ REST/event chuyển Online–Offline | Cập nhật mốc phần cứng từ reading mới, không cho reading cũ làm lùi thời gian |
| Dashboard | REST có thể về sau một event mới và ghi đè trạng thái | Giữ event nhận trong lúc tải rồi áp lại vào snapshot; hủy request khi rời trang |
| Hai bảng | Mỗi reading gọi REST và xóa bảng trước khi response về | Gom event gần nhau trong 300ms, giữ dữ liệu trong lúc tải nền, hủy request cũ |
| Tìm thời gian cảm biến | UI gửi dd/MM/yyyy vào searchField=TIME vốn nhận ngày UTC/ISO | Dùng from/to UTC theo contract, chung hàm chuyển đổi với lịch sử; báo lỗi ngày sai trước khi gọi API |
| Giao diện | Tên card khó nhấn mạnh; nút Xóa lọc chưa có màu | Tên cảm biến/LED weight 700; Xóa lọc nền cam nhạt, viền/chữ cam đậm |
| Dependency | npm audit báo source-map-js 1.2.1 mức high | Chỉ nâng bản vá lên 1.2.2; không nâng React/Vite hay thêm thư viện |

Không gộp ba cảm biến thành một phép đo giả, không tạo đường cong bằng mock.
Nhiệt độ/độ ẩm ít biến động thì đường gần thẳng là đúng với dữ liệu nhận được.

## Số đo thực tế

Mẫu quan sát lúc 01:00 ngày 21/10/2026 theo giờ Việt Nam, trên máy hiện tại,
qua localhost:8088. Mỗi API gọi 5 lần, là mẫu nhỏ khi hệ thống đang hoạt động,
không phải kiểm thử tải hoặc cam kết độ trễ.

| Phép đo | Kết quả |
| --- | --- |
| GET Dashboard | 26–38ms |
| GET Sensor Data, size 5 | 19–22ms |
| GET Action History, size 5 | 15–18ms |
| GET Profile | 10–11ms |
| Quan sát 22s | MQTT 33 reading, STOMP 33 event; mỗi sensor 11 event |
| Khoảng cách event cùng sensor | Khoảng 1.84–2.07s |
| Từ lúc máy nhận MQTT tới nhận STOMP | 18–45ms; gồm khác biệt lịch xử lý của hai client quan sát |
| Đối chiếu lưu trữ | ID và recordedAt của event cuối khớp dòng đọc qua REST/MySQL |
| Docker trước sửa | App khoảng 1.47%CPU, broker 0.05%, MySQL 0.55%; không thấy nghẽn trong mẫu này |

Sau sửa, log bảng cảm biến cho thấy các GET nền chủ yếu cách nhau khoảng 2s,
thay vì yêu cầu tải theo từng message. Không xóa bảng khi chờ response.
Khoảng 2s cũng là SENSOR_INTERVAL trong sketch trên máy; chưa xác nhận binary
đang nạp bằng Serial Monitor trong lượt này.

## Kiểm tra đã thực hiện

- npm test: 8 kiểm tra qua cho ghép timeline, giá trị 0, cửa sổ 15 điểm,
  reading cũ/lặp, Offline không đổi LED và chuyển ngày/giây Việt Nam sang UTC.
- npm run build và Docker build app: thành công. Backend không đổi, bước Maven
  trong Docker dùng cache của bản đang chạy.
- npm audit sau bản vá: 0 lỗ hổng được báo tại thời điểm kiểm tra.
- verify-api-docs.mjs: 25 kiểm tra HTTP qua, gồm login, JWT/401, REST đọc,
  query sai, Swagger/schema và route React. Không PUT hồ sơ hoặc POST LED hợp lệ.
- Browser thật tại localhost:8088: đăng nhập đúng, Dashboard/card/3 đường,
  mốc giây và lastSeenAt cập nhật; kiểm tra chữ đậm bằng computed styles.
- Cảm biến: chọn loại chưa tự lọc trước submit; tìm 28.3°C có đơn vị;
  sort ASC, size 10, trang 2; tìm 21/10/2026 thành công; đúng giây 01:08:48 trả 3 reading;
  ngày 31/02 bị chặn; ngày 01/01/2000 hiển thị kết quả rỗng.
- Lịch sử: kết hợp LED1/ON/ON, tìm ngày, Processing rỗng khi không có lệnh chờ;
  Xóa lọc, size 20, sort ASC và trang 2. Nút Xóa lọc có màu kiểm tra được qua browser.
- Profile: hiển thị dữ liệu/ảnh, mở và Hủy form; linkIoT Monitor trở về Dashboard.
- Khi recreate app, browser hiện mất kết nối rồi tự phục hồi, REST tải lại và
  reading tiếp tục cập nhật. Shared realtime service giữ nguyên, không cần đăng nhập lại.
- Không thấy console warning/error trên browser sau reload bản mới và các thao tác trên.

## Giới hạn còn lại trước khi viết phần kết quả BTL

- Chưa thử GPIO LED, PENDING→CONFIRMED/TIMEOUT, phản hồi muộn hoặc ESP32 offline
  trong lượt này; source đã được rà soát nhưng không ghi các phép thử đó là PASS.
- Chưa thử lưu Profile bằng PUT trong lượt này; đã thử mở/hủy và GET.
- Chưa thử tải dài hạn, nhiều client hoặc mất mạng Wi-Fi thật. Kết quả 33 reading
  chỉ chứng minh đoạn quan sát MQTT/DB/REST/STOMP, không bao quát mọi tình huống.
- BundleJS chính khoảng 628kB (gzip 189kB), Vite còn cảnh báo trên 500kB. Đây là
  chi phí tải ban đầu, không có bằng chứng nó gây độ trễ 2s của sensor. Chưa chia
  bundle trong lượt này để giữ thay đổi tập trung vào lỗi đã tái hiện.

Có thể bắt đầu viết các chương giới thiệu, phân tích và thiết kế theo
BTL_REPORT_PLAN.md. Phần kết quả điều khiển phần cứng cần ảnh/video và requestId
đối chiếu từ một lượt kiểm thử ESP32 thật, không sử dụng lịch sử demo BTH3 làm bằng chứng.

## File thay đổi

- Frontend/src/pages/Dashboard.jsx; Frontend/src/utils/dashboard.js.
- Frontend/src/pages/DataSensor.jsx; Frontend/src/pages/ActionHistory.jsx.
- Frontend/src/utils/dateTime.js; Frontend/src/styles.css.
- Frontend/tests/dashboard.test.js; Frontend/tests/dateTime.test.js.
- Frontend/package.json; Frontend/package-lock.json; Frontend/README.md.
- Biên bản này. Đầu ra quan sát cục bộ đặt trong tmp/runtime-review (Git bỏ qua).


## Bổ sung sau phản hồi về chuyển động biểu đồ

Đã tách EnvironmentChart/ChartView trong cùng một component file để giữ riêng
nhịp vẽ với nhịp nhận cảm biến. Gom dữ liệu đến gần nhau trong 300ms, vẫn giữ
mọi reading của cửa sổ 15 điểm mỗi sensor. Trục X cố định cửa sổ 30s, tick cách
5s; Y mặc định 0–200, chỉ mở rộng nếu có giá trị ngoài thang. Animation 600ms
đối chiếu điểm theo timestamp và sắp theo X khi thêm/bỏ điểm ở mép cửa sổ.
Mỗi đường dùng dữ liệu riêng, tránh hàng trống xen kẽ của các cảm biến khác.
Không đổi CSS, API, Backend, schema hoặc firmware trong lần bổ sung này.

Đối chiếu spike trong ảnh: LDR_LIGHT tại UTC 18:13:20.306245 là 15.4200,
18:13:20.489525 là 67.8880, 18:13:20.540190 là 0.0000 (giờ Việt Nam 01:13:20).
Ba reading cách nhau 234ms, có thật trong DB. Không xóa hoặc làm trung bình
các giá trị đó để tạo đường đẹp giả. ESP32 hiện không gửi sample timestamp
hoặc cycleId trong JSON; Backend đóng dấu thời điểm nhận từng message.

Build local/Docker thành công, npm test 12 kiểm tra qua. Đã cập nhật app,
broker/MySQL giữ nguyên. Quan sát browser 40 mẫu trong 4001ms: mỗi đường có
8 hình trung gian khác nhau, đủ 3 đường, không path NaN và không gập ngược X.
Tooltip qua bàn phím hiển thị timestamp và lux đúng. Đây là kiểm tra chuyển
động ngắn, không phải benchmark FPS hoặc bảo đảm Wi-Fi không gián đoạn.
