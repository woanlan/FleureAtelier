import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../components/shared/icon/icon';
import {
  ApiCreateOrderPayload,
  ApiSavedOrder,
  VoucherCode,
  VoucherFeedback,
} from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

const FREE_SHIPPING_THRESHOLD = 399000;
const STANDARD_SHIPPING_FEE = 25000;
const FLEURE20_MIN_SUBTOTAL = 450000;

/**
 * Trang Giỏ Hoa Đa Món & Đặt Đơn Trực Tiếp Lên MongoDB (`/cart`).
 * - Thiết kế nguyên bản Mobile-First 375px – 430px liền mạch 1 cột.
 * - Tự động nhận mã ưu đãi qua query param `?voucher=` khi bấm từ trang `/promotions`.
 * - Đồng bộ chính xác quy tắc giảm giá & phí giao hỏa tốc 60p với Backend `asm/be` (`POST /api/orders`).
 */
@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, IconComponent],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly atelier = inject(AtelierService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private querySub: Subscription | null = null;
  private orderSub: Subscription | null = null;
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  /** Ngưỡng miễn phí giao hỏa tốc 60 phút nội thành TP.HCM */
  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  // --- Trạng thái mã ưu đãi ---
  readonly voucherInput = signal<string>('');
  readonly appliedVoucherCode = signal<VoucherCode | null>(null);
  readonly voucherError = signal<string | null>(null);

  // --- Trạng thái biểu mẫu thông tin nhận hoa ---
  readonly fullName = signal<string>('');
  readonly phone = signal<string>('');
  readonly address = signal<string>('');
  readonly note = signal<string>('');
  readonly validationError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);

  // --- Trạng thái đơn đã đặt thành công & đối soát đơn gần nhất ---
  readonly confirmedOrder = signal<ApiSavedOrder | null>(null);
  readonly copiedZalo = signal<boolean>(false);
  readonly showRecentOrders = signal<boolean>(false);

  /** Số tiền còn thiếu để đạt mức miễn phí giao hàng 399.000đ */
  readonly freeShipRemaining = computed<number>(() =>
    Math.max(0, FREE_SHIPPING_THRESHOLD - this.atelier.cartSubtotal())
  );

  /** Phần trăm tiến độ thanh Freeship (0 – 100%) */
  readonly freeShipProgress = computed<number>(() => {
    if (this.appliedVoucherCode() === 'FREESHIP60') {
      return 100;
    }
    const ratio = (this.atelier.cartSubtotal() / FREE_SHIPPING_THRESHOLD) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  });

  /** Đã mở khóa miễn phí giao hỏa tốc 60p hay chưa */
  readonly isFreeShippingUnlocked = computed<boolean>(
    () =>
      this.appliedVoucherCode() === 'FREESHIP60' ||
      this.atelier.cartSubtotal() >= FREE_SHIPPING_THRESHOLD
  );

  /** Số tiền giảm theo mã ưu đãi (khớp 100% logic Backend `asm/be`) */
  readonly voucherDiscount = computed<number>(() => {
    const code = this.appliedVoucherCode();
    const subtotal = this.atelier.cartSubtotal();
    if (code === 'FLEURE20') {
      return subtotal >= FLEURE20_MIN_SUBTOTAL ? Math.round(subtotal * 0.2) : 0;
    }
    if (code === 'YEUHOA15') {
      return Math.round(subtotal * 0.15);
    }
    return 0;
  });

  /** Phí giao hỏa tốc 60p: 0đ nếu dùng FREESHIP60 hoặc tạm tính >= 399.000đ, ngược lại 25.000đ */
  readonly shippingFee = computed<number>(() => {
    const subtotal = this.atelier.cartSubtotal();
    if (subtotal <= 0) {
      return 0;
    }
    if (this.appliedVoucherCode() === 'FREESHIP60' || subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return STANDARD_SHIPPING_FEE;
  });

  /** Tổng thanh toán cuối cùng */
  readonly grandTotal = computed<number>(() =>
    Math.max(0, this.atelier.cartSubtotal() - this.voucherDiscount() + this.shippingFee())
  );

  /** Phản hồi màu xanh / đỏ cho khu vực mã ưu đãi */
  readonly voucherFeedback = computed<VoucherFeedback | null>(() => {
    const err = this.voucherError();
    if (err) {
      return { status: 'error', text: err };
    }

    const code = this.appliedVoucherCode();
    if (!code) {
      return null;
    }

    if (code === 'FLEURE20') {
      const subtotal = this.atelier.cartSubtotal();
      if (subtotal < FLEURE20_MIN_SUBTOTAL) {
        const missing = FLEURE20_MIN_SUBTOTAL - subtotal;
        return {
          status: 'error',
          text: `Mã FLEURE20 áp dụng cho đơn từ 450.000đ (còn thiếu ${this.atelier.formatVnd(missing)}).`,
        };
      }
      return {
        status: 'success',
        text: `Đã áp dụng FLEURE20: giảm ${this.atelier.formatVnd(this.voucherDiscount())}.`,
      };
    }

    if (code === 'YEUHOA15') {
      return {
        status: 'success',
        text: `Đã áp dụng YEUHOA15: giảm ${this.atelier.formatVnd(this.voucherDiscount())}.`,
      };
    }

    return {
      status: 'success',
      text: 'Đã áp dụng FREESHIP60: miễn phí giao hỏa tốc 60 phút nội thành TP.HCM.',
    };
  });

  constructor() {
    // Hủy toàn bộ subscription & timer khi rời trang để tránh rò rỉ bộ nhớ
    this.destroyRef.onDestroy(() => {
      this.querySub?.unsubscribe();
      this.orderSub?.unsubscribe();
      if (this.copyResetTimer !== null) {
        clearTimeout(this.copyResetTimer);
      }
    });

    // Đọc query param `?voucher=` (khi người dùng chuyển từ trang Ưu đãi `/promotions`)
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const rawCode = params.get('voucher')?.trim().toUpperCase();
      if (!rawCode) {
        return;
      }
      this.voucherInput.set(rawCode);
      if (this.atelier.cartItems().length > 0) {
        this.applyVoucher(rawCode);
      }
    });
  }

  onVoucherInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.voucherInput.set((target?.value ?? '').toUpperCase());
    if (this.voucherError()) {
      this.voucherError.set(null);
    }
  }

  onVoucherEnter(event: Event): void {
    event.preventDefault();
    this.applyVoucher();
  }

  /** Áp dụng mã ưu đãi FLEURÉ theo đúng quy tắc Backend */
  applyVoucher(code?: string): void {
    const normalized = (code ?? this.voucherInput()).trim().toUpperCase();
    this.voucherInput.set(normalized);

    if (!normalized) {
      this.appliedVoucherCode.set(null);
      this.voucherError.set('Vui lòng nhập hoặc chọn một mã ưu đãi FLEURÉ.');
      return;
    }

    if (normalized === 'FLEURE20') {
      if (this.atelier.cartSubtotal() < FLEURE20_MIN_SUBTOTAL) {
        this.appliedVoucherCode.set(null);
        const missing = FLEURE20_MIN_SUBTOTAL - this.atelier.cartSubtotal();
        this.voucherError.set(
          `Mã FLEURE20 chỉ áp dụng cho đơn từ 450.000đ (còn thiếu ${this.atelier.formatVnd(missing)}).`
        );
        return;
      }
      this.appliedVoucherCode.set('FLEURE20');
      this.voucherError.set(null);
      return;
    }

    if (normalized === 'YEUHOA15') {
      this.appliedVoucherCode.set('YEUHOA15');
      this.voucherError.set(null);
      return;
    }

    if (normalized === 'FREESHIP60') {
      this.appliedVoucherCode.set('FREESHIP60');
      this.voucherError.set(null);
      return;
    }

    this.appliedVoucherCode.set(null);
    this.voucherError.set(
      `Mã "${normalized}" chưa hợp lệ. Gợi ý: FLEURE20, YEUHOA15 hoặc FREESHIP60.`
    );
  }

  /** Chọn nhanh hoặc bỏ chọn chip mã ưu đãi */
  toggleVoucherChip(code: VoucherCode): void {
    if (this.appliedVoucherCode() === code) {
      this.clearVoucher();
      return;
    }
    this.applyVoucher(code);
  }

  /** Gỡ mã ưu đãi đang áp dụng */
  clearVoucher(): void {
    this.voucherInput.set('');
    this.appliedVoucherCode.set(null);
    this.voucherError.set(null);
  }

  onFullNameInput(event: Event): void {
    this.fullName.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.clearFormErrors();
  }

  onPhoneInput(event: Event): void {
    this.phone.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.clearFormErrors();
  }

  onAddressInput(event: Event): void {
    this.address.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.clearFormErrors();
  }

  onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement | null)?.value ?? '');
  }

  /** Xác thực 4 trường thông tin và gửi đơn đặt hoa đa món lên MongoDB (`POST /api/orders`) */
  onSubmitOrder(event: Event): void {
    event.preventDefault();
    if (this.submitting() || this.atelier.cartItems().length === 0) {
      return;
    }

    const cleanName = this.fullName().trim();
    if (cleanName.length < 2) {
      this.validationError.set('Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự).');
      return;
    }

    const normalizedPhone = this.phone().replace(/[\s.-]/g, '');
    if (!/^(0|\+84)\d{8,10}$/.test(normalizedPhone)) {
      this.validationError.set(
        'Vui lòng nhập số điện thoại hợp lệ (9 – 11 chữ số, bắt đầu bằng 0 hoặc +84).'
      );
      return;
    }

    const cleanAddress = this.address().trim();
    if (cleanAddress.length < 5) {
      this.validationError.set(
        'Vui lòng nhập địa chỉ giao hoa đầy đủ (tối thiểu 5 ký tự gồm số nhà, tên đường, quận).'
      );
      return;
    }

    const cleanNote = this.note().trim();
    const rawCode = this.appliedVoucherCode();
    const effectiveVoucher =
      rawCode === 'FLEURE20' && this.voucherDiscount() === 0 ? null : rawCode;

    const payload: ApiCreateOrderPayload = {
      customer: {
        fullName: cleanName,
        phone: normalizedPhone,
        address: cleanAddress,
        ...(cleanNote ? { note: cleanNote } : {}),
      },
      items: this.atelier.cartItems().map((entry) => ({
        productId: entry.product.id,
        quantity: entry.quantity,
      })),
      voucherCode: effectiveVoucher,
    };

    this.validationError.set(null);
    this.submitError.set(null);
    this.submitting.set(true);
    this.orderSub?.unsubscribe();

    this.orderSub = this.atelier.placeCartOrder(payload).subscribe({
      next: (savedOrder) => {
        this.submitting.set(false);
        this.confirmedOrder.set(savedOrder);
        this.copiedZalo.set(false);
        this.clearVoucher();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const serverMessage =
          err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
            ? err.error.message
            : null;
        this.submitError.set(
          serverMessage ||
            'Không thể gửi đơn đặt hoa lên MongoDB lúc này. Vui lòng kiểm tra kết nối và thử lại.'
        );
      },
    });
  }

  /** Sao chép nội dung đơn đã xác nhận để dán gửi nhanh qua Zalo FLEURÉ */
  copyOrderForZalo(order: ApiSavedOrder): void {
    const text = this.buildZaloShareText(order);

    if (this.isBrowser) {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(text).catch(() => this.fallbackCopyText(text));
      } else {
        this.fallbackCopyText(text);
      }
    }

    this.copiedZalo.set(true);
    this.atelier.showToast('Đã sao chép nội dung đơn hoa để gửi Zalo FLEURÉ.');

    if (this.isBrowser) {
      if (this.copyResetTimer !== null) {
        clearTimeout(this.copyResetTimer);
      }
      this.copyResetTimer = setTimeout(() => {
        this.copiedZalo.set(false);
      }, 3600);
    }
  }

  /** Bật/tắt danh sách 5 đơn đặt hoa gần nhất từ `GET /api/orders` */
  toggleRecentOrders(): void {
    const nextOpen = !this.showRecentOrders();
    this.showRecentOrders.set(nextOpen);
    if (nextOpen && this.isBrowser) {
      this.atelier.loadRecentOrdersFromApi();
    }
  }

  /** Tính tổng số bó hoa trong một đơn hàng đã lưu */
  countOrderQuantity(order: ApiSavedOrder): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private clearFormErrors(): void {
    if (this.validationError()) {
      this.validationError.set(null);
    }
    if (this.submitError()) {
      this.submitError.set(null);
    }
  }

  private buildZaloShareText(order: ApiSavedOrder): string {
    const lines: string[] = [
      `[FLEURÉ FLOWER BOUTIQUE — ĐƠN ĐẶT HOA #${order.orderCode}]`,
      `• Trạng thái: ${order.status || 'Đã tiếp nhận'} (Đã lưu MongoDB)`,
      `• Người nhận: ${order.customer.fullName} · ${order.customer.phone}`,
      `• Địa chỉ giao: ${order.customer.address}`,
    ];

    if (order.customer.note?.trim()) {
      lines.push(`• Lời chúc / Ghi chú: ${order.customer.note.trim()}`);
    }

    lines.push('• Danh sách bó hoa:');
    for (const item of order.items) {
      const rowTotal = item.priceValue * item.quantity;
      lines.push(`  - ${item.name} × ${item.quantity}: ${this.atelier.formatVnd(rowTotal)}`);
    }

    lines.push(`• Tạm tính: ${this.atelier.formatVnd(order.subtotal)}`);

    if (order.voucherCode && order.discountAmount > 0) {
      lines.push(
        `• Mã ưu đãi (${order.voucherCode}): −${this.atelier.formatVnd(order.discountAmount)}`
      );
    }

    lines.push(
      `• Phí giao hỏa tốc 60p: ${order.shippingFee === 0 ? 'Miễn phí' : this.atelier.formatVnd(order.shippingFee)}`,
      `• Tổng thanh toán: ${this.atelier.formatVnd(order.grandTotal)}`,
      '• Cửa hàng: FLEURÉ Flower Boutique · 45 Nguyễn Huệ, Q.1, TP.HCM · Zalo: 0909 123 456'
    );

    return lines.join('\n');
  }

  private fallbackCopyText(text: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      // Bỏ qua an toàn nếu trình duyệt không hỗ trợ lệnh copy thủ công
    }
  }
}
