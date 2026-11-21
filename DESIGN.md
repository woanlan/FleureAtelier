# FLEURÉ — Flower Boutique | Design System & Architecture Spec

Tài liệu đặc tả thiết kế (**Stage B2**) cho dự án **FLEURÉ — Flower Boutique** (Angular 22 Standalone + Signals), tuân thủ quy chuẩn **evondevKit (`ui-ux`)**, **WCAG 2.1 AA/AAA** (>= 6.1:1) và bản sắc **Hồng Pastel & Đỏ Ruby Pháp**.

---

## 1. U1 Brief: Bản tóm tắt thiết kế thương hiệu FLEURÉ

- **Sản phẩm & Định vị**: **FLEURÉ — Flower Boutique** (*"Gói chút hoa, gửi chút thương."*) là tiệm hoa nghệ thuật phong cách Minimalist Pháp tọa lạc tại **45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh** (Hotline/Zalo: `0909 123 456`, mở cửa `07:30 – 21:00 mỗi ngày`, giao hỏa tốc 60 phút nội thành TP.HCM). Không gian kết hợp độ tương phản giàu chiều sâu của nền **Rượu vang Ruby đậm (`#240B13`)** ở khu trưng bày hoa treo cùng nền **Hồng Pastel dịu ngọt (`#FFF5F7`)** cho trải nghiệm chọn hoa và tự tay phối cành.
- **Khách hàng mục tiêu**: Khách hàng trẻ và doanh nghiệp tại TP.HCM muốn gửi tặng bó hoa tươi cắt cành Đà Lạt mỗi sáng cho 6 dịp thiết yếu (*Hoa sinh nhật, Hoa tình yêu, Hoa chúc mừng, Hoa cưới, Lan hồ điệp, Gửi lời cảm ơn*), mong muốn tự phối cành hoa theo ngân sách thực tế, áp dụng mã ưu đãi minh bạch và kèm thiệp viết tay gấp 3D.
- **4 Việc chính của người dùng trên trang**:
  1. **Thưởng lãm Kệ Hoa Treo FLEURÉ (`Hanging Gallery`)**: Tương tác chuyển đổi 6 bó hoa đặc trưng treo trên thanh trưng bày sắc Hồng Phấn Champagne trên nền Rượu vang Ruby đậm, xem câu chuyện hương sắc và mở đặt nhanh.
  2. **Chọn hoa theo 6 Dịp tặng (`Occasion Switcher`)**: Chuyển mượt giữa 6 chủ đề với nền pastel riêng, hiệu ứng cánh hoa `<canvas>` theo tông dịp tặng và 4 bó hoa gợi ý chuẩn xác cho từng dịp.
  3. **Bàn Tự bó hoa FLEURÉ (`Custom Bouquet Studio`)**: Tự chọn số lượng trong 10 dòng cành hoa Đà Lạt & nhập khẩu (`30.000đ – 95.000đ/cành`), phối 3 kiểu giấy lụa Pháp (*Lụa Hồng Phấn, Voan Kem Pháp, Giấy Đỏ Ruby*), tự lưu vào `localStorage` và kiểm tra tối thiểu 3 cành.
  4. **Tra cứu Lịch mùa hoa Đà Lạt & Hoàn tất Đặt hoa kèm Mã ưu đãi + Thiệp 3D (`Order Drawer`)**: Khám phá 6 mùa hoa cao nguyên Đà Lạt; chọn kích cỡ (*Nhỏ / Vừa / Lớn*), quà tặng kèm, nhập/chọn mã ưu đãi (`FLEURE20`, `YEUHOA15`, `FREESHIP60`), tính tự động phí giao hỏa tốc 60 phút TP.HCM (miễn phí từ `399.000đ`), viết lời chúc hiện trực tiếp lên thiệp 3D và tạo mã đơn `#FLR-xxxxxx` gửi Zalo `0909 123 456`.
- **Điểm nhấn thị giác chủ đạo (Focal Restraint)**: Đối lập tinh tế giữa **Rượu vang Ruby đậm (`#240B13`)** và **Hồng Pastel (`#FFF5F7`)**; mọi CTA chính trên nền sáng thống nhất duy nhất sắc **Đỏ Ruby FLEURÉ (`#9D2547`)** đạt tỷ lệ tương phản `7.05:1` với chữ trắng `#FFFFFF`.

---

