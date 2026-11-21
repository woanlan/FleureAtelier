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
import { IconComponent } from '../shared/icon/icon';
import { AtelierService } from '../../services/atelier.service';

/** Cấu trúc một mục điều hướng neo trên thanh đầu trang */
interface AtelierNavItem {
  readonly label: string;
  readonly sectionId: string;
  readonly href: string;
}

/**
 * Thanh điều hướng cố định đầu trang (`<app-atelier-header>`).
 * - Giữ bề mặt Hồng Pastel mờ (`rgba(255, 245, 247, 0.94)`) kèm `backdrop-filter: blur(12px)`
 *   để chữ mực `--ink-primary` luôn đạt độ tương phản > 12:1 trên cả nền Ruby đậm lẫn nền sáng.
 * - Trên màn hình <= 860px, thu gọn danh sách liên kết vào ngăn trượt mượt, nút chạm chuẩn 44x44px.
 */
@Component({
  selector: 'app-atelier-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './atelier-header.html',
  styleUrl: './atelier-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierHeader {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Trạng thái đóng/mở ngăn điều hướng trên thiết bị di động (<= 860px) */
  readonly mobileMenuOpen = signal<boolean>(false);

  /** Tham chiếu nút bật/tắt menu di động để trả lại focus khi nhấn Escape */
  private readonly mobileMenuToggleRef =
    viewChild<ElementRef<HTMLButtonElement>>('mobileMenuToggle');

  /** Nhãn đọc màn hình đầy đủ gắn trực tiếp trên nút Đặt hoa (tránh aria-label trên thẻ span con) */
  readonly orderCtaAriaLabel = computed<string>(() => {
    const stems = this.atelier.totalCustomStems();
    return stems > 0
      ? `Đặt hoa – đang chọn ${stems} cành tự phối`
      : 'Đặt hoa';
  });

  /** Danh sách 5 phân khu chính của FLEURÉ — Flower Boutique */
  readonly navItems: readonly AtelierNavItem[] = [
    { label: 'Bộ sưu tập', sectionId: 'bo-suu-tap', href: '#bo-suu-tap' },
    { label: 'Danh mục dịp', sectionId: 'theo-dip', href: '#theo-dip' },
    { label: 'Tự phối hoa', sectionId: 'tu-bo-hoa', href: '#tu-bo-hoa' },
    { label: 'Mùa Đà Lạt', sectionId: 'lich-hoa', href: '#lich-hoa' },
    { label: 'Về FLEURÉ', sectionId: 'xuong-hoa', href: '#xuong-hoa' },
  ];

  /** Bật/tắt ngăn menu điều hướng trên màn hình hẹp */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  /** Đóng ngăn menu di động */
  closeMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }

  /**
   * Cuộn mượt tới phân khu đích khi bấm liên kết điều hướng và tự động đóng ngăn di động.
   */
  navigateToSection(event: MouseEvent, sectionId: string): void {
    this.closeMobileMenu();

    if (!this.isBrowser) {
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (!targetEl) {
      return;
    }

    event.preventDefault();
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targetEl.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });

    // Đồng bộ hash trên thanh địa chỉ mà không gây giật khung nhìn
    try {
      window.history.replaceState(null, '', `#${sectionId}`);
    } catch {
      // Bỏ qua an toàn nếu môi trường iframe/test giới hạn history API
    }
  }

  /**
   * Mở ngăn kéo đặt hoa: ưu tiên bó hoa tự phối nếu người dùng đã chọn >= 3 cành,
   * ngược lại mở mẫu hoa treo đang chọn.
   */
  openQuickOrder(): void {
    this.closeMobileMenu();
    if (this.atelier.totalCustomStems() >= 3) {
      this.atelier.openOrderForCustomBouquet();
    } else {
      this.atelier.openOrderForBouquet(this.atelier.activeHangingBouquet());
    }
  }

  /** Cho phép đóng nhanh menu di động bằng phím Escape và trả focus về nút mở menu */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
      this.mobileMenuToggleRef()?.nativeElement.focus();
    }
  }

  /** Tự động đóng ngăn menu di động khi nới rộng cửa sổ vượt ngưỡng 1023px */
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isBrowser && window.innerWidth > 1023 && this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }
}

export { AtelierHeader as AtelierHeaderComponent };
