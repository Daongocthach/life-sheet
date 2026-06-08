name: LifeSheet Premium Light
colors:
  primary: "#7C3AED"
  primary-accent: "#A78BFA"
  background: "#F8FAFC"
  surface: "#FFFFFF"
  on-surface: "#0F172A"
  success: "#10B981"
  error: "#EF4444"
  amber: "#F59E0B"
typography:
  headline:
    fontFamily: Inter
    fontWeight: 600
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
rounded:
  lg: 12px
  full: 9999px
---

# 📝 DESIGN.MD: WEB APP SPECIFICATION

## 📐 1. KIẾN TRÚC GIAO DIỆN BA KHỐI (THREE-COLUMN PREMIUM RESPONSIVE LAYOUT)

### 🎨 Visual Language & Premium Look ("WOW" Factor)
Ứng dụng áp dụng phong cách thiết kế **Clean Aesthetic & High-Contrast Nordic Tech** với tone nền sáng tinh khiết và dải **Tím hoàng gia (Royal Purple)** làm điểm nhấn rực rỡ, tạo độ chuyên nghiệp, sắc nét khi vừa nhìn vào.
* **Màu Nền Chính (Background):** Nền toàn app sử dụng màu xám trắng mịn màng `#F8FAFC` (`bg-slate-50`).
* **Màu Thẻ Số Liệu (Cards Area):** Sử dụng Glassmorphism sáng với lớp mờ nền kính trắng `bg-white/70 backdrop-blur-md border border-white/60 shadow-sm`.
* **Hiệu ứng Wow Dynamic:** Các thanh tiến trình, vòng tròn tiến độ khi chạy có lớp đổ bóng mờ neon phát quang màu tím (`shadow-[0_4px_20px_rgba(124,58,237,0.15)]`) nổi bật trên nền trắng sạch sẽ.

### 💻 Giao diện Desktop (`md: 768px` trở lên)
Chia chiều ngang màn hình thành 3 khối cố định biệt lập (`h-screen w-screen overflow-hidden`):
1. **Sidebar (Bên trái - `w-64` cố định, nền tối huyền bí `bg-slate-950 text-white`):**
   * *Rationale:* Giữ Sidebar nền tối sang trọng để làm bệ phóng giúp khối nội dung số liệu màu sáng ở giữa nổi bật hơn.
   * **Header Section:** Logo app dập nổi Gradient Tím-Hồng phản quang + Nút chuyển đổi nhanh ngôn ngữ (EN / VI).
   * **Navigation Section:** Danh sách Menu dạng Accordion. Khi chọn, nút active sẽ chuyển sang màu Tím rực rỡ (`bg-violet-600`).
2. **Khối Số Liệu Trung Tâm (Ở giữa - `flex-1 h-full overflow-y-auto p-6 bg-slate-50`):** Trực quan hóa dữ liệu toàn bộ bằng các biểu đồ tương tác sắc nét và Bảng dữ liệu (Table) Clean & Sạch.
3. **Khối Chatbot AI (Bên phải - `w-96` cố định, `border-l border-slate-200 bg-white flex flex-col`):** Khung chat dọc thông minh màu sáng. Tin nhắn AI sử dụng nền xám dịu `bg-slate-100`, tin nhắn User sử dụng nền Tím Gradient chữ trắng. Khi dữ liệu thay đổi, bảng khối giữa sẽ có hiệu ứng Flash Highlight tím mờ lan tỏa.

### 📱 Giao diện Mobile (Nhỏ hơn `md: 768px`)
* **Top Bar:** Chiều cao `h-16 bg-slate-950 text-white flex justify-between items-center px-4 sticky top-0 z-50`. Logo bên trái, nút Hamburger Menu màu Tím sáng ở góc phải. Khi chạm vào sẽ mở Sidebar dạng Drawer trượt từ cạnh phải màn hình.
* **Vùng hiển thị:** Khối số liệu ở giữa dồn về luồng dọc 1 cột. Các Bảng số liệu tự động kích hoạt thuộc tính cuộn ngang mượt mà (`overflow-x-auto whitespace-nowrap`) để chữ không bị vỡ.
* **Bong bóng Chat AI:** Thu gọn thành nút tròn nổi Floating Action Button (FAB) màu Tím Neon rực rỡ nằm cố định ở góc dưới bên phải màn hình. Khi chạm vào sẽ phóng to tràn toàn màn hình.

