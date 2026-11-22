# FLEURÉ — Flower Boutique (Mobile-First 430px Full-Stack Angular 22)

> **Gói chút hoa, gửi chút thương.**  
> 45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh · Hotline/Zalo: `0909 123 456` · Mở cửa `07:30 – 21:00` mỗi ngày · Giao hỏa tốc 60 phút nội thành TP.HCM.

Website cửa hàng hoa nghệ thuật & bàn tự phối hoa theo ý riêng mang bản sắc **Hồng Pastel (`#FFF5F7`) & Đỏ Ruby (`#9D2547` / `#240B13`)**, khóa chuẩn **khung giao diện di động Mobile-First `430px` căn giữa (kể cả khi duyệt trên Desktop)** theo đúng yêu cầu **Lab 1–4 & Assignment Giai đoạn 1 (WEB2081)**, xây dựng bằng **Angular 22 Standalone + Signals + Lazy Loading**, kết nối trực tiếp toàn bộ **6 collection MongoDB Atlas** qua Backend Express MVC trên Render (`https://fleureshop.onrender.com/api`).

## Link Triển Khai Thực Tế (Live Production)
- **Website Frontend (Vercel):** https://fleure-atelier-854a.vercel.app/
- **Backend REST API (Render + MongoDB Atlas):** https://fleureshop.onrender.com/api/health
- **GitHub Repository:** https://github.com/woanlan/FleureAtelier

## Hệ thống Định tuyến Đa trang chuẩn SEO (Lazy Loading `loadComponent`)

| Đường dẫn URL | Thành phần Lazy-Loaded | Tính năng & API MongoDB sử dụng |
| :--- | :--- | :--- |
| `/` | `HomePage` | Trọn vẹn 5 phân khu biên tập FLEURÉ (*Hero Ruby, Kệ hoa treo 3D, Chọn hoa theo 6 Dịp, Bàn tự phối hoa cành thật + gói lụa Pháp, Lịch mùa hoa Đà Lạt Mosaic 6×8*) + Cầu nối danh mục & `GET /api/home` (`banners`, `categories`, `products`, `posts`) |
| `/products` & `/category/:slug` | `ProductsPage` | Danh sách 12 mẫu hoa 2 cột dùng `<app-product-card>` (`input()`, `output()`, `DecimalPipe`), tìm kiếm API (`GET /api/products?search=...`), lọc theo SEO slug (`GET /api/products?categorySlug=...`), 5 kiểu sắp xếp, đếm kết quả, phân trang & `@empty` |
| `/product/:slug` | `ProductDetailPage` | Chi tiết sản phẩm theo SEO slug (`GET /api/products/:slugOrId`), tự động đặt lại số lượng về `1` bằng **`linkedSignal()`** khi chuyển sản phẩm liên quan, Breadcrumb, Thêm vào giỏ / Mua ngay / Đặt nhanh Thiệp 3D |
| `/promotions` | `PromotionsPage` | Flash Sale nền Ruby kèm đồng hồ đếm ngược live, 3 mã ưu đãi (`FLEURE20`, `YEUHOA15`, `FREESHIP60`) sao chép 1 chạm + tự áp vào Giỏ hoa, lọc sản phẩm giảm giá |
| `/bai_viet` (`/posts` → `/bai_viet`) | `PostsPage` | Góc Cẩm Nang đọc 6 bài viết từ `GET /api/posts`, lọc 5 chuyên mục, hỗ trợ deep-link `?id=...`, khung đọc chi tiết kèm `careTip` & bó hoa liên quan |
| `/experience` | `ExperiencePage` | Thư viện 4 video hướng dẫn từ `GET /api/experiences`, trình phát HTML5 `<video>`, 3 bước kỹ thuật nghệ nhân, danh sách phát & mẫu hoa liên kết |
| `/cart` | `CartPage` | Giỏ hàng đa sản phẩm lưu bền `localStorage` (`fleure-boutique:cart:v1`), tăng/giảm, xóa kèm **Toast Hoàn tác (`Undo`)**, kiểm tra voucher & Freeship `399.000đ`, đặt đơn lưu thật lên MongoDB (`POST /api/orders`) và đối soát đơn gần nhất (`GET /api/orders`) |

## Cách chạy & kiểm thử trên máy

```powershell
cd c:\Users\Admin\Desktop\ANGULAR\flower-atelier
npm install

# Chạy máy chủ phát triển tại http://localhost:4300/
npm start

# Chạy bộ 11 unit test (Vitest + Angular TestBed + HttpTestingController)
npm test -- --watch=false

# Đóng gói production (đầu ra tại dist/flower-atelier/browser)
npm run build
```

## Cấu trúc mã nguồn trọng tâm
- **Khung Mobile-First `430px` & Design Tokens:** [`src/styles.css`](src/styles.css), [`src/app/app.css`](src/app/app.css), [`src/app/components/bottom-nav/`](src/app/components/bottom-nav/)
- **Cấu hình Backend Render / MongoDB & Locale `vi-VN`:** [`src/app/config/api.config.ts`](src/app/config/api.config.ts), [`src/app/app.config.ts`](src/app/app.config.ts)
- **Định tuyến Lazy Loading SEO:** [`src/app/app.routes.ts`](src/app/app.routes.ts)
- **Signals Store & REST Client 6 Collection:** [`src/app/services/atelier.service.ts`](src/app/services/atelier.service.ts)
- **Thẻ sản phẩm tái sử dụng (`input()` / `output()` / `DecimalPipe`):** [`src/app/components/shared/product-card/`](src/app/components/shared/product-card/)
- **SPA Rewrite triển khai Vercel:** [`vercel.json`](vercel.json)
