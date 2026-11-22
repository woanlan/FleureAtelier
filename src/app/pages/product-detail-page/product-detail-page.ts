import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, of, switchMap } from 'rxjs';
import { IconComponent } from '../../components/shared/icon/icon';
import { ProductCard } from '../../components/shared/product-card/product-card';
import { ApiProduct } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

const MIN_ORDER_QUANTITY = 1;
const MAX_ORDER_QUANTITY = 20;

/**
 * Trang Chi tiết bó hoa FLEURÉ (`/product/:slug`).
 * - Thiết kế 1 cột dọc tinh gọn chuẩn Mobile-First 430px.
 * - Sử dụng Angular `linkedSignal()` cho `quantity` để tự động đặt lại về `1` khi đổi `:slug`.
 * - Gọi `GET /api/products/:slug` qua `switchMap` kết hợp dự phòng mượt từ kho `apiProducts()`.
 */
@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ProductCard, IconComponent],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  readonly atelier = inject(AtelierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Giới hạn số lượng đặt mua tối thiểu và tối đa trên mỗi thao tác */
  readonly minQuantity = MIN_ORDER_QUANTITY;
  readonly maxQuantity = MAX_ORDER_QUANTITY;

  /** Tham số đường dẫn `:slug` dạng Signal dùng làm nguồn phụ thuộc cho `linkedSignal()` */
  readonly params = toSignal(this.route.paramMap);

  /**
   * Số lượng đặt mua sử dụng Angular `linkedSignal()`:
   * tự động reset về `1` ngay khi người dùng chuyển sang mẫu hoa khác qua `:slug`.
   */
  readonly quantity = linkedSignal(() => {
    this.params();
    return MIN_ORDER_QUANTITY;
  });

  /** Sản phẩm hoa đang hiển thị chi tiết */
  readonly product = signal<ApiProduct | null>(null);

  /** Trạng thái đang tải chi tiết sản phẩm từ Backend (chỉ bật khi chưa có bản lưu sẵn) */
  readonly loading = signal<boolean>(true);

  /** Đánh dấu đường dẫn `:slug` không khớp bất kỳ sản phẩm nào */
  readonly notFound = signal<boolean>(false);

  /** Có hiển thị giá gốc gạch ngang hay không */
  readonly hasOldPrice = computed<boolean>(() => {
    const item = this.product();
    return !!item && item.oldPriceValue > item.priceValue;
  });

  /** Số tiền tiết kiệm được trên 1 bó hoa nếu đang giảm giá */
  readonly savingsPerItem = computed<number>(() => {
    const item = this.product();
    if (!item || item.oldPriceValue <= item.priceValue) return 0;
    return item.oldPriceValue - item.priceValue;
  });

  /** Nhãn huy hiệu hiển thị ở góc trái ảnh bó hoa */
  readonly badgeLabel = computed<string | null>(() => {
    const item = this.product();
    if (!item) return null;
    if (item.badge?.trim()) return item.badge.trim();
    if (item.discount > 0) return `-${item.discount}%`;
    return null;
  });

  /** Phân biệt kiểu huy hiệu giảm giá (Ruby đặc) với mẫu mới (Hồng phấn viền Ruby) */
  readonly isSaleBadge = computed<boolean>(() => {
    const item = this.product();
    return !!item && (item.discount > 0 || item.badgeClass === 'label-sale');
  });

  /** Tạm tính trực tiếp theo đơn giá và số lượng `quantity()` */
  readonly liveSubtotal = computed<number>(() => {
    const item = this.product();
    return item ? item.priceValue * this.quantity() : 0;
  });

  /** Đúng 2 mẫu hoa liên quan cho mục "Có thể bạn cũng thích" (ưu tiên cùng danh mục) */
  readonly relatedProducts = computed<ApiProduct[]>(() => {
    const current = this.product();
    const all = this.atelier.apiProducts();
    if (!current) return all.slice(0, 2);

    const candidates = all.filter((item) => item.id !== current.id);
    const sameCategory = candidates
      .filter((item) => item.categorySlug === current.categorySlug)
      .sort((a, b) => b.sold - a.sold);
    const others = candidates
      .filter((item) => item.categorySlug !== current.categorySlug)
      .sort((a, b) => b.sold - a.sold);

    return [...sameCategory, ...others].slice(0, 2);
  });

  constructor() {
    if (this.isBrowser) {
      this.atelier.ensureHomeLoaded();
    }

    // Lắng nghe `:slug`, gọi API chi tiết và fallback mượt về danh mục đã lưu sẵn trong bộ nhớ
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((paramMap) => {
          const slug = (paramMap.get('slug') ?? '').trim();
          if (!slug) {
            this.product.set(null);
            this.loading.set(false);
            this.notFound.set(true);
            return EMPTY;
          }

          const cached = this.atelier.getApiProductBySlugOrId(slug) ?? null;
          this.product.set(cached);
          this.notFound.set(false);
          this.loading.set(!cached);

          if (!this.isBrowser) {
            this.loading.set(false);
            this.notFound.set(!cached);
            return EMPTY;
          }

          return this.atelier
            .fetchProductBySlugOrId(slug)
            .pipe(catchError(() => of(this.atelier.getApiProductBySlugOrId(slug) ?? null)));
        })
      )
      .subscribe((resolved) => {
        this.loading.set(false);
        if (resolved) {
          this.product.set(resolved);
          this.notFound.set(false);
        } else {
          this.product.set(null);
          this.notFound.set(true);
        }
      });
  }

  /** Giảm số lượng bó hoa (tối thiểu 1) */
  decreaseQuantity(): void {
    this.quantity.update((current) => Math.max(this.minQuantity, current - 1));
  }

  /** Tăng số lượng bó hoa (tối đa 20) */
  increaseQuantity(): void {
    this.quantity.update((current) => Math.min(this.maxQuantity, current + 1));
  }

  /** Thêm mẫu hoa hiện tại cùng số lượng đang chọn vào giỏ hàng đa món */
  onAddToCart(): void {
    const item = this.product();
    if (!item) return;
    this.atelier.addToCart(item, this.quantity());
  }

  /** Thêm vào giỏ hàng và chuyển ngay sang trang Giỏ hoa `/cart` */
  onBuyNow(): void {
    const item = this.product();
    if (!item) return;
    this.atelier.addToCart(item, this.quantity());
    void this.router.navigate(['/cart']);
  }

  /** Mở nhanh Ngăn kéo đặt hoa kèm Thiệp gấp 3D cho mẫu hoa hiện tại */
  onQuickOrderWithCard(): void {
    const item = this.product();
    if (!item) return;
    this.atelier.openOrderForApiProduct(item);
  }
}
