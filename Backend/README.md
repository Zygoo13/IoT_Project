# Backend IoT

Chạy cùng Frontend trong một container: xem [README gốc](../README.md).
Container dùng MySQL/Mosquitto hiện có và cấu hình riêng cho địa chỉ Docker;
không chạy đồng thời Backend Java cục bộ và Backend trong container.

Khung Spring Boot cho bài BTH4, đặt ngang cấp `Frontend`. Nghiệp vụ lấy theo
`Docs/TH1_IOT_V5.docx`; firmware đối chiếu `Docs/DemoB2.ino`. Xem
`CONTRACT.md` trước khi thêm REST, MQTT hoặc WebSocket và xem
`IMPLEMENTATION_PLAN.md` để làm lần lượt từng giai đoạn.

## Trạng thái hiện tại

Đã hoàn thành cổng MySQL/seed, Auth/Profile, REST đọc, MQTT telemetry, điều khiển LED và STOMP realtime. Package gốc là `zygoo13.iot`. Ứng dụng có
đúng năm entity/bảng theo TH1; `schema.sql` tạo bảng và Hibernate chỉ kiểm tra
ánh xạ (`ddl-auto=validate`). Seed chỉ thêm 1 User, 3 Sensor và 2 Device nếu
chưa có; không thêm SensorData hoặc ActionHistory. `POST /api/auth/login` trả JWT;
`GET/PUT /api/profile` và ba GET đọc dữ liệu yêu cầu token. MQTT nhận reading
từ `iot/sensor/data`, gửi lệnh tới `iot/device/command` và nhận xác nhận ở
`iot/device/status`. STOMP chạy qua WebSocket gốc `/ws`, không dùng SockJS.

## Dữ liệu trình diễn BTH3 (chỉ chạy theo lệnh)

Sau khi MySQL Docker đã chạy và `Backend/.env` đã được cấu hình cục bộ, từ thư
mục `Backend` chạy:

```powershell
pwsh -NoProfile -File scripts/demo-data.ps1 load
pwsh -NoProfile -File scripts/demo-data.ps1 devices
pwsh -NoProfile -File scripts/demo-data.ps1 status
pwsh -NoProfile -File scripts/demo-data.ps1 clean
```

`load` tạo **dữ liệu demo, không phải số đo hay xác nhận thực tế từ ESP32**:
54 `SensorData` (18 điểm cho mỗi Sensor) và 28 `ActionHistory` (14 cho mỗi LED,
gồm bản ghi đã xác nhận và chưa xác nhận). Thời điểm reading được đặt hơn 30
phút trước lúc nạp để Hardware vẫn `OFFLINE` khi không có telemetry thật. Lux
demo nằm trong khoảng 5–195; 15 điểm gần nhất dùng khoảng 29–90 để cả ba
đường có biến thiên thấy được trên một trục tung chung. History demo kết thúc
với LED1 ON và LED2 OFF. `load` không đổi `Device.status`. Chỉ lệnh `devices`
riêng mới đặt trạng thái DB thành LED1 ON, LED2 OFF cho buổi demo; đây không
phải phản hồi từ ESP32. Script không chạy khi Backend khởi động và không thêm bảng.
Chạy `load` lần nữa chỉ kiểm tra các hàng đã nạp. `clean` so khớp ID cùng toàn
bộ giá trị của từng hàng với manifest cục bộ `Backend/.demo-data-manifest.json`
rồi chỉ xóa đúng các hàng đó. Manifest được Git bỏ qua; giữ file này cho đến
khi dọn demo. Nếu một hàng đã bị sửa/xóa, script dừng thay vì xóa hàng khác.
`clean` không hoàn tác trạng thái Device do lệnh `devices` đặt.
Có thể chọn container MySQL khác bằng `IOT_DEMO_MYSQL_CONTAINER`. Không đưa
`.env` hoặc manifest lên Git.

## Môi trường đã kiểm tra ngày 05/10/2026

- Windows PowerShell; JDK 17.0.18 và JDK 25.0.2 có trên máy. `JAVA_HOME` hiện
  trỏ tới đường dẫn không tồn tại, nên đặt tạm `JAVA_HOME` thành thư mục JDK 17
  khi chạy Maven.
- Maven 3.9.12 nằm trong cache `C:\Users\AD\.m2\wrapper\dists`, nhưng `mvn`
  chưa có trên PATH. Spring Boot 3.5.13 và starter web đã có trong Maven cache.
