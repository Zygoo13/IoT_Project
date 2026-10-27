# Tiếp tục viết báo cáo — chốt 27/10/2026

Đọc [RESOURCE_INDEX](RESOURCE_INDEX.md), [báo cáo rà soát cuối](../Evidence/2026-10-27-final-review/README.md) và [danh mục ảnh mới](../Evidence/2026-10-27-final-review/IMAGE_CATALOG.md) trước khi viết.

## Đã hoàn tất

- Có bản thảo bốn chương; từng chức năng đi UI → sequence → API/message → dữ liệu/triển khai → kiểm tra. Người dùng tự định dạng Word theo TH1.
- Lượt cuối với ESP32: 522 MQTT sensor readings, 522 STOMP, 174/Sensor, 522 SQL khớp; ánh sáng biến đổi thật. Không gộp số này với 420 reading của 21/10 hoặc các đoạn quan sát khác.
- 617–622: sáu xác nhận LED thật qua REST dưới ba JWT; 627/628: hai xác nhận Web sau cắm lại. 623–626: bốn timeout khi rút. Có ảnh hàng Processing 625, pending ON xanh/OFF đỏ không nền, timeout và tự Online sau cắm lại.
- 142 mục kiểm tra API PASS, 1 OBSERVED, 0 FAIL; PUT tạm user125 được khôi phục tám trường, updatedAt có đổi. Có thử token thiếu/sai/hết hạn và đăng nhập lại UI.
- 12 test Frontend, 4 Backend H2/MQTT mock đạt; Vite/Docker app image build đạt. Không restart container hoặc thay schema/broker/firmware/volume trong lượt chốt.
- History sáu cột và Swagger đã có ảnh mới đủ khung. 73 file bộ 21/10 đối chiếu hash đúng; giữ bộ cũ nguyên vẹn.
- Kết thúc ESP32 đã cắm lại, Dashboard Online, hai Device OFF; không cần cắm lại chỉ để viết những mục đã có minh chứng.

## Việc còn lại cho báo cáo

1. Người dùng bổ sung ảnh toàn bộ mạch, cận chân nối và Serial, xác nhận board/module/nguồn/điện trở/GPIO và firmware thực đang nạp. Sketch trên máy không đủ để kết luận bản trên ESP32. Không chụp secrets/config.h.
2. Chọn hình theo danh mục mới. Hình 3.22 dùng History desktop; ảnh10 hàng ba tác giả chỉ là ảnh phụ vì cắt phân trang. Profile sửa có cặp trên/dưới, không gọi một ảnh là toàn form.
3. Đọc/chỉnh văn phong, thông tin bìa từ TH1, các nhãn CẦN BỔ SUNG/CẦN XÁC NHẬN. Xuất Mermaid rồi kiểm tra bố cục, thêm tài liệu tham khảo chính thức khi sử dụng.
4. Đưa vào Word, caption/mục lục tự động, kiểm tra ngắt trang. Giữ đúng bốn chương.

## Không suy diễn quá bằng chứng

- 15 reading mỗi cảm biến theo thứ tự, không phải15 chu kỳ đồng bộ; timestamp do Backend gán, tooltip giữ giờ từng sensor. Lux ước lượng, chưa hiệu chuẩn.
- ACK là phần mềm/GPIO, chưa có phản hồi vật lý độc lập. Người dùng xác nhận thao tác ánh sáng, chưa xác nhận riêng từng LED bằng ảnh/lời trong lượt này.
- Broker/Wi-Fi lỗi, ACK muộn/lặp/đảo thứ tự thật, tải lớn/chạy dài hạn chưa thử; không tự ghi PASS. Không cần phá runtime để bổ sung các mục này chỉ phục vụ viết bài.
- Các chỉ số ms cùng observer không phải thời gian phát sáng. Khoảng ngắt176 giây trong session03 là lần rút ESP32 chủ động.
- Có thể viết báo cáo theo phạm vi hiện có; không tuyên bố đã kiểm chứng mọi tình huống hoặc an toàn vận hành sản xuất.
