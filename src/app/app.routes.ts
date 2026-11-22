import { Routes } from '@angular/router';

/**
 * Bảng định tuyến đa trang chuẩn SEO (Angular 22 Lazy Loading với `loadComponent`) cho
 * "FLEURÉ — Flower Boutique" (Khung Mobile-First 430px căn giữa kể cả trên Desktop).
 * - Tách từng trang thành chunk JavaScript độc lập để Trang chủ khởi động nhẹ và nhanh nhất.
 * - Khớp 100% đường dẫn chuẩn SEO theo yêu cầu Lab 1–4 & ASM 1:
 *   `/`, `/products`, `/category/:slug`, `/product/:slug`, `/promotions`, `/bai_viet`, `/experience`, `/cart`.
 */
export const routes: Routes = [
  {
    // Trang chủ editorial 5 phân khu FLEURÉ + cầu nối khám phá danh mục MongoDB
    path: '',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    // Danh sách toàn bộ mẫu hoa (hỗ trợ ?search=, lọc danh mục, 5 kiểu sắp xếp, phân trang)
    path: 'products',
    loadComponent: () =>
      import('./pages/products-page/products-page').then((m) => m.ProductsPage),
  },
  {
    // Đường dẫn SEO lọc sản phẩm theo slug danh mục (VD: /category/hoa-sinh-nhat)
    path: 'category/:slug',
    loadComponent: () =>
      import('./pages/products-page/products-page').then((m) => m.ProductsPage),
  },
  {
    // Đường dẫn SEO chi tiết 1 bó hoa theo slug (tự reset số lượng bằng linkedSignal)
    path: 'product/:slug',
    loadComponent: () =>
      import('./pages/product-detail-page/product-detail-page').then((m) => m.ProductDetailPage),
  },
  {
    // Trang Flash Sale, đồng hồ đếm ngược, 3 mã ưu đãi FLEURÉ & sản phẩm giảm giá
    path: 'promotions',
    loadComponent: () =>
      import('./pages/promotions-page/promotions-page').then((m) => m.PromotionsPage),
  },
  {
    // Đường dẫn SEO tiếng Việt cho trang Góc Cẩm Nang / Bài viết chăm sóc hoa
    path: 'bai_viet',
    loadComponent: () => import('./pages/posts-page/posts-page').then((m) => m.PostsPage),
  },
  {
    // Chuyển hướng đường dẫn tiếng Anh `/posts` sang `/bai_viet` để đồng nhất URL SEO
    path: 'posts',
    redirectTo: 'bai_viet',
    pathMatch: 'full',
  },
  {
    // Trang Video trải nghiệm nghệ thuật bó hoa & workshop tại Atelier FLEURÉ
    path: 'experience',
    loadComponent: () =>
      import('./pages/experience-page/experience-page').then((m) => m.ExperiencePage),
  },
  {
    // Trang Giỏ hàng đa món lưu localStorage + Voucher + Đặt đơn lưu MongoDB (POST /api/orders)
    path: 'cart',
    loadComponent: () => import('./pages/cart-page/cart-page').then((m) => m.CartPage),
  },
  {
    // Wildcard route: mọi đường dẫn lạ đều quay về Trang chủ an toàn
    path: '**',
    redirectTo: '',
  },
];