- Docker Desktop đã khởi động. Container thử nghiệm `iot_backend_mysql_20261005`
  dùng MySQL 8.0.46 trên `127.0.0.1:3307`; MySQL client có trong MySQL
  Workbench. Mosquitto 2.1.2 đã được thử với broker cục bộ chỉ lắng nghe loopback.
- `Frontend` là React/Vite và gọi Backend thật qua REST/STOMP.

## Cấu hình cục bộ

Sao chép `.env.example` thành `.env`, thay các giá trị mật khẩu và thông tin
tài khoản seed trước lần chạy đầu. Tạo khóa JWT là Base64 của ít nhất 32 byte
ngẫu nhiên và gán vào `IOT_JWT_SECRET_BASE64`; có thể đặt thời hạn token bằng
`IOT_JWT_TTL_SECONDS` (mặc định 3600). `.env` đã được Git bỏ qua. Tài khoản User
được tạo một lần, password lưu BCrypt; đổi biến seed sau đó không sửa tài khoản
đang có. Database `iot_project` phải tồn tại; image MySQL tạo nó khi container
khởi tạo với `MYSQL_DATABASE`. URL mẫu dùng cổng 3307 và chỉ dành cho máy demo.
Đặt `IOT_MQTT_URI` trỏ tới broker đang dùng; có thể đặt `IOT_MQTT_CLIENT_ID`,
`IOT_MQTT_USER`, `IOT_MQTT_PASSWORD` trong `.env` cục bộ. `.env.example` chỉ có
giá trị mẫu. Backend thử kết nối nền mỗi 5 giây, nên broker tạm ngắt không chặn
REST và khi broker trở lại ứng dụng sẽ subscribe lại.
WebSocket chỉ cho origin frontend development `http://localhost:5173` theo mặc
định; đặt `IOT_FRONTEND_ORIGIN` nếu Vite chạy từ origin khác. Đây là một origin
cụ thể, không dùng `*`.

## Build và chạy trên máy này

Từ `Backend` trong PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17.0.18'
$mvn = 'C:\Users\AD\.m2\wrapper\dists\apache-maven-3.9.12-bin\5nmfsn99br87k5d4ajlekdq10k\apache-maven-3.9.12\bin\mvn.cmd'
& $mvn '-Dmaven.repo.local=C:\Users\AD\.m2\repository' -o clean package
docker start iot_backend_mysql_20261005
Get-Content .env -Encoding UTF8 | ForEach-Object {
    $p = $_.IndexOf('=')
    if ($p -gt 0) {
        [Environment]::SetEnvironmentVariable($_.Substring(0, $p), $_.Substring($p + 1), 'Process')
    }
}
& "$env:JAVA_HOME\bin\java.exe" -jar target\iot-backend-0.1.0-SNAPSHOT.jar
```

Nếu tạo container mới thay vì dùng container đã có, dùng
`docker run --detach --name iot_backend_mysql_20261005 --publish 127.0.0.1:3307:3306 --env-file .env mysql:8.0`.
JAR hiện là JAR Spring Boot chạy trực tiếp. Truy cập cache Maven từ Codex
sandbox cần quyền đọc ngoài sandbox; trên tài khoản Windows bình thường không
cần bước riêng đó.

## Kết quả cổng MySQL và seed

Ứng dụng đã chạy hai lần trên cùng MySQL thật. Cả hai lần truy vấn trực tiếp
đều cho đúng 5 bảng và số dòng `User/Sensor/SensorData/Device/ActionHistory =
1/3/0/2/0`. Kiểm tra thêm: 3 unique của User, unique của Sensor và Device,
3 khóa ngoại, password hash BCrypt. Không có test Java tự động ở giai đoạn này;
cổng được xác nhận bằng khởi động ứng dụng và truy vấn database thực tế.

Không đưa thông tin Wi-Fi, MQTT, mật khẩu seed hoặc JWT secret vào Git.

## Gọi Auth và Profile

Từ PowerShell sau khi chạy ứng dụng, với các biến môi trường seed đã nạp từ
`.env` như ở trên:

```powershell
$base = 'http://127.0.0.1:8080'
$loginBody = @{ username = $env:IOT_SEED_USERNAME; password = $env:IOT_SEED_PASSWORD } | ConvertTo-Json
$token = (Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody).token
$headers = @{ Authorization = "Bearer $token" }
$profile = Invoke-RestMethod "$base/api/profile" -Headers $headers

