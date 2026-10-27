# Phụ lục làm việc — Từ điển dữ liệu

Bảng dưới lấy tên cột, kiểu, khả năng NULL và chỉ mục từ snapshot MySQL ngày 21/10/2026. Mô tả ý nghĩa dựa trên schema và code nghiệp vụ. Không chứa hàng dữ liệu User hoặc thông tin xác thực.

Cập nhật ngày 27/10/2026: hệ thống có ba User, nhưng schema vẫn năm bảng/40 cột. Người thực hiện lấy qua ActionHistory.userId → User.id → User.username rồi đưa vào DTO `HistoryRow.username`. Không thêm cột username vào ActionHistory; số hàng User khác số bảng/cột. Không đổi snapshot schema cũ để mô tả việc thêm tài khoản.

Nguồn: [db-columns.tsv](../Evidence/2026-10-21/data/db-columns.tsv), [db-foreign-keys.tsv](../Evidence/2026-10-21/data/db-foreign-keys.tsv), [schema.sql](../../Backend/src/main/resources/schema.sql).

Ký hiệu: PK = khóa chính; FK = khóa ngoại; UNIQUE = duy nhất. MUL trong snapshot chỉ mô tả cột có chỉ mục không duy nhất; quan hệ FK được đối chiếu riêng. MySQL thể hiện BOOLEAN dưới dạng tinyint(1).

## User

| Cột | Kiểu SQL thực tế | Cho NULL | Ràng buộc/chỉ mục cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | bigint | Không | PK, AUTO_INCREMENT | Khóa chính tự tăng. |
| username | varchar(50) | Không | UNIQUE | Tên đăng nhập duy nhất. |
| passwordHash | varchar(255) | Không | — | Hash BCrypt của mật khẩu; không đưa giá trị thật vào báo cáo. |
| fullName | varchar(100) | Không | — | Họ và tên. |
| studentCode | varchar(30) | Không | UNIQUE | Mã sinh viên duy nhất. |
| email | varchar(255) | Không | UNIQUE | Email duy nhất. |
| githubUrl | varchar(500) | Có | — | Liên kết repository. |
| figmaUrl | varchar(500) | Có | — | Liên kết thiết kế. |
| apiDocsUrl | varchar(500) | Có | — | Liên kết tài liệu API. |
| reportUrl | varchar(500) | Có | — | Liên kết báo cáo. |
| avatarUrl | varchar(500) | Có | — | URL ảnh đại diện. |
| createdAt | datetime(6) | Không | — | Thời gian tạo, UTC. |
| updatedAt | datetime(6) | Không | — | Thời gian cập nhật, UTC. |

## Sensor

| Cột | Kiểu SQL thực tế | Cho NULL | Ràng buộc/chỉ mục cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | bigint | Không | PK, AUTO_INCREMENT | Khóa chính tự tăng. |
| code | varchar(30) | Không | UNIQUE | Mã nghiệp vụ duy nhất. |
| name | varchar(100) | Không | — | Tên hiển thị. |
| type | varchar(30) | Không | — | Loại Sensor: TEMPERATURE/HUMIDITY/LIGHT. |
| unit | varchar(20) | Không | — | Đơn vị: °C, %RH hoặc lux. |
| active | tinyint(1) | Không | — | Đang được sử dụng. |
| createdAt | datetime(6) | Không | — | Thời gian tạo, UTC. |
| updatedAt | datetime(6) | Không | — | Thời gian cập nhật, UTC. |

## SensorData

| Cột | Kiểu SQL thực tế | Cho NULL | Ràng buộc/chỉ mục cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | bigint | Không | PK, AUTO_INCREMENT | Khóa chính tự tăng. |
| sensorId | bigint | Không | FK | Khóa ngoại đến Sensor.id. |
| value | decimal(12,4) | Không | — | Giá trị reading, giữ tối đa bốn chữ số thập phân. |
| recordedAt | datetime(6) | Không | — | Thời gian Backend ghi nhận reading, UTC; không phải timestamp lấy mẫu từ ESP32. |

## Device

| Cột | Kiểu SQL thực tế | Cho NULL | Ràng buộc/chỉ mục cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | bigint | Không | PK, AUTO_INCREMENT | Khóa chính tự tăng. |
| code | varchar(30) | Không | UNIQUE | Mã nghiệp vụ duy nhất. |
| name | varchar(100) | Không | — | Tên hiển thị. |
| type | varchar(30) | Không | — | Loại thiết bị. |
| status | varchar(10) | Không | — | Trạng thái ON/OFF đã ghi nhận. |
| active | tinyint(1) | Không | — | Đang được sử dụng. |
| createdAt | datetime(6) | Không | — | Thời gian tạo, UTC. |
| updatedAt | datetime(6) | Không | — | Thời gian cập nhật, UTC. |

## ActionHistory

| Cột | Kiểu SQL thực tế | Cho NULL | Ràng buộc/chỉ mục cột | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | bigint | Không | PK, AUTO_INCREMENT | Khóa chính tự tăng. |
| userId | bigint | Không | FK | Khóa ngoại đến User.id. |
| deviceId | bigint | Không | FK | Khóa ngoại đến Device.id. |
| action | varchar(10) | Không | — | Lệnh ON/OFF người dùng yêu cầu. |
| status | varchar(10) | Không | — | Trạng thái ON/OFF gắn với lịch sử; không đồng nghĩa đã được xác nhận. |
| createdAt | datetime(6) | Không | — | Thời gian tạo, UTC. |
| confirmedAt | datetime(6) | Có | — | Thời gian xác nhận, UTC; NULL khi chưa có xác nhận hợp lệ. |

## Quy tắc liên quan

- SensorData.sensorId → Sensor.id; ActionHistory.userId → User.id; ActionHistory.deviceId → Device.id.
- Chỉ mục ghép phục vụ lịch sử: SensorData(sensorId, recordedAt) và ActionHistory(deviceId, createdAt); xem schema để biết định nghĩa đầy đủ.
- Device.status và ActionHistory.action/status chỉ ON/OFF. PENDING, CONFIRMED và TIMEOUT là trạng thái xử lý suy ra, không thêm cột hoặc bảng.
- requestId trong MQTT chính là ActionHistory.id.
- DATETIME(6) giữ phần lẻ tới microsecond; quy ước ứng dụng lưu UTC. Bản thân kiểu DATETIME không lưu tên múi giờ.
- Hình ERD trong Chương 3 rút gọn cột để dễ đọc; phụ lục này liệt kê đầy đủ 40 cột của năm bảng trong snapshot.
