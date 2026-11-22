import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeVi from '@angular/common/locales/vi';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

registerLocaleData(localeVi);

/**
 * Cấu hình ứng dụng Angular 22 Standalone (Zoneless mặc định, Signals-first).
 * Kích hoạt `provideHttpClient(withFetch())` để kết nối trực tiếp tới Backend Render / MongoDB,
 * và cấu hình chuẩn định dạng số tiền tiếng Việt (`vi-VN`) cho `DecimalPipe`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'vi-VN' },
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      })
    ),
  ],
};
