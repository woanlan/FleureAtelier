# FLEURÉ — Flower Boutique

> **Gói chút hoa, gửi chút thương.**  
> 45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh · Hotline/Zalo: `0909 123 456` · Mở cửa `07:30 – 21:00` mỗi ngày · Giao hỏa tốc 60 phút nội thành TP.HCM.

Website cửa hàng hoa nghệ thuật & bàn tự phối hoa theo ý riêng mang bản sắc **Hồng Pastel (`#FFF5F7`) & Đỏ Ruby (`#9D2547` / `#240B13`)**, xây dựng bằng **Angular 22 Standalone + Signals**, kết nối trực tiếp tới Backend Express + MongoDB Atlas (`https://fleureshop.onrender.com/api`).

## Tính năng nổi bật

1. **Hero Rượu vang Ruby & Cánh hoa rơi (`<app-hero-atelier>`)**: Tương phản tinh tế giữa nền Ruby đậm (`#240B13`), điểm nhấn Hồng Phấn Champagne (`#F2B8C6`) và cặp phông chữ tiếng Việt `Playfair Display` + `Be Vietnam Pro`.
2. **Kệ Bộ sưu tập hoa treo chiều sâu 3D (`#bo-suu-tap`)**: Đồng bộ trực tiếp 12 bó hoa thật từ MongoDB (`GET /api/products`) kèm trạng thái đồng bộ thời gian thực, giá gốc gạch ngang khi khuyến mãi và bộ dự phòng tức thì khi mất mạng.
3. **Chọn hoa Theo 6 Dịp tặng (`#theo-dip`)**: Chuyển mượt giữa *Hoa sinh nhật, Hoa tình yêu, Hoa chúc mừng, Hoa cưới, Lan hồ điệp, Gửi lời cảm ơn* với nền pastel riêng, hiệu ứng cánh hoa `<canvas>` đồng điệu và 4 bó hoa tuyển chọn từ MongoDB cho mỗi dịp.
4. **Bàn Tự bó hoa FLEURÉ (`#tu-bo-hoa`)**: Tự chọn 10 dòng cành hoa Đà Lạt & nhập khẩu (`30.000đ – 95.000đ/cành`), phối 3 kiểu giấy lụa Pháp (*Lụa Hồng Phấn, Voan Kem Pháp, Giấy Đỏ Ruby*), cập nhật hình bó hoa minh họa cùng thành tiền tức thì và tự lưu nháp vào `localStorage`.
5. **Lịch mùa hoa Đà Lạt (`#lich-hoa`)**: Giới thiệu 6 mùa hoa đặc trưng cao nguyên Đà Lạt (*Tulip Hồng Nắng Mai, Hồng Ohara Kem Dâu Đà Lạt, Mẫu Đơn Phấn Cao Nguyên, Cẩm Tú Cầu Trại Mát, Lan Hồ Điệp Bảo Lộc, Cúc Họa Mi Sương Sớm Đà Lạt*) kèm liên kết đặt nhanh bó hoa đồng bộ từ MongoDB.
6. **Ngăn kéo Đặt hoa, Lưu MongoDB, Mã ưu đãi & Thiệp gấp 3D (`<app-order-drawer>`)**: Nhập họ tên, SĐT, địa chỉ giao hoa, áp mã ưu đãi (`FLEURE20`, `YEUHOA15`, `FREESHIP60`), xem trước thiệp gấp 3D, lưu đơn trực tiếp vào MongoDB (`POST /api/orders`) sinh mã thật `#FL-xxxxxx`, đối soát đơn gần nhất (`GET /api/orders`) và sao chép gửi Zalo `0909 123 456`.

## Cách chạy dự án trên máy

```powershell
cd c:\Users\Admin\Desktop\ANGULAR\flower-atelier
npm install
npm start
```

Mở trình duyệt tại: `http://localhost:4300/`

## Các lệnh kiểm thử & đóng gói

```powershell
# Chạy unit tests (Vitest)
npm test

# Build bản production (kết quả tại dist/flower-atelier/browser)
npm run build
```

## Cấu trúc dữ liệu & thiết lập nhanh

- **Cấu hình Backend API (Render / MongoDB)**: [`src/app/config/api.config.ts`](src/app/config/api.config.ts) (mặc định trỏ `https://fleureshop.onrender.com/api`; có thể ghi đè qua `localStorage.setItem('fleure-boutique:api-base', 'http://127.0.0.1:5000/api')` khi chạy backend cục bộ).
- **Bảng màu Hồng Pastel / Đỏ Ruby & Font chữ**: [`src/styles.css`](src/styles.css) và [`src/index.html`](src/index.html).
- **Hợp đồng kiểu dữ liệu & REST API**: [`src/app/models/atelier.models.ts`](src/app/models/atelier.models.ts).
- **Danh mục dự phòng, bản đồ tách nền studio, 6 dịp tặng, 10 cành hoa Đà Lạt, 3 giấy gói Pháp & 3 mã ưu đãi**: [`src/app/data/atelier-catalog.ts`](src/app/data/atelier-catalog.ts).
- **Signals Store & HTTP Client (`GET /api/products`, `POST /api/orders`, `GET /api/orders`)**: [`src/app/services/atelier.service.ts`](src/app/services/atelier.service.ts).
