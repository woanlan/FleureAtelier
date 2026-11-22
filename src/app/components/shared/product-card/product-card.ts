import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiProduct } from '../../../models/atelier.models';
import { IconComponent } from '../icon/icon';

/**
 * Component thẻ sản phẩm hoa tái sử dụng (`<app-product-card>`).
 * - Minh họa chuẩn Angular 22: `input.required<ApiProduct>()`, `output<ApiProduct>()`, `computed()`, `DecimalPipe`.
 * - Đồng bộ nhận diện FLEURÉ: nền thẻ trắng ngà tinh tế, viền `--border-subtle`, nút Ruby tương phản >= 7:1.
 * - Hỗ trợ 2 hành động trực tiếp: Thêm vào giỏ hàng đa món (`addToCart`) & Đặt nhanh kèm Thiệp 3D (`quickOrder`).
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe, IconComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  /** Dữ liệu sản phẩm hoa bắt buộc truyền từ component cha */
  readonly product = input.required<ApiProduct>();

  /** Phát sự kiện khi người dùng bấm "Thêm vào giỏ" */
  readonly addToCart = output<ApiProduct>();

  /** Phát sự kiện khi người dùng bấm "Đặt nhanh (Thiệp 3D)" */
  readonly quickOrder = output<ApiProduct>();

  /** Có hiển thị giá gốc gạch ngang hay không */
  readonly hasOldPrice = computed<boolean>(() => {
    const item = this.product();
    return item.oldPriceValue > item.priceValue;
  });

  /** Nhãn huy hiệu hiển thị ở góc trái ảnh (ưu tiên badge từ MongoDB hoặc % giảm giá) */
  readonly badgeLabel = computed<string | null>(() => {
    const item = this.product();
    if (item.badge?.trim()) return item.badge.trim();
    if (item.discount > 0) return `-${item.discount}%`;
    return null;
  });

  /** Phân biệt kiểu huy hiệu giảm giá (Ruby đậm) so với mẫu mới (Hồng phấn viền Ruby) */
  readonly isSaleBadge = computed<boolean>(() => {
    const item = this.product();
    return item.discount > 0 || item.badgeClass === 'label-sale';
  });

  onAddToCart(): void {
    this.addToCart.emit(this.product());
  }

  onQuickOrder(): void {
    this.quickOrder.emit(this.product());
  }
}
