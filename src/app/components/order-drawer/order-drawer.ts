import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import {
  BouquetSize,
  ConfirmedOrder,
  DeliveryDayOption,
} from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';
import { IconComponent } from '../shared/icon/icon';

/** Mốc ngày giao hoa sắp tới dành cho bộ chọn chip 7 ngày (không dùng date picker gốc của OS) */
export interface UpcomingDateChip {
  /** Khóa định danh ngày ổn định (YYYY-MM-DD) */
  isoKey: string;
  /** Nhãn hiển thị ngắn gọn trên chip, ví dụ: 'Th 2, 23/11' */
  label: string;
  /** Thứ viết tắt tiếng Việt ('Th 2' .. 'Th 7', 'CN') */
  weekdayShort: string;
  /** Ngày/tháng định dạng 2 chữ số ('23/11') */
  dayMonth: string;
}

const ZALO_ATELIER_URL = 'https://zalo.me/0909123456';
const PANEL_CLOSE_DURATION_MS = 350;

/**
 * Ngăn kéo đặt hoa trượt từ mép phải ("Đặt hoa · FLEURÉ") kết hợp
 * Sân khấu xem trước Thiệp gấp 3D trực tiếp (Monogram F · FLEURÉ Saigon)
 * và bộ áp mã ưu đãi FLEURE20 / YEUHOA15 / FREESHIP60.
 *
 * Tuân thủ:
 * - Chuyển động trượt mượt GPU (`translateX(100%) -> translateX(0)`), giữ trong DOM kèm `[inert]` & `aria-hidden`
 * - Quy tắc I20: Bảo vệ dữ liệu đang nhập (chặn bấm nhầm nền tối khi đã điền tên/SĐT người nhận)
 * - Quy tắc I26 & R8: Nhãn `width: fit-content`, ô nhập `font-size: 16px`, vùng chạm >= 44x44px
 * - Zero native `<select>` / `<input type="date">`: Chip chọn nhanh 7 ngày tiếp theo
 */