$update = @{
    fullName = $profile.fullName
    studentCode = $profile.studentCode
    email = $profile.email
    githubUrl = $profile.githubUrl
    figmaUrl = $profile.figmaUrl
    apiDocsUrl = $profile.apiDocsUrl
    reportUrl = $profile.reportUrl
    avatarUrl = $profile.avatarUrl
} | ConvertTo-Json
Invoke-RestMethod "$base/api/profile" -Method Put -Headers $headers -ContentType 'application/json' -Body $update
```

Thay các trường trong `$update` khi cần sửa hồ sơ. PUT chỉ nhận tám trường trên;
`avatarUrl` phải là URL HTTPS. Không có API đăng ký hoặc đổi mật khẩu ở cổng
này. Login sai hoặc token thiếu/sai/hết hạn trả 401; body sai hoặc trường cấm
trả 400; email/mã sinh viên trùng tài khoản khác trả 409. Response Profile có
`id`, `username`, tám trường hồ sơ và hai mốc thời gian UTC, không có hash.

## Kết quả cổng Auth và Profile (05/10/2026)

`mvn package` tạo Spring Boot JAR chạy được. Kiểm tra qua HTTP trên ứng dụng
kết nối MySQL 8.0.46 thật: login đúng 200, sai 401, body rỗng 400; GET Profile
thiếu token, token sai và token hết hạn đều 401; GET hợp lệ 200 và không có
`passwordHash`; PUT hợp lệ 200, dữ liệu còn sau restart; email/mã sinh viên sai,
avatar HTTP và `userId`/`username`/`passwordHash` trong body đều 400. Sau kiểm
thử đã khôi phục tên hồ sơ ban đầu. Truy vấn DB trực tiếp: vẫn đúng năm bảng,
số dòng `1/3/0/2/0` theo thứ tự User/Sensor/SensorData/Device/ActionHistory.
Chưa thử 409 với tài khoản thứ hai vì hệ thống cố ý chỉ có một User; unique đã
được ràng buộc trong schema và mã xử lý xung đột.

## REST đọc dữ liệu

Sau khi login và có `$headers` như trên:

```powershell
Invoke-RestMethod "$base/api/dashboard" -Headers $headers
Invoke-RestMethod "$base/api/sensor-data?page=0&size=20&sortBy=TIME&order=DESC" -Headers $headers
Invoke-RestMethod "$base/api/action-history?device=LED1&action=ON&page=0&size=20" -Headers $headers
```

`page` bắt đầu từ 0, `size` mặc định 20 và phải trong 1..20. Hai bảng trả
`content,page,size,totalElements,totalPages`. Frontend dùng một ô `search`
chung cho các cột của từng bảng, được lọc ở MySQL trước khi phân trang. Tham
số `searchField` cũ vẫn dùng được khi đi cùng `search`: Data Sensor cho Search
`ID,SENSOR_TYPE,VALUE,TIME`; Action History cho Search `ID,DEVICE`. Sort gồm
`ID,SENSOR_TYPE,VALUE,TIME` hoặc `ID,DEVICE,ACTION,STATUS,TIME`; History lọc
`device,action,status`. `from`/`to` nhận ISO 8601 có offset (ví dụ
`2026-10-05T13:00:00Z`), bao gồm hai đầu; frontend đổi từ giờ hiển thị
`Asia/Ho_Chi_Minh` sang timestamp có offset trước khi gửi. Query sai trả
`400 {"code":"BAD_QUERY","message":"..."}`.

Dashboard dùng key `DHT11_TEMP`, `DHT11_HUM`, `LDR_LIGHT` trong `latest` và
`chart`. Chart lấy tối đa 15 reading thật gần nhất **cho mỗi sensor**, trả theo
thứ tự thời gian tăng dần. `hardware.status` là `ONLINE` khi reading mới nhất
không quá 30 giây, ngược lại là `OFFLINE`; số đo cũ vẫn được giữ và có `stale`.
`devices` là trạng thái LED đã ghi trong DB, không suy từ Hardware Offline.

Ví dụ rỗng đã trả thực tế trên MySQL hiện tại:

```json
{"latest":{"DHT11_TEMP":null,"DHT11_HUM":null,"LDR_LIGHT":null},"chart":{"DHT11_TEMP":[],"DHT11_HUM":[],"LDR_LIGHT":[]},"hardware":{"status":"OFFLINE","lastSeenAt":null},"devices":[{"id":1,"code":"LED1","status":"OFF"},{"id":2,"code":"LED2","status":"OFF"}]}
```

Hai trang bảng rỗng đều trả
`{"content":[],"page":0,"size":20,"totalElements":0,"totalPages":0}`.
Với fixture tạm, ví dụ một hàng Sensor Data là
`{"id":116,"sensorCode":"DHT11_TEMP","sensorType":"TEMPERATURE","value":20.0000,"unit":"°C","recordedAt":"2010-01-02T00:00:00Z"}`;
một hàng History có `deviceCode`, `action`, `status`, `createdAt`,
`confirmedAt` và `deliveryState`. ID của fixture chỉ là ví dụ và đã được xóa.

## Kết quả cổng REST đọc (05/10/2026)

`mvn -o clean package` thành công, JAR chạy trên MySQL 8.0.46. Trước fixture,
ba GET có JWT trả 200; thiếu JWT đều 401; Dashboard rỗng không có số đo, hai
bảng rỗng có metadata đúng. Script [`scripts/verify-read.ps1`](scripts/verify-read.ps1)
chèn tạm 23 SensorData và 23 ActionHistory, kiểm tra latest, chart 15 điểm,
online/offline và stale, ba trạng thái delivery, Search/Filter/Sort/Pagination,
trang tối đa 20 và 21 query sai trả 400; script xóa fixture trong `finally`.
Sau đó API lại rỗng và truy vấn DB trực tiếp còn đúng năm bảng, số dòng
`1/3/0/2/0`.

Phép thử còn phát hiện JVM theo giờ máy làm Hibernate đọc `DATETIME` lệch
7 giờ. Ứng dụng nay đặt JVM UTC trước khi khởi động Spring; sáu dòng seed cũ
(1 User, 3 Sensor, 2 Device) trên MySQL cục bộ đã được hiệu chỉnh timestamp
một lần. GET Profile vẫn trả timestamp trùng UTC trong DB. Không sửa schema
hoặc nội dung seed. Giai đoạn MQTT đã thử lại các API bằng telemetry thật.

## MQTT telemetry

Firmware publish từng reading tới `iot/sensor/data`, ví dụ
`{"sensorCode":"DHT11_TEMP","value":29.1}`. Backend chỉ nhận JSON object có
đúng `sensorCode` và `value`; sensor phải tồn tại và đang active, `value` phải
là số hữu hạn trong miền hợp lệ. Mỗi message hợp lệ ghi một `SensorData` với
`recordedAt` theo UTC của backend. JSON sai, thiếu hoặc thừa trường, mã sensor
lạ, sensor inactive và giá trị sai đều bị bỏ qua, không cập nhật mốc Hardware
Online. Dashboard và bảng Sensor Data đọc trực tiếp các hàng vừa ghi.

Sau khi nạp `.env` và chạy ứng dụng, có thể thử bằng Mosquitto CLI trên máy này:

```powershell
$mqttPub = 'C:\Program Files\Mosquitto\mosquitto_pub.exe'
& $mqttPub -h 127.0.0.1 -p 1883 -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD `
    -t 'iot/sensor/data' -m '{"sensorCode":"DHT11_TEMP","value":29.1}'
Invoke-RestMethod "$base/api/dashboard" -Headers $headers
Invoke-RestMethod "$base/api/sensor-data?page=0&size=20" -Headers $headers
```

