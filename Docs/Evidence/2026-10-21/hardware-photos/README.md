# Ảnh phần cứng do người dùng bổ sung

Người dùng đã xác nhận sẽ tự chụp và thêm ảnh sau. Phần mềm không thể thay thế các ảnh này.

| Tên gợi ý | Cần nhìn rõ | Dùng cho |
| --- | --- | --- |
| H01-mach-tong-the.jpg | ESP32, breadboard, DHT11, LDR, hai LED, nguồn và dây | Mục 3.2, hình mạch thật |
| H02-noi-day-can-canh.jpg | Chữ GPIO, dây nguồn/GND, chân cảm biến, điện trở LED | Đối chiếu bảng nối dây và sơ đồ mạch |
| H03-led-on.jpg | Hai LED vật lý thực sự phát sáng | Ghép với F13d và requestId 564/565; chỉ gán cùng lượt thử nếu đúng lúc đã chụp |
| H04-led-off.jpg | Hai LED vật lý ở trạng thái tắt | Ghép với F13f và requestId 566/567 nếu đúng lượt |
| H05-serial-sensors.png | Ba số đo, thời điểm hoặc ngữ cảnh quan sát | Đối chiếu Serial với số đo MQTT/UI; không tuyên bố cùng ID nếu Serial không có ID |
| H06-serial-command-status.png | requestId, mã LED, lệnh và phản hồi nếu firmware đang nạp có in | Chứng minh nguồn firmware và phản hồi GPIO |

## Thông tin cần ghi cùng ảnh

- Board ESP32 cụ thể và các module đang dùng.
- GPIO/nguồn/giá trị điện trở theo mạch thật. Source trên máy gợi ý DHT GPIO4, LDR GPIO34, LED1 GPIO18, LED2 GPIO19; cần người dùng đối chiếu, không tự coi đã đúng mạch.
- Sketch/bản build nào đã nạp, nạp lúc nào, IDE/board đã chọn nếu còn nhớ. File có trên máy không chứng minh binary đã nạp.
- LDR là lux ước lượng theo ánh xạ firmware, chưa phải phép đo đã hiệu chuẩn.
- Nếu ảnh chụp ở lượt khác sau này, ghi đúng ngày/lượt chụp; không gán cho requestId của lượt 21/10 này.

Không chụp config.h/.env hoặc phần chứa Wi-Fi/MQTT password, token. Không dùng ảnh mạch của mẫu cũ để thay ảnh dự án.
