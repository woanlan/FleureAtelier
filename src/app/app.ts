import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { AtelierFooter } from './components/atelier-footer/atelier-footer';
import { AtelierHeader } from './components/atelier-header/atelier-header';
import { CustomBouquetStudio } from './components/custom-bouquet-studio/custom-bouquet-studio';
import { HangingGallery } from './components/hanging-gallery/hanging-gallery';
import { HeroAtelier } from './components/hero-atelier/hero-atelier';
import { OccasionShowcase } from './components/occasion-showcase/occasion-showcase';
import { OrderDrawer } from './components/order-drawer/order-drawer';
import { SeasonalCalendar } from './components/seasonal-calendar/seasonal-calendar';
import { AtelierService } from './services/atelier.service';

/**
 * Root Standalone Component của "FLEURÉ — Flower Boutique".
 * Kết nối xuyên suốt 5 phân khu trải nghiệm hoa tươi nghệ thuật cùng Header, Footer,
 * Ngăn kéo đặt hoa + Mã ưu đãi FLEURÉ + Thiệp gấp 3D và bộ tự ẩn thanh cuộn mảnh 4px (evondevKit I18).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AtelierHeader,
    HeroAtelier,
    HangingGallery,
    OccasionShowcase,
    CustomBouquetStudio,
    SeasonalCalendar,
    AtelierFooter,
    OrderDrawer,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollbarAutohide();
    }
  }

  /**
   * Kích hoạt class `.is-scrolling` trên phần tử đang cuộn (capture phase)
   * và gỡ sau 700ms đứng yên để thanh cuộn 6px trong `styles.css` tự ẩn mượt (luật I18).
   */
  private setupScrollbarAutohide(): void {
    const hideTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

    const handleScroll = (event: Event): void => {
      const scrollingElement =
        event.target instanceof Element ? event.target : document.scrollingElement;
      if (!scrollingElement) return;

      scrollingElement.classList.add('is-scrolling');
      const existingTimer = hideTimers.get(scrollingElement);
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      hideTimers.set(
        scrollingElement,
        setTimeout(() => {
          scrollingElement.classList.remove('is-scrolling');
        }, 700)
      );
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    });
  }
}
