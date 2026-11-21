import { InjectionToken } from '@angular/core';

/** Địa chỉ REST API Backend Express + MongoDB Atlas đã triển khai thực tế trên Render */
export const PROD_API_BASE_URL = 'https://fleureshop.onrender.com/api';

/** Khóa localStorage tùy chọn giúp dev trỏ sang Backend cục bộ (VD: http://127.0.0.1:5000/api) */
export const API_BASE_OVERRIDE_KEY = 'fleure-boutique:api-base';

/**
 * InjectionToken cung cấp địa chỉ gốc của Backend API cho `AtelierService`:
 * 1. Trong môi trường Unit Test (`jsdom` hoặc SSR không có `window`) -> trả về `/api` để dễ mock bằng `HttpTestingController`.
 * 2. Trên trình duyệt thật -> ưu tiên giá trị ghi đè trong `localStorage` (nếu có), mặc định gọi thẳng `PROD_API_BASE_URL` trên Render.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined' || /jsdom/i.test(window.navigator?.userAgent ?? '')) {
      return '/api';
    }

    try {
      const override = window.localStorage.getItem(API_BASE_OVERRIDE_KEY)?.trim();
      if (override && /^https?:\/\//i.test(override)) {
        return override.replace(/\/+$/, '');
      }
    } catch {
      // Bỏ qua an toàn nếu trình duyệt chặn quyền đọc localStorage
    }

    return PROD_API_BASE_URL;
  },
});