## 2. Bảng vai màu FLEURÉ (Color Role Table, đạt chuẩn WCAG AA/AAA >= 6.1:1)

### 2.1. Bề mặt, Chữ & Hành động toàn cục (`:root` trong `src/styles.css`)

| CSS Token | Mã Hex / Giá trị | Vai trò sử dụng trong giao diện | Độ tương phản kiểm chứng |
| :--- | :--- | :--- | :--- |
| `--bg-cream` (`--bg-blush`) | `#FFF5F7` | Nền chính toàn trang (Hồng Pastel FLEURÉ) | Nền chuẩn sáng |
| `--bg-cream-alt` (`--bg-blush-alt`) | `#FCE7EC` | Nền phân khu xen kẽ (Hồng Phấn nhạt) | Tách lớp dịu với `#FFF5F7` |
| `--surface-card` | `#FFFFFF` | Bề mặt thẻ sản phẩm, ô nhập liệu, ngăn kéo đặt hoa | Tách khối sắc nét |
| `--surface-elevated` | `#FFF9FA` | Bề mặt thiệp 3D, khung tóm tắt đơn hàng | Thanh nhã, ấm mắt |
| `--bg-espresso` (`--bg-ruby-deep`) | `#240B13` | Nền tối chủ đạo khu Hero, Phòng hoa treo & Chân trang | Rượu vang Ruby đậm |
| `--bg-espresso-soft` (`--bg-ruby-soft`) | `#31101A` | Thẻ phụ & thanh điều hướng nổi trên nền tối Ruby | Tách bậc êm trên `#240B13` |
| `--bg-espresso-card` (`--bg-ruby-card`) | `#3D1623` | Khối nội dung nổi trên nền tối Ruby | Rõ lớp chiều sâu |
| `--text-on-dark` | `#FDF4F6` | Chữ tiêu đề & nội dung chính trên `#240B13` | **> 16.0 : 1** (AAA) |
| `--text-on-dark-muted` | `#E2C8D0` | Chữ mô tả phụ, nhãn phụ trên `#240B13` | **> 11.0 : 1** (AAA) |
| `--gold-metallic` (`--rose-champagne`) | `#F2B8C6` | Điểm nhấn Hồng Phấn Champagne, thanh treo hoa trên nền Ruby | **10.1 : 1** với `#240B13` |
| `--gold-metallic-hover` | `#F7CAD5` | Trạng thái hover của điểm nhấn trên nền tối | **11.6 : 1** với `#240B13` |
| `--gold-line` | `rgba(242, 184, 198, 0.34)` | Đường kẻ viền mảnh ánh hồng phấn trên nền Ruby đậm | Trang trí cấu trúc |
| `--ink-primary` | `#2D1820` | Chữ chính trên nền Hồng Pastel & thẻ trắng | **14.5 : 1** trên `#FFF5F7` (AAA) |
| `--ink-secondary` | `#5E3E49` | Chữ mô tả, chú thích, nhãn phụ | **7.4 : 1** trên `#FFF5F7` (AAA) |
| `--ink-muted` | `#6A4B56` | Chữ phụ trợ, ghi chú nhỏ | **6.1 : 1** trên `#FFF5F7` (AA+) |
| `--text-title` | `#5A1428` | Tiêu đề phân khu sắc Ruby trầm sang trọng | **11.1 : 1** trên `#FFF5F7` (AAA) |
| `--primary` (`--ruby-primary`) | `#9D2547` | Nút hành động chính (CTA), trạng thái đang chọn | **7.05 : 1** với `#FFFFFF` (AAA) |
| `--primary-hover` | `#831B38` | Trạng thái hover của nút chính | **9.1 : 1** với `#FFFFFF` (AAA) |
| `--primary-light` | `#FCE7EC` | Nền huy hiệu, chip chọn, vùng nhấn dịu | Tương phản cao với `--primary` |
| `--gold-accent-ink` (`--ruby-accent-ink`) | `#8E2040` | Nhãn eyebrow & giá tiền điểm nhấn trên nền sáng | **7.7 : 1** trên `#FFF5F7` (AAA) |
| `--border-subtle` | `#F0D5DD` | Viền thẻ tĩnh, đường kẻ phân khối (`1px solid`) | Nhịp biên tập phẳng |
| `--border-strong` | `#D9B0BD` | Viền ô nhập liệu, nút viền (`outline`) | Rõ ranh giới tương tác |
| `--border-focus` | `#9D2547` | Viền khi bàn phím focus vào điều khiển | Chuẩn WCAG 2.2 |
| `--ring-focus` | `rgba(157, 37, 71, 0.22)` | Vòng tỏa quanh ô nhập khi focus | Hỗ trợ định vị bàn phím |
| `--backdrop-scrim` | `rgba(36, 11, 19, 0.62)` | Lớp nền mờ khi mở Ngăn kéo Đặt hoa | Tách lớp tập trung |

