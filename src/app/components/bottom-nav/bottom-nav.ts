import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AtelierService } from '../../services/atelier.service';
import { AtelierIconName, IconComponent } from '../shared/icon/icon';

interface BottomNavTab {
  readonly label: string;
  readonly route: string;
  readonly icon: AtelierIconName;
  readonly exact?: boolean;
  readonly fragment?: string;
  readonly isCart?: boolean;
}

/**
 * Thanh điều hướng đáy cố định cho khung ứng dụng Mobile 430px (`<app-bottom-nav>`).
 * - Khóa đồng bộ theo chiều rộng `max-width: 430px` căn giữa trên mọi màn hình (kể cả Desktop).
 * - Gồm 5 lối tắt trọng tâm: Trang chủ, Sản phẩm, Tự bó hoa, Bài viết, Giỏ hoa (kèm badge số lượng live).
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly atelier = inject(AtelierService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tabs: readonly BottomNavTab[] = [
    { label: 'Trang chủ', route: '/', icon: 'flower-2', exact: true },
    { label: 'Sản phẩm', route: '/products', icon: 'layout-grid' },
    { label: 'Tự bó', route: '/', fragment: 'tu-bo-hoa', icon: 'sparkles' },
    { label: 'Bài viết', route: '/bai_viet', icon: 'book-open' },
    { label: 'Giỏ hoa', route: '/cart', icon: 'shopping-bag', isCart: true },
  ];

  onTabClick(event: MouseEvent, tab: BottomNavTab): void {
    if (!tab.fragment || !this.isBrowser) return;

    const currentPath = this.router.url.split(/[?#]/)[0];
    if (currentPath === '/' || currentPath === '') {
      const target = document.getElementById(tab.fragment);
      if (target) {
        event.preventDefault();
        const prefersReduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  }
}