Đổi host/cổng và cách xác thực trong lệnh publish theo broker của bạn; ví dụ
trên chỉ dùng địa chỉ loopback, không chứa mật khẩu. Nếu broker không dùng
username/password, bỏ `-u` và `-P`. Script
[`scripts/verify-telemetry.ps1`](scripts/verify-telemetry.ps1) chạy phép thử tích
hợp với Mosquitto cục bộ và MySQL; nó cần `.env`, `.mosquitto-test.conf` và
`.mosquitto-test.pw` cục bộ. Hai file broker thử nghiệm cùng `.env` được Git bỏ qua.

## Kết quả cổng MQTT telemetry (05/10/2026)

`mvn clean package` thành công và tạo Spring Boot JAR chạy được. Trên MySQL
8.0.46 và Mosquitto 2.1.2 thật, ba payload hợp lệ tạo đúng ba hàng, đúng Sensor
và thời gian UTC; `GET /api/dashboard` và `GET /api/sensor-data` với JWT đọc được
các hàng đó. JSON hỏng, thiếu/thừa trường, mã lạ, sensor inactive và các giá
trị không hợp lệ không tạo hàng, không làm mới `lastSeenAt`. Hardware thành
`ONLINE` sau reading hợp lệ và `OFFLINE` sau hơn 30 giây không có reading hợp lệ;
giá trị cũ vẫn hiển thị là stale. Khi dừng broker, REST vẫn trả 200; sau khi bật
lại, backend subscribe lại và nhận thêm một reading. Script chỉ xóa bốn hàng
do phép thử này tạo. Truy vấn DB cuối cùng còn đúng năm bảng, số dòng
`User/Sensor/SensorData/Device/ActionHistory = 1/3/0/2/0`.

