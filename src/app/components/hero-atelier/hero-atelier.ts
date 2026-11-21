import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { PetalCanvasComponent } from '../shared/petal-canvas/petal-canvas';

/**
 * Phân khu mở đầu nghệ thuật (`<app-hero-atelier>`).
 * - Chứa thẻ `<h1>` duy nhất của toàn trang (`FLEURÉ`) trên nền Rượu vang Ruby đậm.
 * - Tích hợp lớp phủ chuyển sắc tối bên trái đảm bảo độ tương phản chữ > 11:1 ở mọi khổ màn hình.
 * - Điểm xuyết cánh hoa rơi nhẹ (`density = 14`) bằng tông Hồng Phấn & Ruby Champagne.
 */
@Component({
  selector: 'app-hero-atelier',
  standalone: true,
  imports: [PetalCanvasComponent],
  templateUrl: './hero-atelier.html',
  styleUrl: './hero-atelier.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAtelier {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Bảng màu cánh hoa Hồng Phấn & Ruby dành riêng cho khung cảnh mở đầu FLEURÉ */
  readonly heroPetalColors: readonly string[] = ['#F5B8C8', '#FADAE3', '#C95A78'];

  /** Cuộn mượt tới phân khu đích khi bấm nút hành động trên Hero */
  scrollToSection(sectionId: string): void {
    if (!this.isBrowser) {
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (!targetEl) {
      return;
    }

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targetEl.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });

    try {
      window.history.replaceState(null, '', `#${sectionId}`);
    } catch {
      // Bỏ qua an toàn nếu môi trường giới hạn history API
    }
  }
}

export { HeroAtelier as HeroAtelierComponent };
