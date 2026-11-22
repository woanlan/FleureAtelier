import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AtelierService } from '../../services/atelier.service';
import { IconComponent } from '../shared/icon/icon';

/** Cấu trúc một mục điều hướng đa trang trên thanh đầu trang */
interface HeaderNavItem {
  readonly label: string;
  readonly route: string;
  readonly fragment?: string;
  readonly exact?: boolean;
}

/**
 * Thanh điều hướng đa trang cố định đầu trang (`<app-atelier-header>`).
 * - Kết nối liền mạch Trang chủ editorial (`/`, `/#tu-bo-hoa`) với toàn bộ trang cửa hàng:
 *   `/products`, `/promotions`, `/bai_viet`, `/experience`, `/cart`.
 * - Thanh tìm kiếm trượt mượt kết nối `GET /api/products?search=...` và chuyển hướng `/products?search=...`.
 * - Giữ nguyên 1 dòng gọn gàng từ `1024px` trở lên (không gãy dòng), thu gọn vào ngăn kéo ở `<= 1023px`.
 */
@Component({
  selector: 'app-atelier-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './atelier-header.html',
  styleUrl: './atelier-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierHeader {
  readonly atelier = inject(AtelierService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Trạng thái đóng/mở ngăn điều hướng di động (<= 1023px) */
  readonly mobileMenuOpen = signal<boolean>(false);

  /** Trạng thái đóng/mở thanh tìm kiếm hoa mở rộng phía dưới header */
  readonly searchBarOpen = signal<boolean>(false);

  /** Tham chiếu nút menu & ô tìm kiếm để quản lý focus chuẩn bàn phím */
  private readonly mobileMenuToggleRef =
    viewChild<ElementRef<HTMLButtonElement>>('mobileMenuToggle');
  private readonly searchInputRef =
    viewChild<ElementRef<HTMLInputElement>>('desktopSearchInput');

  /** Nhãn đọc màn hình đầy đủ cho nút Đặt nhanh (Thiệp 3D) */
  readonly orderCtaAriaLabel = computed<string>(() => {
    const stems = this.atelier.totalCustomStems();
    return stems > 0 ? `Đặt hoa – đang chọn ${stems} cành tự phối` : 'Đặt hoa nhanh';
  });

  /** Nhãn đọc màn hình cho nút Giỏ hoa đa món */
  readonly cartAriaLabel = computed<string>(() => {
    const count = this.atelier.cartCount();
    return count > 0 ? `Giỏ hoa, hiện có ${count} sản phẩm` : 'Giỏ hoa đang trống';
  });

  /** 6 mục điều hướng chính ngắn gọn, tối ưu không gãy dòng ở 1024px */
  readonly navItems: readonly HeaderNavItem[] = [
    { label: 'Trang chủ', route: '/', exact: true },
    { label: 'Sản phẩm', route: '/products' },
    { label: 'Tự phối', route: '/', fragment: 'tu-bo-hoa' },
    { label: 'Ưu đãi', route: '/promotions' },
    { label: 'Bài viết', route: '/bai_viet' },
    { label: 'Trải nghiệm', route: '/experience' },
  ];

  toggleMobileMenu(): void {
    this.searchBarOpen.set(false);
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }

  toggleSearchBar(): void {
    this.closeMobileMenu();
    const next = !this.searchBarOpen();
    this.searchBarOpen.set(next);
    if (next && this.isBrowser) {
      setTimeout(() => {
        this.searchInputRef()?.nativeElement.focus();
      }, 60);
    }
  }

  closeAllPanels(): void {
    this.closeMobileMenu();
    this.searchBarOpen.set(false);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.atelier.searchQuery.set(value);
  }

  /** Gửi từ khóa tìm kiếm sang API MongoDB & chuyển tới `/products?search=...` */
  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const query = this.atelier.searchQuery().trim();
    this.atelier.searchProductsFromApi(query);
    this.closeAllPanels();

    void this.router.navigate(['/products'], {
      queryParams: query ? { search: query } : {},
    });
  }

  clearSearch(): void {
    this.atelier.searchQuery.set('');
    this.atelier.searchProductsFromApi('');
  }

  /** Điều hướng an toàn tới phân khu neo trên Trang chủ (ví dụ: `#tu-bo-hoa`) từ bất kỳ route nào */
  onNavItemClick(event: MouseEvent, item: HeaderNavItem): void {
    this.closeAllPanels();

    if (!item.fragment || !this.isBrowser) {
      return;
    }

    const currentPath = this.router.url.split(/[?#]/)[0];
    if (currentPath === '/' || currentPath === '') {
      const targetEl = document.getElementById(item.fragment);
      if (targetEl) {
        event.preventDefault();
        const prefersReduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetEl.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  }

  /** Mở ngăn kéo đặt nhanh + thiệp gấp 3D */
  openQuickOrder(): void {
    this.closeAllPanels();
    if (this.atelier.totalCustomStems() >= 3) {
      this.atelier.openOrderForCustomBouquet();
    } else {
      this.atelier.openOrderForBouquet(this.atelier.activeHangingBouquet());
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.searchBarOpen()) {
      this.searchBarOpen.set(false);
    }
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
      this.mobileMenuToggleRef()?.nativeElement.focus();
    }
  }
}

export { AtelierHeader as AtelierHeaderComponent };