## Điều khiển LED và xác nhận MQTT

`POST /api/devices/{deviceId}/actions` yêu cầu JWT và body chỉ có `action` là
`ON` hoặc `OFF`. Mỗi lần gọi hợp lệ tạo một `ActionHistory`, kể cả khi lệnh
trùng trạng thái. Backend ghi `action` được yêu cầu, `status` là trạng thái
Device đã xác nhận gần nhất và để `confirmedAt=null`; ID history là `requestId`.
Sau khi commit, backend publish JSON
`{"requestId":101,"deviceCode":"LED1","action":"ON"}` tới
`iot/device/command` với QoS 0, không retained. HTTP 202
`{"requestId":101,"status":"ACCEPTED"}` chỉ có nghĩa lệnh đã được ghi và
publish tới broker; LED chưa được coi là ON.

Backend nhận `{"requestId":101,"deviceCode":"LED1","status":"ON"}` trên
`iot/device/status`, kiểm tra ID/code/status rồi cập nhật history và Device.
Nếu phần cứng xác nhận trạng thái khác lệnh, `action` vẫn giữ lệnh User còn
`status` ghi trạng thái thực tế. Status trùng không sửa lần xác nhận đầu; status
của lệnh cũ vẫn hoàn tất history nhưng không ghi đè Device nếu lệnh có ID mới
hơn đã được xác nhận. Sau 10 giây chưa có xác nhận, GET Action History suy ra
`deliveryState=TIMEOUT` từ `createdAt`; `confirmedAt` vẫn null và Device không
đổi. Xác nhận hợp lệ đến muộn vẫn có thể hoàn tất history.

Broker không nhận publish thì API trả HTTP 503, ví dụ
`{"code":"MQTT_PUBLISH_FAILED","message":"Command saved but MQTT publish failed","requestId":101}`.
History đã commit vẫn còn ở trạng thái chưa xác nhận để tra cứu; backend không
tự đổi Device. Client dùng `requestId` để hỏi lại Action History.

Thử thủ công khi **không có ESP32 đang kết nối**: nạp `.env`, chạy Backend và
broker cục bộ, lấy `$headers` như mục Auth/Profile. Mở một terminal để nhìn
command, rồi dùng terminal khác gọi REST và giả lập status:

```powershell
# Terminal 1: xem đúng một command từ broker cục bộ
& 'C:\Program Files\Mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 `
    -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD `
    -t 'iot/device/command' -C 1

# Terminal 2: $base và $headers lấy từ ví dụ Login ở trên
$led1 = (Invoke-RestMethod "$base/api/dashboard" -Headers $headers).devices |
    Where-Object code -eq 'LED1'
$accepted = Invoke-RestMethod "$base/api/devices/$($led1.id)/actions" `
    -Method Post -Headers $headers -ContentType 'application/json' `
    -Body '{"action":"ON"}'
$statusJson = @{ requestId = $accepted.requestId; deviceCode = 'LED1'; status = 'ON' } |
    ConvertTo-Json -Compress
& 'C:\Program Files\Mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 `
    -u $env:IOT_MQTT_USER -P $env:IOT_MQTT_PASSWORD `
    -t 'iot/device/status' -m $statusJson
Invoke-RestMethod "$base/api/action-history?searchField=ID&search=$($accepted.requestId)" -Headers $headers
```

Lệnh ví dụ chỉ trỏ tới loopback và đọc credentials từ biến môi trường. Nếu
broker không dùng xác thực, bỏ `-u` và `-P`. Script
[`scripts/verify-command.ps1`](scripts/verify-command.ps1) chạy kịch bản tích
hợp khi LED1/LED2 ban đầu đều OFF và không có ESP32: nó dùng broker thử nghiệm
cục bộ, dừng/bật broker, chỉ xóa history do script tạo và khôi phục trạng thái
Device trước thử. Script cần ba file cục bộ được Git bỏ qua: `.env`,
`.mosquitto-test.conf`, `.mosquitto-test.pw`.

## Kết quả cổng command/status (05/10/2026)

