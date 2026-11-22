import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/shared/icon/icon';
import { ProductCard } from '../../components/shared/product-card/product-card';
import { ApiProduct, VoucherCode } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/** Bộ lọc nhóm sản phẩm ưu đãi trên trang Khuyến mãi */
export type PromoFilterId = 'all' | 'deep-discount' | 'under-350k';

interface PromoFilterOption {
  id: PromoFilterId;
  label: string;
}

/** Khởi điểm đếm ngược Flash Sale cuối tuần: 05 giờ 42 phút 18 giây */
const INITIAL_FLASH_SECONDS = 5 * 3600 + 42 * 60 + 18;
const COPY_FEEDBACK_DURATION_MS = 2200;

const PROMO_FILTER_OPTIONS: readonly PromoFilterOption[] = [
  { id: 'all', label: 'Tất cả ưu đãi' },
  { id: 'deep-discount', label: 'Giảm từ 20%' },
  { id: 'under-350k', label: 'Dưới 350.000đ' },
];

/**
 * Trang Khuyến Mãi & Săn Mã Ưu Đãi (`/promotions`) cho khung Mobile-First 430px của FLEURÉ.
 * - Hero Flash Sale nền Ruby đậm kèm đồng hồ đếm ngược trực tiếp mỗi giây (an toàn SSR).
 * - 3 thẻ mã ưu đãi (`FLEURE20`, `YEUHOA15`, `FREESHIP60`) hỗ trợ sao chép 1 chạm & chuyển sang Giỏ hoa.
 * - Bộ 3 chip lọc sản phẩm giảm giá + lưới 2 cột tái sử dụng `<app-product-card />`.
 */
@Component({
  selector: 'app-promotions-page',
  standalone: true,
  imports: [RouterLink, ProductCard, IconComponent],
  templateUrl: './promotions-page.html',
  styleUrl: './promotions-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionsPage {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Danh sách 3 chip lọc sản phẩm khuyến mãi */
  readonly filterOptions = PROMO_FILTER_OPTIONS;

  /** Bộ lọc đang kích hoạt */
  readonly activeFilter = signal<PromoFilterId>('all');

  /** Mã ưu đãi vừa sao chép thành công (đổi nhãn nút sang "Đã sao chép" trong 2.2 giây) */
  readonly copiedCode = signal<VoucherCode | null>(null);

  /** Số giây còn lại của đợt Flash Sale cuối tuần */
  readonly remainingSeconds = signal<number>(INITIAL_FLASH_SECONDS);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  /** Tách giờ : phút : giây định dạng 2 chữ số cố định độ rộng (tabular-nums) */
  readonly countdown = computed(() => {
    const total = Math.max(0, this.remainingSeconds());
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  });

  /** Toàn bộ bó hoa đang có mức giảm giá trực tiếp, ưu tiên % giảm cao nhất */
  readonly allSaleProducts = computed<readonly ApiProduct[]>(() => {
    return this.atelier
      .apiProducts()
      .filter((item) => item.discount > 0 || item.oldPriceValue > item.priceValue)
      .sort((a, b) => b.discount - a.discount || b.sold - a.sold);
  });

  /** Mức phần trăm giảm cao nhất hiện có (khớp dữ liệu thật từ danh mục) */
  readonly maxDiscountPercent = computed<number>(() => {
    const products = this.allSaleProducts();
    if (products.length === 0) return 30;
    return products.reduce((max, item) => Math.max(max, item.discount), 0);
  });

  /** Danh sách bó hoa sau khi áp dụng chip lọc đang chọn */
  readonly filteredSaleProducts = computed<readonly ApiProduct[]>(() => {
    const filter = this.activeFilter();
    const saleList = this.allSaleProducts();

    switch (filter) {
      case 'deep-discount':
        return saleList.filter((item) => item.discount >= 20);
      case 'under-350k':
        return saleList.filter((item) => item.priceValue <= 350000);
      default:
        return saleList;
    }
  });

  constructor() {
    // Khởi chạy đồng hồ đếm ngược trực tiếp trên trình duyệt và tự động dọn dẹp khi rời trang
    if (this.isBrowser) {
      this.countdownTimer = setInterval(() => {
        this.remainingSeconds.update((current) =>
          current > 1 ? current - 1 : INITIAL_FLASH_SECONDS
        );
      }, 1000);
    }

    this.destroyRef.onDestroy(() => {
      if (this.countdownTimer !== null) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      if (this.copyResetTimer !== null) {
        clearTimeout(this.copyResetTimer);
        this.copyResetTimer = null;
      }
    });
  }

  /** Chọn chip lọc sản phẩm giảm giá */
  selectFilter(filterId: PromoFilterId): void {
    this.activeFilter.set(filterId);
  }

  /** Đặt lại bộ lọc về toàn bộ sản phẩm đang giảm giá */
  resetFilter(): void {
    this.activeFilter.set('all');
  }

  /**
   * Sao chép mã ưu đãi vào khay nhớ tạm (Clipboard API + fallback an toàn),
   * hiển thị toast xác nhận và đổi trạng thái nút sang "Đã sao chép" trong 2.2 giây.
   */
  async copyVoucher(code: VoucherCode): Promise<void> {
    let copiedByClipboard = false;

    if (this.isBrowser) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(code);
          copiedByClipboard = true;
        }
      } catch {
        copiedByClipboard = false;
      }

      if (!copiedByClipboard) {
        copiedByClipboard = this.copyWithFallbackTextarea(code);
      }
    }

    this.copiedCode.set(code);
    if (this.copyResetTimer !== null) {
      clearTimeout(this.copyResetTimer);
    }
    if (this.isBrowser) {
      this.copyResetTimer = setTimeout(() => {
        this.copiedCode.set(null);
        this.copyResetTimer = null;
      }, COPY_FEEDBACK_DURATION_MS);
    }

    this.atelier.showToast(
      copiedByClipboard
        ? `Đã sao chép mã ${code}. Dán mã tại Giỏ hoa để áp dụng ưu đãi.`
        : `Mã ưu đãi của bạn là ${code}. Chạm "Dùng ở Giỏ hoa" để áp dụng ngay.`
    );
  }

  /** Dự phòng sao chép khi trình duyệt chặn Clipboard API không bảo mật */
  private copyWithFallbackTextarea(text: string): boolean {
    if (typeof document === 'undefined') return false;

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);
      return succeeded;
    } catch {
      return false;
    }
  }
}