@Component({
  selector: 'app-order-drawer',
  standalone: true,
  imports: [NgTemplateOutlet, IconComponent],
  templateUrl: './order-drawer.html',
  styleUrl: './order-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDrawer {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Tham chiếu phần tử panel chính để quản lý focus tiếp cận khi mở/đóng */
  readonly drawerPanelRef = viewChild<ElementRef<HTMLElement>>('drawerPanel');

  /** Tham chiếu vùng cuộn nội dung ngăn kéo để đưa về đầu trang khi hoàn tất đơn */
  readonly drawerBodyRef = viewChild<ElementRef<HTMLElement>>('drawerBody');

  /** Danh sách 7 ngày giao hoa kế tiếp (từ ngày kia: hôm nay + 2 đến + 8 ngày) */
  readonly upcomingDateChips: readonly UpcomingDateChip[] = this.buildUpcomingDateChips();

  /** Trạng thái thông báo đã sao chép nội dung đơn hàng vào bộ nhớ tạm */
  readonly copiedToast = signal<boolean>(false);

  /** Cờ bật/tắt khung đối soát nhanh các đơn đặt hoa mới nhất từ MongoDB */
  readonly showRecentOrders = signal<boolean>(false);

  /** Góc nghiêng 3D tương tác của thiệp FLEURÉ trên sân khấu trái (Desktop >= 1024px) */
  readonly cardRotateX = signal<number>(3);
  readonly cardRotateY = signal<number>(7);

  /** Nội dung lời chúc hiển thị trực tiếp trên thiệp gấp 3D */
  readonly previewCardMessage = computed<string>(
    () => this.atelier.cardMessage().trim() || 'Gói chút hoa, gửi chút thương.'
  );

  /** Tên người nhận hiển thị trực tiếp trên dòng ký thiệp 3D */
  readonly previewRecipientName = computed<string>(
    () => this.atelier.recipientName().trim() || 'Người thương'
  );

  /** Cảnh báo đỏ khi lời nhắn trên thiệp vượt quá 140 ký tự khuyến nghị */
  readonly isMessageOverLimit = computed<boolean>(
    () => this.atelier.cardMessage().length > 140
  );

  /** Biểu thức CSS transform 3D mượt cho thiệp FLEURÉ ở màn hình rộng */
  readonly card3dTransform = computed<string>(
    () => `perspective(1100px) rotateY(${this.cardRotateY()}deg) rotateX(${this.cardRotateX()}deg)`
  );

  /** Kiểm tra người dùng đã bắt đầu gõ thông tin người nhận chưa (phục vụ quy tắc I20) */
  readonly hasUnsavedRecipientInput = computed<boolean>(
    () =>
      !this.atelier.confirmedOrder() &&
      (this.atelier.recipientName().trim().length > 0 ||
        this.atelier.recipientPhone().trim().length > 0 ||
        this.atelier.recipientAddress().trim().length > 0)
  );

  private previouslyFocusedElement: HTMLElement | null = null;
  private unlockScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private wasOpen = false;

  constructor() {
    // Đồng bộ khóa cuộn trang, quản lý focus bàn phím và làm mới trạng thái toast khi mở/đóng ngăn kéo
    effect(() => {
      const isOpen = this.atelier.drawerOpen();
      if (!this.isBrowser) return;

      if (isOpen && !this.wasOpen) {
        this.wasOpen = true;
        this.copiedToast.set(false);
        this.resetCardTilt();

        if (this.unlockScrollTimer !== null) {
          clearTimeout(this.unlockScrollTimer);
          this.unlockScrollTimer = null;
        }

        const activeEl = document.activeElement;
        this.previouslyFocusedElement = activeEl instanceof HTMLElement ? activeEl : null;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        // Đưa tiêu điểm bàn phím vào khung dialog mà không bật bàn phím ảo đột ngột trên di động
        queueMicrotask(() => {
          this.drawerPanelRef()?.nativeElement.focus({ preventScroll: true });
        });
      } else if (!isOpen && this.wasOpen) {
        this.wasOpen = false;
        this.copiedToast.set(false);

        // Chờ hiệu ứng trượt đóng (350ms) hoàn tất mới trả lại thanh cuộn để nền không bị giật ngang
        this.unlockScrollTimer = setTimeout(() => {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          this.unlockScrollTimer = null;
        }, PANEL_CLOSE_DURATION_MS);

        const returnEl = this.previouslyFocusedElement;
        this.previouslyFocusedElement = null;
        if (returnEl && returnEl.isConnected) {
          queueMicrotask(() => {
            returnEl.focus({ preventScroll: true });
          });
        }
      }
    });

    // Dọn dẹp khóa cuộn trang an toàn khi hủy component
    this.destroyRef.onDestroy(() => {
      if (!this.isBrowser) return;
      if (this.unlockScrollTimer !== null) {
        clearTimeout(this.unlockScrollTimer);
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    });
  }

  /** Đóng ngăn kéo khi nhấn phím Escape trên bàn phím */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (!this.atelier.drawerOpen()) return;
    event.preventDefault();
    this.atelier.closeDrawer();
  }

  /** Giữ vòng lặp phím Tab / Shift+Tab nằm gọn bên trong #drawerPanel khi ngăn kéo đang mở */
  onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.atelier.drawerOpen() || !this.isBrowser) {
      return;
    }
    const panel = this.drawerPanelRef()?.nativeElement;
    if (!panel) return;

    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);

    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || active === panel || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (!active || active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Xử lý bấm ra vùng nền mờ bên ngoài ngăn kéo:
   * - Nếu chưa nhập Tên hoặc SĐT người nhận (hoặc đơn đã xác nhận xong): cho phép đóng nhanh.
   * - Nếu đang điền dở Tên/SĐT người nhận: giữ nguyên theo quy tắc I20 để tránh mất dữ liệu lỡ tay.
   */
  onBackdropClick(): void {
    if (this.hasUnsavedRecipientInput()) {
      return;
    }
    this.atelier.closeDrawer();
  }

  /** Nghiêng nhẹ thiệp 3D theo tọa độ chuột trên vùng sân khấu Desktop (`rotateX` -6..6, `rotateY` -8..8) */
  onStageMouseMove(event: MouseEvent): void {
    if (!this.isBrowser || this.prefersReducedMotion()) {
      return;
    }
    const stageEl = event.currentTarget as HTMLElement | null;
    if (!stageEl) return;

    const rect = stageEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const normX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));

    this.cardRotateY.set(Number((normX * 8).toFixed(2)));
    this.cardRotateX.set(Number((-normY * 6).toFixed(2)));
  }

  /** Đưa góc nghiêng thiệp 3D về tư thế trưng bày mặc định */
  resetCardTilt(): void {
    this.cardRotateX.set(3);
    this.cardRotateY.set(7);
  }

  selectSize(size: BouquetSize): void {
    this.atelier.selectedSize.set(size);
  }

  selectDeliveryDay(day: DeliveryDayOption): void {
    this.atelier.deliveryDay.set(day);
    if (day !== 'Chọn ngày' && this.atelier.drawerValidationError()) {
      this.atelier.drawerValidationError.set(null);
    }
  }

  selectCustomDate(label: string): void {
    this.atelier.customDeliveryDate.set(label);
    if (this.atelier.drawerValidationError()) {
      this.atelier.drawerValidationError.set(null);
    }
  }

  selectTimeSlot(slot: string): void {
    this.atelier.selectedTimeSlot.set(slot);
  }

  onCardMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.atelier.cardMessage.set(target.value);
  }

  applyGreetingSuggestion(suggestion: string): void {
    this.atelier.cardMessage.set(suggestion);
  }

  onVoucherInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.atelier.voucherInput.set(target.value.toUpperCase());
    if (this.atelier.voucherError()) {
      this.atelier.voucherError.set(null);
    }
  }

  onApplyVoucher(code?: string): void {
    this.atelier.applyVoucher(code);
  }

  onClearVoucher(): void {
    this.atelier.clearVoucher();
  }

  onRecipientNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.atelier.recipientName.set(target.value);
    if (target.value.trim().length >= 2 && this.atelier.drawerValidationError()) {
      this.atelier.drawerValidationError.set(null);
    }
    if (this.atelier.submitOrderError()) {
      this.atelier.submitOrderError.set(null);
    }
  }

  onRecipientPhoneInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.atelier.recipientPhone.set(target.value);
    if (this.atelier.drawerValidationError()) {
      this.atelier.drawerValidationError.set(null);
    }
    if (this.atelier.submitOrderError()) {
      this.atelier.submitOrderError.set(null);
    }
  }

  onRecipientAddressInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.atelier.recipientAddress.set(target.value);
    if (target.value.trim().length >= 5 && this.atelier.drawerValidationError()) {
      this.atelier.drawerValidationError.set(null);
    }
    if (this.atelier.submitOrderError()) {
      this.atelier.submitOrderError.set(null);
    }
  }

  /** Xác thực thông tin người nhận và gửi đơn lưu thật vào MongoDB (`POST /api/orders`) */
  onSubmitOrder(): void {
    this.copiedToast.set(false);
    const started = this.atelier.submitOrderToApi(() => {
      this.scrollDrawerToTop();
    });
    if (!started && this.isBrowser) {
      this.focusFirstInvalidRecipientField();
    }
  }

  /** Chỉ dùng khi mất kết nối mạng/Render: tạo phiếu tạm gửi Zalo (không lưu MongoDB) */
  onSubmitOfflineFallback(): void {
    this.copiedToast.set(false);
    const confirmed = this.atelier.submitOfflineZaloFallback();
    if (confirmed) {
      this.scrollDrawerToTop();
    }
  }

  /** Bật/tắt danh sách 5 đơn đặt hoa gần nhất đang lưu trong MongoDB */
  toggleRecentOrders(): void {
    const next = !this.showRecentOrders();
    this.showRecentOrders.set(next);
    if (next) {
      this.atelier.loadRecentOrdersFromApi();
    }
  }

  /** Sao chép nội dung đơn vào clipboard và mở cửa sổ Zalo FLEURÉ */
  copyAndOpenZalo(order: ConfirmedOrder): void {
    this.writeTextToClipboard(order.zaloShareText);
    this.copiedToast.set(true);

    if (this.isBrowser) {
      window.open(ZALO_ATELIER_URL, '_blank', 'noopener,noreferrer');
    }
  }

  /** Chỉ sao chép mã & chi tiết đơn hàng vào bộ nhớ tạm */
  copyOrderTextOnly(order: ConfirmedOrder): void {
    this.writeTextToClipboard(order.zaloShareText);
    this.copiedToast.set(true);
  }

  /** Quay lại biểu mẫu cấu hình để đặt thêm một bó hoa khác */
  onOrderAnotherBouquet(): void {
    this.copiedToast.set(false);
    this.atelier.resetConfirmedOrder();
    this.scrollDrawerToTop();
  }

  /** Kiểm tra người dùng có bật chế độ giảm chuyển động của hệ điều hành hay không */
  private prefersReducedMotion(): boolean {
    if (!this.isBrowser || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Ghi văn bản vào Clipboard có nhánh dự phòng an toàn cho trình duyệt di động */
  private writeTextToClipboard(text: string): void {
    if (!this.isBrowser) return;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(() => {
        this.fallbackCopyText(text);
      });
      return;
    }

    this.fallbackCopyText(text);
  }

  private fallbackCopyText(text: string): void {
    if (!this.isBrowser) return;
    try {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
    } catch {
      // Bỏ qua an toàn trong môi trường kiểm thử không hỗ trợ execCommand
    }
  }

  /** Đưa tiêu điểm vào ô thông tin người nhận bị thiếu đầu tiên trong ngăn kéo (chỉ cuộn #drawerBody) */
  private focusFirstInvalidRecipientField(): void {
    const err = this.atelier.drawerValidationError();
    if (!err) return;
    let targetId: string | null = null;
    if (err.includes('tên người nhận')) {
      targetId = 'recipient-name-input';
    } else if (err.includes('số điện thoại')) {
      targetId = 'recipient-phone-input';
    } else if (err.includes('địa chỉ giao hoa')) {
      targetId = 'recipient-address-input';
    }
    if (!targetId) return;
    queueMicrotask(() => {
      const bodyEl = this.drawerBodyRef()?.nativeElement;
      if (bodyEl) {
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }
      const el = document.getElementById(targetId);
      if (el instanceof HTMLElement) {
        el.focus({ preventScroll: true });
      }
    });
  }

  private scrollDrawerToTop(): void {
    if (!this.isBrowser) return;
    queueMicrotask(() => {
      const bodyEl = this.drawerBodyRef()?.nativeElement;
      if (!bodyEl) return;
      if (typeof bodyEl.scrollTo === 'function') {
        bodyEl.scrollTo({
          top: 0,
          behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        });
      } else {
        bodyEl.scrollTop = 0;
      }
    });
  }

  /** Khởi tạo động 7 ngày sắp tới (từ hôm nay + 2 đến + 8 ngày) theo định dạng tiếng Việt */
  private buildUpcomingDateChips(): readonly UpcomingDateChip[] {
    const weekdayLabels = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'] as const;
    const baseDate = new Date();
    const chips: UpcomingDateChip[] = [];

    for (let offset = 2; offset <= 8; offset++) {
      const target = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate() + offset
      );
      const weekdayShort = weekdayLabels[target.getDay()] ?? 'Th 2';
      const day = String(target.getDate()).padStart(2, '0');
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const year = target.getFullYear();
      const dayMonth = `${day}/${month}`;

      chips.push({
        isoKey: `${year}-${month}-${day}`,
        label: `${weekdayShort}, ${dayMonth}`,
        weekdayShort,
        dayMonth,
      });
    }

    return chips;
  }
}