`mvn clean package` thành công; JAR chạy với MySQL 8.0.46 và Mosquitto 2.1.2.
Terminal nhận đúng sáu payload command LED1 theo thứ tự requestId và JSON đã
khóa. ON từ OFF giữ history `action=ON,status=OFF,confirmedAt=null` và Device
OFF trước ack; ack đúng chuyển cả hai sang ON. Lệnh ON trùng tạo history riêng;
ack thực tế ON cho lệnh OFF giữ `Action != Status`. ID lạ, code sai, status sai
và thiếu trường đều bị bỏ; phản hồi lặp không đổi xác nhận đầu tiên. Sau hơn
10 giây GET history trả `TIMEOUT`, ack muộn chuyển sang `CONFIRMED`. Hai ack
ngược thứ tự xác nhận cả hai history, Device giữ status của ID mới hơn. Dừng
broker cho HTTP 503 có `requestId`, history còn chưa xác nhận và Device không
đổi; bật lại broker, lệnh LED2 và status của nó được xử lý thành công. Không
có phần cứng kết nối trong phép thử này. Đã dọn đúng tám history thử và khôi
phục Device; số dòng DB cuối cùng là `1/3/0/2/0`.

## STOMP over native WebSocket

Endpoint là `ws://127.0.0.1:8080/ws`. Client gửi JWT trong STOMP `CONNECT`
header `Authorization: Bearer <token>`; không đặt token vào URL. Backend chỉ
cho `SUBSCRIBE` bốn topic `/topic/sensors`, `/topic/hardware`, `/topic/devices`,
`/topic/notifications`. `SEND` từ client bị từ chối; frontend dùng REST để gửi
lệnh LED. Origin của trang frontend phải khớp `IOT_FRONTEND_ORIGIN`.

DTO JSON chính xác của bốn topic và ý nghĩa `status`/`historyStatus` ở
`/topic/devices` nằm trong [`CONTRACT.md`](CONTRACT.md). Sensor và device event
chỉ phát sau khi dữ liệu đã commit. Hardware event chỉ phát khi chuyển
Online/Offline; Offline không đặt LED về OFF. Notification `DEVICE_TIMEOUT`
phát một lần trong phiên chạy khi một history quá 10 giây chưa xác nhận; nó
không lưu thêm bảng/cột và không thay trạng thái Device. Status đến muộn vẫn
phát device event sau khi được lưu.

Frontend mới nên GET Dashboard, Sensor Data và Action History khi mở trang;
sau đó áp dụng STOMP events cho cập nhật ngay. Khi WebSocket đứt và kết nối lại,
gọi GET lại để lấy toàn bộ trạng thái mới nhất. Server không phát lại các event
đã bỏ lỡ.

Client thử thật dùng Node 24 có sẵn trên máy. Sau khi khởi động MySQL và Backend
như trên, chạy trong thư mục `Backend` khi **không có ESP32 đang kết nối**:

```powershell
node scripts\verify-stomp.mjs
```

Script đọc `.env` cục bộ, mở WebSocket với origin được cấu hình, tự login lấy
JWT nhưng không in token, gửi STOMP `CONNECT`/`SUBSCRIBE`, rồi dùng Mosquitto
loopback và MySQL để kiểm tra bốn topic. Nó cần `.mosquitto-test.conf` và
`.mosquitto-test.pw` cục bộ như phép thử MQTT trước; ba file này được Git bỏ
qua. Script chỉ dọn ID reading/history do nó tạo và khôi phục trạng thái LED1.

## Kết quả cổng STOMP (05/10/2026)

`mvn clean package` thành công; JAR chạy với MySQL 8.0.46, Mosquitto 2.1.2
và WebSocket native. Origin lạ, JWT thiếu/sai, subscription ngoài bốn topic và
client `SEND` bị từ chối. JWT đúng subscribe được bốn topic. Ba reading MQTT
tạo ba sensor event; REST đọc được đúng ba dòng đã lưu. Sau 30 giây có đúng một
event Offline; reading mới tạo event Online, LED không đổi. Status hợp lệ tạo
device event với `confirmedAt` khớp REST; status sai/lặp không tạo device event.
Lệnh không được xác nhận phát một notification Timeout, giữ LED cũ; status muộn
chuyển history sang Confirmed và phát device event. Sau khi ngắt/nối lại WS,
GET REST lấy được reading và history mới nhất. Phép thử dọn năm reading và hai
history, trả DB về `1/3/0/2/0`.
