# Lịch Trình Kiểm Thử (Playtest) - Offline Poker MVP

Chào mừng đến với phiên bản MVP của Offline Poker. Dưới đây là tài liệu hướng dẫn kiểm thử nội bộ.

## 🚀 Release Notes (Phiên bản MVP)
**Tính năng nổi bật:**
- Trải nghiệm Texas Hold'em 6-max mượt mà trên trình duyệt.
- Thi đấu offline với 5 bots (có phong cách chơi khác nhau: Tight, Loose, Aggressive, Passive).
- Hệ thống luật Poker chuẩn xác: Tính toán Side pot, chia Pot (Split pot) và phân bổ chip lẻ (odd-chips) tự động.
- Giao diện tối giản, hiển thị tiếng Việt, có tích hợp nhật ký ván bài (Hand History) rõ ràng.
- Tự động lưu ngân lượng (Bankroll) qua Local Storage và hỗ trợ Nạp lại (Rebuy) khi phá sản.
- Tích hợp hướng dẫn luật chơi chi tiết ngay trong game.

---

## ✅ Checklist Kiểm Thử (Playtest Checklist)
Vui lòng thực hiện các bước sau để đảm bảo hệ thống hoạt động ổn định:
- [ ] Mở game, xem màn hình chào mừng ("Chơi Ngay") và đọc kỹ bảng "Luật Chơi".
- [ ] Kiểm tra nút "Bỏ bài" (Fold) ngay từ vòng Pre-flop.
- [ ] Thử "Xem bài" (Check) khi không có áp lực cược.
- [ ] Thử "Theo" (Call) một lượt Tố từ Bot.
- [ ] Thử kéo thanh trượt "Tố" (Raise) và kiểm tra mức tố tối thiểu có hợp lý không.
- [ ] Thử "Tất tay" (All-in) và kiểm tra xem hệ thống có tách Side Pot chính xác khi có 2+ người cùng theo hay không.
- [ ] Chơi đến khi lật bài (Showdown) để kiểm tra bộ so bài (Pokersolver) có chọn đúng người thắng.
- [ ] Cố tình chơi đến khi hết chip (Bust) để kiểm tra luồng hiển thị nút "Nạp lại $1000".
- [ ] Thu nhỏ cửa sổ trình duyệt hoặc dùng điện thoại để kiểm tra độ tương thích giao diện (đặc biệt là thanh hành động và bàn chơi).
- [ ] F5 (Tải lại trang) để đảm bảo Ngân lượng được lưu chính xác.

---

## 🎯 Các Vấn Đề Cần Ưu Tiên Theo Dõi (Priority Watchlist)
Đội ngũ playtest cần đặc biệt chú ý nếu xảy ra các trường hợp sau:
1. **Sai người thắng (Wrong winner):** Hệ thống đọc sai tay bài hoặc trao nhầm Pot cho người thua.
2. **Sai số lượng chip (Wrong chip count):** Lỗi chia Pot, thất thoát chip, hoặc chia chip lẻ không đúng thứ tự vòng quanh nút Dealer.
3. **Kẹt lượt chơi (Stuck turn):** Vòng cược không thể kết thúc, game bị treo ở lượt của Bot.
4. **Nút bấm khó hiểu (Confusing action buttons):** Giao diện vô tình chặn người chơi hành động, hoặc báo số tiền Tố/Theo bị sai.
5. **Hành vi Bot vô lý (Weird bot behavior):** Bot Tố những khoản tiền phi logic hoặc kẹt vòng lặp All-in.
6. **Lịch sử khó đọc (Unclear hand history):** Lịch sử bị trôi, câu văn lủng củng, hoặc không hiển thị số chip được hoàn trả (uncalled bets).
7. **Lỗi hiển thị Mobile (Mobile layout issues):** Thanh trượt cược khó kéo, hoặc bài bị che khuất trên màn hình nhỏ.

---

## 🐛 Mẫu Báo Cáo Lỗi (Bug Report Template)
Nếu bạn phát hiện lỗi, vui lòng báo cáo theo định dạng sau:

**Tiêu đề Lỗi:** [Ghi ngắn gọn, VD: Kẹt game ở vòng River khi 3 người Tất tay]
**Mô tả chi tiết:**
- **Các bước tái hiện (Steps to reproduce):**
  1. ...
  2. ...
- **Kết quả mong đợi (Expected result):** ...
- **Kết quả thực tế (Actual result):** ...
- **Nhật ký ván bài (Hand History snippet):** [Copy/Paste vài dòng cuối của phần Lịch sử trên UI]
- **Ảnh chụp màn hình (Screenshot):** [Đính kèm nếu có]