---

## 💰 2. FEATURE: QUẢN LÝ TÀI CHÍNH (FINANCE MANAGEMENT)

Hệ thống quản lý tài chính thông minh, loại bỏ các trường rườm rà, tập trung vào dòng tiền Thực tế và Kỷ luật Ngân sách.

### 💼 Mục con 1: Phân bổ ngân sách (Budget Allocation)
Giao diện hiển thị các Card tiến trình hoặc thanh Progress Bar màu Tím chuyển động (Gradient Purple to Pink) trên nền thẻ trắng tinh tế để kiểm soát hạn mức xài tiền của từng hạng mục lớn trong tháng.

#### Bảng Phân bổ Ngân sách (Budget Table)
* **Hạng mục:** Các mục lớn cố định (`Ăn uống sinh hoạt`, `Thể hình (Gym/Supps)`, `Chi phí cố định`, `Học tập/Công việc`).
* **Ngân sách:** Số tiền tối đa dự kiến phân bổ cho hạng mục đó (Ví dụ: `3.000.000 đ`). Có thể click đúp sửa nhanh.
* **Đã chi:** Tổng số tiền tự động cộng dồn từ các dòng `Chi tiêu` có hạng mục tương ứng bên bảng Nhật ký.
* **Còn lại:** Lấy `Ngân sách` trừ `Đã chi`. Đi kèm thanh tiến trình nhỏ phía dưới, tự động chuyển sang màu Đỏ neon cảnh báo nếu số tiền bị âm (vượt hạn mức).

### 📑 Mục con 2: Nhật ký giao dịch (Transaction Logs)
Bảng số liệu chi tiết hiển thị toàn bộ lịch sử dòng tiền biến động.

#### Bảng Nhật ký Giao dịch (Transaction Table)
* **Ngày giờ:** Hiển thị dạng `DD/MM/YYYY - HH:mm` (Ví dụ: `07/06/2026 - 11:45`). Mặc định sắp xếp mới nhất lên đầu.
* **Loại:** Badge Component gắn mã màu rõ ràng: `Thu nhập` (Nền xanh lá dịu `bg-emerald-50/80 text-emerald-600 border border-emerald-200`) hoặc `Chi tiêu` (Nền đỏ dịu `bg-rose-50 text-rose-600 border border-rose-200`).
* **Số tiền:** Định dạng số phân tách hàng nghìn (Ví dụ: `2.350.000 đ`). Nếu là Chi tiêu tự động có dấu trừ `-`.
* **Ghi chú:** Lưu nội dung text chi tiết do người dùng nhập hoặc do AI bóc tách tự động (Ví dụ: `[Gym/Supps] Mua hũ Whey Scitec Professional 2.35kg`).
* **Actions:** Biểu tượng thùng rác màu đỏ để xóa nhanh dòng giao dịch lỗi thủ công.

---

## 🍗 3. FEATURE: FOOD DIARY (NHẬT KÝ THỰC ĐƠN)

Tối ưu hóa khả năng đếm Macros hình thể kết hợp đồng bộ hóa tài chính chi phí đi chợ hằng ngày.

### 📊 Thống kê tổng quan (Top Dashboard Widget)
Cụm 3 vòng tròn tiến độ (Circular Progress Bars) màu sắc cá tính nổi bật trên nền card kính trắng:
* **Tổng Calories:** Đã nạp / Mục tiêu ngày (Ví dụ: `1,500 / 2,200 kcal`).
* **Bộ ba Macros (P - C - F):** Thanh tiến trình hiển thị: `Protein: 120g/150g` (Màu Tím Primary), `Carbs: 160g/200g` (Màu Lam), `Fat: 45g/60g` (Màu Vàng hổ phách).
* **Tổng chi phí ăn uống hôm nay:** Hiển thị số tiền đậm nổi bật màu Xanh lá: **`45.000 đ`** (Tự động cộng dồn từ bảng thực đơn bên dưới).

