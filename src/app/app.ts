import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AtelierFooter } from './components/atelier-footer/atelier-footer';
import { AtelierHeader } from './components/atelier-header/atelier-header';
import { BottomNav } from './components/bottom-nav/bottom-nav';
import { OrderDrawer } from './components/order-drawer/order-drawer';
import { ToastBar } from './components/shared/toast-bar/toast-bar';
import { AtelierService } from './services/atelier.service';

/**
 * Root Standalone Component của "FLEURÉ — Flower Boutique".
 * Khung ứng dụng Mobile-First 430px căn giữa (kể cả trên Desktop) theo đúng chuẩn ASM 1:
 * Header + `<router-outlet />` + Footer + BottomNav + Ngăn kéo đặt nhanh Thiệp 3D + Toast Hoàn tác.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AtelierHeader, AtelierFooter, BottomNav, OrderDrawer, ToastBar],
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
   * và gỡ sau 700ms đứng yên để thanh cuộn 4px trong `styles.css` tự ẩn mượt (luật I18).
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