### 2.2. Bảng màu động theo 6 Dịp tặng FLEURÉ (`OccasionTheme`)

| Mã dịp (`id`) | Nhãn hiển thị | Nền chuyển sắc (`bgHex`) | Màu tiêu đề (`headlineHex`) | Tương phản | Bộ màu cánh hoa rơi (`petalColors`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hoa-sinh-nhat` | Hoa sinh nhật | `#FFF1F4` | `#831B38` | **9.1 : 1** | `#F4B8C8`, `#FAD8E1`, `#E88DA5` |
| `hoa-tinh-yeu` | Hoa tình yêu | `#FCE8EE` | `#7A1734` | **9.3 : 1** | `#E69EB2`, `#F8CDD8`, `#C95A78` |
| `hoa-chuc-mung` | Hoa chúc mừng | `#FDF2E9` | `#7C3A1D` | **7.7 : 1** | `#F2C58A`, `#F7DDB4`, `#E8A58B` |
| `hoa-cuoi` | Hoa cưới | `#F9F6F7` | `#4E333C` | **11.2 : 1** | `#EBDDE1`, `#FFFFFF`, `#D8E3DC` |
| `lan-ho-diep` | Lan hồ điệp | `#FBF3E4` | `#6B4A1A` | **7.3 : 1** | `#E8CA8C`, `#F5E1B8`, `#E9B9A6` |
| `gui-loi-cam-on` | Gửi lời cảm ơn | `#EFF3F7` | `#384D63` | **7.7 : 1** | `#BFD3E8`, `#DCE7F3`, `#F4C4D0` |

---

## 3. Cặp Phông chữ (Typography Pair, chuẩn dấu tiếng Việt)

1. **Display, Tiêu đề thơ & Chữ viết tay trên Thiệp 3D (`--font-serif`)**:
   - **`Playfair Display`** (`400, 500, 600, 700` & `italic 400, 600`, subset `vietnamese`).
   - Vai trò: Khớp trọn vẹn nhận diện gốc FLEURÉ cho tiêu đề Hero (`h1`), tiêu đề phân khu (`h2`), tên bó hoa (`h3`), câu trích dẫn nghiêng và lời chúc viết tay trên thiệp gấp 3D.
2. **Giao diện điều khiển, Nhãn, Giá tiền & Biểu mẫu (`--font-sans`)**:
   - **`Be Vietnam Pro`** (`400, 500, 600, 700`).
   - Vai trò: Thanh điều hướng, tab dịp tặng, nút tăng/giảm cành hoa, bộ chọn mã ưu đãi, biểu mẫu giao hàng và mọi con số giá tiền đi kèm `.tabular-nums`.

---

## 4. Hợp đồng Nguyên tố & Quy tắc Nghiệp vụ (`D1`)

1. **Kích cỡ bó hoa (`BOUQUET_SIZE_OPTIONS`)**:
   - **Nhỏ** (`+0đ`, `8 – 12 cành tinh gọn`), **Vừa** (`+150.000đ`, `14 – 20 cành đầy đặn`), **Lớn** (`+320.000đ`, `24 – 32 cành sang trọng`).
2. **Mã ưu đãi & Phí giao hỏa tốc 60 phút TP.HCM**:
   - Phí giao tiêu chuẩn `25.000đ`; tự động **Miễn phí (`0đ`)** khi tạm tính `>= 399.000đ` hoặc áp dụng mã `FREESHIP60`.
   - `FLEURE20`: Giảm 20% cho đơn từ `450.000đ`.
   - `YEUHOA15`: Giảm 15% cho thành viên mới FLEURÉ.
   - `FREESHIP60`: Miễn phí giao hỏa tốc 60 phút nội thành TP.HCM.
3. **Biểu mẫu, Cuộn & Chuyển động**:
   - Ô nhập trên mobile giữ `font-size: max(16px, 1rem)`, vùng chạm tối thiểu `44×44px`.
   - Không đặt `scroll-behavior: smooth` trên `html`; giữ thanh cuộn mảnh `4px` tự ẩn (`I18`) và tôn trọng `prefers-reduced-motion: reduce`.

---

## 5. Bảng Luồng Người Dùng (`O7` User Flow Table)

| Mã bước | Màn / Phân khu hiện tại | Tác nhân / Nút người dùng bấm | Phản hồi trạng thái & Đích đến | Xử lý Ca biên / Trạng thái Lỗi (`O6` / `S8`) |
| :--- | :--- | :--- | :--- | :--- |
| **F1** | **Hero & Hanging Gallery** (`#bo-suu-tap`) | Bấm mũi tên Trước/Sau hoặc chọn 1 bó hoa treo | Cập nhật `activeHangingIndex`, làm nổi bó hoa tâm điểm; bấm **"Đặt mẫu hoa này"** mở `Order Drawer` (`source: 'collection'`) | Khung ảnh giữ `aspect-ratio` cố định, không gây dịch chuyển bố cục (CLS = 0) |
| **F2** | **Khám phá theo Dịp tặng** (`#dip-tang`) | Chọn 1 trong 6 dịp (*Hoa sinh nhật, Hoa tình yêu, Hoa chúc mừng, Hoa cưới, Lan hồ điệp, Gửi lời cảm ơn*) | Đổi nền pastel `bgHex`, màu tiêu đề `headlineHex`, cánh hoa `<canvas>` và lưới 4 bó hoa tương ứng | Tên bó hoa dài tự xuống dòng (`min-width: 0`), giữ `scrollWidth === clientWidth` ở `375px` |
| **F3** | **Bàn Tự bó hoa FLEURÉ** (`#tu-bo-hoa`) | Tăng/giảm số lượng trong 10 loại cành hoa Đà Lạt + chọn 1 trong 3 giấy lụa Pháp (*Lụa Hồng Phấn, Voan Kem Pháp, Giấy Đỏ Ruby*) | Cập nhật tức thì tổng cành, danh sách cành, tổng tiền `.tabular-nums` và đồng bộ `localStorage` (`fleure-boutique:*`) | Bấm làm mới đưa về `0 cành / 0đ`, hiển thị trạng thái rỗng kèm nút khôi phục mẫu 5 cành gợi ý |
| **F4** | **Bàn Tự bó hoa → Đặt bó riêng** | Bấm nút **"Đặt bó này"** | Nếu `totalCustomStems() >= 3`: mở `Order Drawer` (`source: 'custom'`), giữ nguyên đơn giá cành + giấy gói | Nếu `< 3` cành: chặn mở Drawer, hiện thông báo `role="alert"` yêu cầu chọn tối thiểu 3 cành |
| **F5** | **Lịch mùa hoa Đà Lạt** (`#lich-hoa`) | Xem 6 mùa hoa cao nguyên Đà Lạt & bấm **"Đặt hoa mùa này"** | Tra `linkedBouquetId`, gọi `openOrderForBouquetById()` mở thẳng `Order Drawer` | Tự động fallback về bó đầu tiên nếu mã liên kết không khớp |
| **F6** | **Ngăn kéo Đặt hoa, Mã ưu đãi & Thiệp 3D** | Chọn cỡ bó, quà kèm, áp dụng mã (`FLEURE20` / `YEUHOA15` / `FREESHIP60`), chọn ngày & khung giờ giao TP.HCM, viết lời chúc | Cập nhật trực tiếp tạm tính, mức giảm voucher, phí giao hỏa tốc, tổng tiền và mặt thiệp gấp 3D bằng `Playfair Display Italic` | Báo lỗi rõ nếu mã sai, đơn chưa đủ `450.000đ` cho `FLEURE20`, thiếu tên (`< 2` ký tự), sai SĐT Việt Nam hoặc thiếu ngày giao |
| **F7** | **Xác nhận Đơn Zalo FLEURÉ** (`ConfirmedOrder`) | Bấm **"Xác nhận & Tạo đơn Zalo"** khi hợp lệ | Sinh mã đơn `#FLR-xxxxxx` kèm nội dung `zaloShareText` đầy đủ địa chỉ `45 Nguyễn Huệ, Quận 1, TP.HCM` và Zalo `0909 123 456` | Hỗ trợ sao chép lại nhiều lần, đặt thêm bó khác hoặc đóng ngăn kéo quay lại trang |