### 📑 Bảng chi tiết thực đơn & Chi phí (Food & Cost Diary Table)
Bảng ở giữa hiển thị chi tiết lượng thức ăn nạp vào, Macros và số tiền tương ứng cho mỗi loại thực phẩm.
* **Bữa ăn:** Badge nhãn phân loại bữa (`Bữa Sáng`, `Bữa Trưa`, `Bữa Tối`, `Bữa Phụ`).
* **Tên thực phẩm:** Tên món ăn + định lượng gram (Ví dụ: `200g Phi-lê cá basa`, `1 muỗng Whey Scitec`).
* **Macros nạp:** Hiển thị tóm tắt vi chất: P: [số đạm]g | C: [tinh bột]g | F: [béo]g.
* **Calories:** Số calo cụ thể của thực phẩm đó (Ví dụ: `260 kcal`).
* **Giá tiền:** Chi phí của thực phẩm đó (Ví dụ: `15.000 đ` hoặc `32.000 đ`). Nếu là đồ ăn tự nấu, AI sẽ tự ước tính dựa trên số gram.
* **Actions:** Icon Thùng rác để xóa nhanh dòng thực phẩm.

---

## 🏋️‍♂️ 4. FEATURE: WORKOUT DIARY (NHẬT KÝ TẬP LUYỆN)

Thiết kế tối ưu theo dạng các Khối bài tập độc lập (Exercise Flow Cards) nền trắng tinh khiết giúp người dùng dễ nhìn theo luồng tập tại phòng tạ.

### 🏋️‍♂️ Khối Tiêu đề (Session Header)
* Hiển thị ngày tháng tập hiện tại và tên giáo án tập do người dùng gõ hoặc AI đặt tự động (Ví dụ: `Buổi Kéo (Lưng/Xô/Tay Trước)`).

### 📑 Bảng khối lượng tạ chi tiết (Workout Tracker Table)
Mỗi bài tập đơn lẻ sẽ được render thành một Card bảng độc lập ở khối giữa màn hình.
* **Hiệp (Set):** Hiển thị số hiệp tăng tiến tự động: `Set 1`, `Set 2`, `Set 3`, `Set 4`.
* **Khối lượng:** Số kg tạ thực hiện của set đó (Ví dụ: `12 kg`).
* **Số lần (Reps):** Số lần lặp lại tạ liên tục không nghỉ (Ví dụ: `12 reps`).
* **Trạng thái:** Nút bấm chữ `Done`. Khi click vào sẽ chuyển từ màu xám sang màu **Tím Sáng Phát Quang** đi kèm hiệu ứng tích vạch xanh, đồng thời **Tự động kích hoạt bộ Gym Timer (Đếm ngược thời gian nghỉ lý tưởng 60s - 90s)** hiển thị ngay trên màn hình chính và phát âm thanh báo hiệu khi hết giờ nghỉ.
* **Actions:** Biểu tượng thùng rác để xóa bớt set tập.

---

## 🤖 5. KỊCH BẢN TƯƠNG TÁC SỬA BẢNG QUA KHUNG CHAT AI

Khung chat bên phải nhận diện từ khóa tự nhiên để cập nhật các Bảng ở khối giữa theo thời gian thực (Real-time update):
* **Lệnh:** *"Thêm chi tiêu mua hũ Whey Scitec Professional 2M350 bằng thẻ ngân hàng"* ➔ AI thêm dòng mới vào bảng Nhật ký và tự động cộng dồn vào cột Đã chi bên bảng Phân bổ ngân sách.
* **Lệnh:** *"Bữa trưa nay ăn 150g phi-lê cá basa nướng hết 15 nghìn"* ➔ AI tự tính Macros dinh dưỡng, điền dòng mới vào mục Bữa Trưa trên bảng Thực đơn, đồng thời cập nhật tăng số tiền ở widget **Tổng chi phí ăn uống hôm nay**.
* **Lệnh:** *"Set 4 bài cuốn tạ tay trước ghi nhận lên được 15kg làm 10 reps"* ➔ AI quét bảng ở khối giữa tìm bài tập Bicep Curls, sửa dòng Set 4 sang thông số mới và hiển thị hiệu ứng Flash phát quang màu Tím nhạt chúc mừng
