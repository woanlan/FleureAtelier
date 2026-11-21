import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Subscription, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ADDON_OPTIONS,
  DALAT_SEASONAL_FLOWERS,
  DEFAULT_STARTER_STEMS,
  DELIVERY_DAY_OPTIONS,
  DELIVERY_TIME_SLOTS,
  EXTRA_OCCASIONS_BY_PRODUCT_ID,
  FEATURED_HANGING_PRODUCT_IDS,
  FLOWER_STEMS,
  GREETING_SUGGESTIONS,
  LEGACY_BOUQUET_TO_PRODUCT_ID,
  OCCASION_HERO_PRODUCT_ID,
  OCCASION_THEMES,
  SIGNATURE_BOUQUETS,
  STUDIO_CUTOUT_BY_CATEGORY_SLUG,
  STUDIO_CUTOUT_BY_PRODUCT_ID,
  VOUCHER_OPTIONS,
  WRAP_PAPERS,
} from '../data/atelier-catalog';
import {
  AddonOption,
  ApiCreateOrderPayload,
  ApiProduct,
  ApiSavedOrder,
  BOUQUET_SIZE_DELTAS,
  BOUQUET_SIZE_OPTIONS,
  BouquetItem,
  BouquetSize,
  CatalogSyncStatus,
  ConfirmedOrder,
  DeliveryDayOption,
  OccasionId,
  OccasionTheme,
  OrderSource,
  SelectedStemEntry,
  VoucherCode,
  VoucherFeedback,
  WrapPaperId,
  WrapPaperOption,
} from '../models/atelier.models';

const STORAGE_KEY_STEMS = 'fleure-boutique:custom-stems:v1';
const STORAGE_KEY_WRAP = 'fleure-boutique:custom-wrap:v1';
const MAX_STEMS_PER_VARIETY = 30;
const MIN_CUSTOM_BOUQUET_STEMS = 3;
const FREE_SHIPPING_THRESHOLD = 399000;
const STANDARD_SHIPPING_FEE = 25000;
const FLEURE20_MIN_SUBTOTAL = 450000;
const API_TIMEOUT_MS = 35000;
const SLOW_SERVER_HINT_DELAY_MS = 2500;
const DEFAULT_CUSTOM_BASE_PRODUCT_ID = 12;

const VALID_OCCASION_IDS: ReadonlySet<string> = new Set<OccasionId>([
  'hoa-sinh-nhat',
  'hoa-tinh-yeu',
  'hoa-chuc-mung',
  'hoa-cuoi',
  'lan-ho-diep',
  'gui-loi-cam-on',
]);

/**
 * Signals State Store & REST API Client trung tâm cho "FLEURÉ — Flower Boutique":
 * 1. Đồng bộ danh mục bó hoa trực tiếp từ Backend Render / MongoDB (`GET /api/products`) với dữ liệu dự phòng tức thì.
 * 2. Phòng trưng bày hoa treo (Hanging Gallery Carousel) & Bộ chuyển đổi dịp tặng (Occasion Switcher).
 * 3. Bàn tự phối hoa (Custom Bouquet Builder + lưu trữ localStorage an toàn SSR).
 * 4. Ngăn kéo đặt hoa, Mã ưu đãi, Phí giao hỏa tốc 60p TP.HCM, Thiệp gấp 3D, lưu đơn thật (`POST /api/orders`) & đối soát (`GET /api/orders`).
 */
@Injectable({ providedIn: 'root' })
export class AtelierService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private catalogSub: Subscription | null = null;
  private submitOrderSub: Subscription | null = null;
  private recentOrdersSub: Subscription | null = null;
  private slowNoticeTimer: ReturnType<typeof setTimeout> | null = null;

  // =========================================================================
  // 1. DANH MỤC SẢN PHẨM ĐỒNG BỘ TỪ MONGODB + TÀI NGUYÊN CỬA HÀNG
  // =========================================================================
  readonly bouquets = signal<readonly BouquetItem[]>(SIGNATURE_BOUQUETS);
  readonly catalogStatus = signal<CatalogSyncStatus>('loading');
  readonly catalogError = signal<string | null>(null);
  readonly catalogCount = computed<number>(() => this.bouquets().length);

  readonly occasions = OCCASION_THEMES;
  readonly stems = FLOWER_STEMS;
  readonly wrapPapers = WRAP_PAPERS;
  readonly addons = ADDON_OPTIONS;
  readonly vouchers = VOUCHER_OPTIONS;
  readonly seasonalFlowers = DALAT_SEASONAL_FLOWERS;
  readonly deliveryDayOptions = DELIVERY_DAY_OPTIONS;
  readonly timeSlots = DELIVERY_TIME_SLOTS;
  readonly greetingSuggestions = GREETING_SUGGESTIONS;
  readonly sizeOptions = BOUQUET_SIZE_OPTIONS;
  readonly sizeDeltas = BOUQUET_SIZE_DELTAS;

  // =========================================================================
  // 2. TRẠNG THÁI PHÒNG TRƯNG BÀY HOA TREO (HANGING GALLERY)
  // =========================================================================
  readonly hangingBouquets = computed<readonly BouquetItem[]>(() => {
    const all = this.bouquets();
    const featured = all.filter((item) => item.featuredInHanging);
    if (featured.length === 0) {
      return all.slice(0, 7);
    }

    const orderMap = new Map(FEATURED_HANGING_PRODUCT_IDS.map((id, idx) => [id, idx]));
    return [...featured].sort((a, b) => {
      const rankA = orderMap.get(a.apiProductId) ?? 999;
      const rankB = orderMap.get(b.apiProductId) ?? 999;
      return rankA - rankB;
    });
  });

  readonly activeHangingIndex = signal<number>(0);

  readonly activeHangingBouquet = computed<BouquetItem>(() => {
    const items = this.hangingBouquets();
    const fallback = this.bouquets()[0] ?? SIGNATURE_BOUQUETS[0];
    if (items.length === 0) return fallback;
    const safeIndex = ((this.activeHangingIndex() % items.length) + items.length) % items.length;
    return items[safeIndex] ?? fallback;
  });

  selectHanging(index: number): void {
    const total = this.hangingBouquets().length;
    if (total === 0) return;
    const normalized = ((index % total) + total) % total;
    this.activeHangingIndex.set(normalized);
  }

  nextHanging(): void {
    this.selectHanging(this.activeHangingIndex() + 1);
  }

  prevHanging(): void {
    this.selectHanging(this.activeHangingIndex() - 1);
  }

  // =========================================================================
  // 3. TRẠNG THÁI CHỦ ĐỀ DỊP TẶNG (OCCASION SWITCHER)
  // =========================================================================
  readonly selectedOccasionId = signal<OccasionId>('hoa-sinh-nhat');

  readonly activeOccasion = computed<OccasionTheme>(() => {
    const currentId = this.selectedOccasionId();
    return this.occasions.find((occ) => occ.id === currentId) ?? this.occasions[0];
  });

  readonly activeOccasionHeroBouquet = computed<BouquetItem>(() => {
    const occasion = this.activeOccasion();
    const list = this.bouquets();
    const targetProductId = OCCASION_HERO_PRODUCT_ID[occasion.id];
    return (
      list.find((b) => b.apiProductId === targetProductId) ??
      list.find((b) => b.id === occasion.heroBouquetId) ??
      this.occasionBouquets()[0] ??
      list[0] ??
      SIGNATURE_BOUQUETS[0]
    );
  });

  /** Trả về đúng 4 bó hoa tuyển chọn cho dịp đang chọn (ưu tiên bó tâm điểm và cùng danh mục MongoDB) */
  readonly occasionBouquets = computed<BouquetItem[]>(() => {
    const occasion = this.activeOccasion();
    const all = this.bouquets();
    const targetProductId = OCCASION_HERO_PRODUCT_ID[occasion.id];

    const primary = all.filter((b) => b.categorySlug === occasion.id);
    const secondary = all.filter(
      (b) => b.categorySlug !== occasion.id && b.occasionIds.includes(occasion.id)
    );
    const others = all.filter(
      (b) => b.categorySlug !== occasion.id && !b.occasionIds.includes(occasion.id)
    );

    const seen = new Set<string>();
    const combined: BouquetItem[] = [];
    for (const item of [...primary, ...secondary, ...others]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }

    combined.sort((a, b) => {
      const aHero = a.apiProductId === targetProductId || a.id === occasion.heroBouquetId;
      const bHero = b.apiProductId === targetProductId || b.id === occasion.heroBouquetId;
      if (aHero && !bHero) return -1;
      if (!aHero && bHero) return 1;
      const aPrimary = a.categorySlug === occasion.id;
      const bPrimary = b.categorySlug === occasion.id;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return (b.sold ?? 0) - (a.sold ?? 0);
    });

    return combined.slice(0, 4);
  });

  selectOccasion(id: OccasionId): void {
    this.selectedOccasionId.set(id);
  }

  /** Tìm bó hoa theo slug, id cũ của lịch mùa hoa hoặc mã số MongoDB */
  findBouquetByRef(refId: string): BouquetItem {
    const list = this.bouquets();
    const mappedProductId = LEGACY_BOUQUET_TO_PRODUCT_ID[refId];
    return (
      list.find((item) => item.id === refId) ??
      (mappedProductId !== undefined
        ? list.find((item) => item.apiProductId === mappedProductId)
        : undefined) ??
      list.find((item) => String(item.apiProductId) === refId) ??
      list[0] ??
      SIGNATURE_BOUQUETS[0]
    );
  }

  // =========================================================================
  // 4. TRẠNG THÁI BÀN TỰ BÓ HOA (CUSTOM BOUQUET BUILDER)
  // =========================================================================
  readonly stemCounts = signal<Record<string, number>>(this.loadInitialStemCounts());
  readonly selectedWrapId = signal<WrapPaperId>(this.loadInitialWrapId());
  readonly customBuilderError = signal<string | null>(null);

  readonly selectedWrap = computed<WrapPaperOption>(() => {
    const wrapId = this.selectedWrapId();
    return this.wrapPapers.find((w) => w.id === wrapId) ?? this.wrapPapers[0];
  });

  /** Danh sách các loại cành có số lượng > 0 kèm thành tiền từng loại */
  readonly selectedStemEntries = computed<SelectedStemEntry[]>(() => {
    const counts = this.stemCounts();
    const entries: SelectedStemEntry[] = [];
    for (const stem of this.stems) {
      const count = counts[stem.id] ?? 0;
      if (count > 0) {
        entries.push({
          stem,
          count,
          subtotal: count * stem.pricePerStem,
        });
      }
    }
    return entries;
  });

  /** Tổng số cành hoa hiện có trong bó tự phối */
  readonly totalCustomStems = computed<number>(() =>
    this.selectedStemEntries().reduce((sum, entry) => sum + entry.count, 0)
  );

  /** Tổng tiền riêng phần hoa cắt cành (chưa cộng giấy gói) */
  readonly customStemsSubtotal = computed<number>(() =>
    this.selectedStemEntries().reduce((sum, entry) => sum + entry.subtotal, 0)
  );

  /** Tổng thành tiền bó hoa tự phối (bằng 0đ nếu người dùng chưa chọn cành nào) */
  readonly customBouquetTotal = computed<number>(() => {
    const stemsTotal = this.customStemsSubtotal();
    if (stemsTotal === 0) {
      return 0;
    }
    return stemsTotal + this.selectedWrap().price;
  });

  /** Chuỗi mô tả ngắn thành phần bó tự phối dùng cho tóm tắt đơn & Zalo */
  readonly customStemsSummary = computed<string>(() => {
    const entries = this.selectedStemEntries();
    if (entries.length === 0) {
      return 'Chưa chọn cành hoa nào';
    }
    const stemsText = entries.map((e) => `${e.count} ${e.stem.name}`).join(', ');
    const wrapName = this.selectedWrap().name;
    const wrapLabel = wrapName.startsWith('Giấy') ? wrapName : `Giấy ${wrapName}`;
    return `${stemsText} · ${wrapLabel}`;
  });

  constructor() {
    // Dọn dẹp toàn bộ subscription và bộ đếm thời gian khi service bị hủy
    this.destroyRef.onDestroy(() => {
      this.catalogSub?.unsubscribe();
      this.submitOrderSub?.unsubscribe();
      this.recentOrdersSub?.unsubscribe();
      this.clearSlowNoticeTimer();
    });

    // Tự động đồng bộ cấu hình bó hoa tự phối vào localStorage trên trình duyệt
    effect(() => {
      const counts = this.stemCounts();
      const wrapId = this.selectedWrapId();
      if (!this.isBrowser) return;
      try {
        window.localStorage.setItem(STORAGE_KEY_STEMS, JSON.stringify(counts));
        window.localStorage.setItem(STORAGE_KEY_WRAP, wrapId);
      } catch {
        // Bỏ qua an toàn nếu trình duyệt chặn quyền ghi localStorage
      }
    });

    // Nạp danh mục sản phẩm trực tiếp từ Backend Render / MongoDB ngay khi khởi động trên trình duyệt
    if (this.isBrowser) {
      this.loadCatalogFromApi();
    }
  }

  /**
   * Gọi REST API `GET /api/products` trên Backend Render / MongoDB để nạp 12 mẫu hoa thực tế.
   * Giữ sẵn bộ sưu tập dự phòng ngay từ 0ms để trang không bao giờ trống khi Render khởi động lạnh.
   */
  loadCatalogFromApi(): void {
    this.catalogSub?.unsubscribe();
    this.catalogStatus.set('loading');
    this.catalogError.set(null);

    this.catalogSub = this.http
      .get<ApiProduct[]>(`${this.apiBase}/products`)
      .pipe(timeout(API_TIMEOUT_MS))
      .subscribe({
        next: (products) => {
          if (!Array.isArray(products) || products.length === 0) {
            this.catalogStatus.set('fallback');
            this.catalogError.set('Danh mục máy chủ đang trống, hiển thị bộ sưu tập lưu sẵn.');
            return;
          }

          const mapped = this.mapApiProductsToBouquets(products);
          this.bouquets.set(mapped);
          this.catalogStatus.set('live');
          this.catalogError.set(null);

          // Đồng bộ lại bó hoa đang chọn trong ngăn kéo nếu người dùng chưa ở chế độ tự phối
          if (this.drawerOrderSource() === 'collection') {
            const currentId = this.activeOrderBouquet().apiProductId;
            const synced = mapped.find((b) => b.apiProductId === currentId) ?? mapped[0];
            if (synced) {
              this.activeOrderBouquet.set(synced);
            }
          }
        },
        error: () => {
          this.catalogStatus.set('fallback');
          this.catalogError.set(
            'Máy chủ Render đang khởi động hoặc tạm gián đoạn. Đang hiển thị bộ sưu tập lưu sẵn.'
          );
        },
      });
  }

  /** Gọi `GET /api/orders` để tải 5 đơn đặt hoa mới nhất đã lưu trong MongoDB */
  loadRecentOrdersFromApi(): void {
    this.recentOrdersSub?.unsubscribe();
    this.loadingRecentOrders.set(true);

    this.recentOrdersSub = this.http
      .get<ApiSavedOrder[]>(`${this.apiBase}/orders`)
      .pipe(timeout(API_TIMEOUT_MS))
      .subscribe({
        next: (orders) => {
          this.recentOrders.set(Array.isArray(orders) ? orders.slice(0, 5) : []);
          this.loadingRecentOrders.set(false);
        },
        error: () => {
          this.loadingRecentOrders.set(false);
        },
      });
  }

  getStemCount(stemId: string): number {
    return this.stemCounts()[stemId] ?? 0;
  }

  incrementStem(stemId: string): void {
    this.setStemCount(stemId, this.getStemCount(stemId) + 1);
  }

  decrementStem(stemId: string): void {
    this.setStemCount(stemId, this.getStemCount(stemId) - 1);
  }

  setStemCount(stemId: string, nextCount: number): void {
    const clamped = Math.max(0, Math.min(MAX_STEMS_PER_VARIETY, Math.floor(nextCount)));
    this.stemCounts.update((prev) => {
      const updated = { ...prev };
      if (clamped === 0) {
        delete updated[stemId];
      } else {
        updated[stemId] = clamped;
      }
      return updated;
    });

    if (this.totalCustomStems() >= MIN_CUSTOM_BOUQUET_STEMS && this.customBuilderError()) {
      this.customBuilderError.set(null);
    }
  }

  selectWrap(wrapId: WrapPaperId): void {
    this.selectedWrapId.set(wrapId);
  }

  /** Đưa toàn bộ bàn phối hoa về 0 cành để hỗ trợ làm mới & kiểm thử trạng thái rỗng */
  resetCustomBouquet(): void {
    this.stemCounts.set({});
    this.customBuilderError.set(null);
  }

  /** Khôi phục gợi ý phối mẫu 5 cành cân đối (3 Hồng Juliet Đà Lạt + 2 Mẫu Đơn Hồng Phấn) */
  restoreStarterBouquet(): void {
    this.stemCounts.set({ ...DEFAULT_STARTER_STEMS });
    this.selectedWrapId.set('hong-phan');
    this.customBuilderError.set(null);
  }

  // =========================================================================
  // 5. NGĂN KÉO ĐẶT HOA, MÃ ƯU ĐÃI, PHÍ GIAO HỎA TỐC, THIỆP 3D & ĐƠN MONGODB
  // =========================================================================
  readonly drawerOpen = signal<boolean>(false);
  readonly drawerOrderSource = signal<OrderSource>('collection');
  readonly activeOrderBouquet = signal<BouquetItem>(SIGNATURE_BOUQUETS[0]);
  readonly selectedSize = signal<BouquetSize>('Nhỏ');
  readonly selectedAddons = signal<string[]>([]);
  readonly deliveryDay = signal<DeliveryDayOption>('Hôm nay');
  readonly customDeliveryDate = signal<string>('');
  readonly selectedTimeSlot = signal<string>('Giao hỏa tốc 60 phút');
  readonly cardMessage = signal<string>('Chúc bạn một ngày thật dịu dàng và rạng rỡ.');
  readonly recipientName = signal<string>('');
  readonly recipientPhone = signal<string>('');
  readonly recipientAddress = signal<string>('');
  readonly voucherInput = signal<string>('');
  readonly appliedVoucherCode = signal<string | null>(null);
  readonly voucherError = signal<string | null>(null);
  readonly drawerValidationError = signal<string | null>(null);

  readonly submittingOrder = signal<boolean>(false);
  readonly slowServerNotice = signal<boolean>(false);
  readonly submitOrderError = signal<string | null>(null);
  readonly confirmedOrder = signal<ConfirmedOrder | null>(null);

  readonly recentOrders = signal<readonly ApiSavedOrder[]>([]);
  readonly loadingRecentOrders = signal<boolean>(false);

  readonly selectedAddonItems = computed<AddonOption[]>(() => {
    const ids = this.selectedAddons();
    return this.addons.filter((addon) => ids.includes(addon.id));
  });

  readonly addonsSubtotal = computed<number>(() =>
    this.selectedAddonItems().reduce((sum, item) => sum + item.price, 0)
  );

  /** Tạm tính trước ưu đãi và phí giao hàng (giá bó hoa + phụ phí kích cỡ + quà tặng kèm) */
  readonly drawerSubtotal = computed<number>(() => {
    const sizeDelta = this.sizeDeltas[this.selectedSize()] ?? 0;
    const baseAmount =
      this.drawerOrderSource() === 'custom'
        ? this.customBouquetTotal()
        : this.activeOrderBouquet().basePrice;
    return baseAmount + sizeDelta + this.addonsSubtotal();
  });

  /** Phí giao hỏa tốc 60 phút nội thành TP.HCM (miễn phí từ 399.000đ hoặc dùng mã FREESHIP60) */
  readonly shippingFee = computed<number>(() => {
    if (
      this.appliedVoucherCode() === 'FREESHIP60' ||
      this.drawerSubtotal() >= FREE_SHIPPING_THRESHOLD
    ) {
      return 0;
    }
    return STANDARD_SHIPPING_FEE;
  });

  /** Số tiền được giảm theo mã ưu đãi FLEURÉ đang áp dụng */
  readonly voucherDiscount = computed<number>(() => {
    const code = this.appliedVoucherCode();
    const subtotal = this.drawerSubtotal();
    if (code === 'FLEURE20') {
      return subtotal >= FLEURE20_MIN_SUBTOTAL ? Math.round(subtotal * 0.2) : 0;
    }
    if (code === 'YEUHOA15') {
      return Math.round(subtotal * 0.15);
    }
    return 0;
  });

  /** Thông báo phản hồi tức thì cho khu vực mã ưu đãi FLEURÉ */
  readonly voucherFeedback = computed<VoucherFeedback | null>(() => {
    const error = this.voucherError();
    if (error) {
      return { status: 'error', text: error };
    }

    const code = this.appliedVoucherCode();
    if (!code) {
      return null;
    }

    if (code === 'FLEURE20') {
      const subtotal = this.drawerSubtotal();
      if (subtotal < FLEURE20_MIN_SUBTOTAL) {
        const missing = FLEURE20_MIN_SUBTOTAL - subtotal;
        return {
          status: 'error',
          text: `Mã FLEURE20 áp dụng cho đơn từ 450.000đ (còn thiếu ${this.formatVnd(missing)}).`,
        };
      }
      return {
        status: 'success',
        text: `Đã áp dụng mã FLEURE20 (giảm ${this.formatVnd(this.voucherDiscount())}).`,
      };
    }

    if (code === 'YEUHOA15') {
      return {
        status: 'success',
        text: `Đã áp dụng mã YEUHOA15 thành viên mới (giảm ${this.formatVnd(this.voucherDiscount())}).`,
      };
    }

    if (code === 'FREESHIP60') {
      return {
        status: 'success',
        text: 'Đã áp dụng mã FREESHIP60: miễn phí giao hỏa tốc 60 phút nội thành TP.HCM.',
      };
    }

    return null;
  });

  /** Tổng thanh toán cuối cùng sau khi trừ mã ưu đãi và cộng phí giao hàng */
  readonly drawerTotalPrice = computed<number>(() =>
    Math.max(0, this.drawerSubtotal() - this.voucherDiscount() + this.shippingFee())
  );

  /** Áp dụng mã ưu đãi FLEURÉ (FLEURE20, YEUHOA15, FREESHIP60) */
  applyVoucher(code?: string): void {
    const normalized = (code ?? this.voucherInput()).trim().toUpperCase();
    this.voucherInput.set(normalized);

    if (!normalized) {
      this.appliedVoucherCode.set(null);
      this.voucherError.set('Vui lòng nhập hoặc chọn một mã ưu đãi FLEURÉ.');
      return;
    }

    if (normalized === 'FLEURE20') {
      if (this.drawerSubtotal() < FLEURE20_MIN_SUBTOTAL) {
        this.appliedVoucherCode.set(null);
        this.voucherError.set('Mã FLEURE20 chỉ áp dụng cho đơn từ 450.000đ trở lên.');
        return;
      }
      this.appliedVoucherCode.set('FLEURE20' satisfies VoucherCode);
      this.voucherError.set(null);
      return;
    }

    if (normalized === 'YEUHOA15') {
      this.appliedVoucherCode.set('YEUHOA15' satisfies VoucherCode);
      this.voucherError.set(null);
      return;
    }

    if (normalized === 'FREESHIP60') {
      this.appliedVoucherCode.set('FREESHIP60' satisfies VoucherCode);
      this.voucherError.set(null);
      return;
    }

    this.appliedVoucherCode.set(null);
    this.voucherError.set(
      `Mã "${normalized}" chưa hợp lệ. Gợi ý: FLEURE20, YEUHOA15 hoặc FREESHIP60.`
    );
  }

  /** Gỡ bỏ mã ưu đãi đang nhập/áp dụng */
  clearVoucher(): void {
    this.voucherInput.set('');
    this.appliedVoucherCode.set(null);
    this.voucherError.set(null);
  }

  /** Mở ngăn kéo đặt hoa cho một mẫu trong bộ sưu tập (mặc định cỡ Nhỏ = đúng giá niêm yết MongoDB) */
  openOrderForBouquet(bouquet: BouquetItem): void {
    this.drawerOrderSource.set('collection');
    this.activeOrderBouquet.set(bouquet);
    this.selectedSize.set('Nhỏ');
    this.voucherError.set(null);
    this.drawerValidationError.set(null);
    this.submitOrderError.set(null);
    this.confirmedOrder.set(null);
    this.drawerOpen.set(true);
  }

  /** Mở ngăn kéo đặt hoa theo ID / slug bó hoa (tiện dùng từ Lịch mùa hoa Đà Lạt) */
  openOrderForBouquetById(bouquetId: string): void {
    this.openOrderForBouquet(this.findBouquetByRef(bouquetId));
  }

  /**
   * Kiểm tra số cành tối thiểu (>= 3 cành) rồi mở ngăn kéo đặt hoa cho bó tự phối.
   * Trả về `true` nếu hợp lệ và mở được ngăn kéo, `false` nếu dưới 3 cành.
   */
  openOrderForCustomBouquet(): boolean {
    if (this.totalCustomStems() < MIN_CUSTOM_BOUQUET_STEMS) {
      this.customBuilderError.set('Chọn tối thiểu 3 cành hoa để nghệ nhân có thể lên phom bó.');
      return false;
    }

    this.customBuilderError.set(null);
    const entries = this.selectedStemEntries();
    const leadImage = entries[0]?.stem.image ?? '/images/bouquet-juliet-peony.png';
    const baseProduct = this.bouquets()[0] ?? SIGNATURE_BOUQUETS[0];
    const wrapLabel = this.selectedWrap().name.startsWith('Giấy')
      ? this.selectedWrap().name
      : `giấy ${this.selectedWrap().name}`;
    const customPreviewBouquet: BouquetItem = {
      id: 'custom-fleure-bouquet',
      apiProductId: baseProduct.apiProductId || DEFAULT_CUSTOM_BASE_PRODUCT_ID,
      name: `Bó hoa phối riêng (${this.totalCustomStems()} cành)`,
      poeticNote: `Gói ${wrapLabel} thủ công tại FLEURÉ.`,
      story: this.selectedWrap().description,
      basePrice: this.customBouquetTotal(),
      image: leadImage,
      occasionIds: [this.selectedOccasionId()],
      featuredInHanging: false,
      stemsSummary: this.customStemsSummary(),
      tag: 'Phối theo ý riêng',
    };

    this.drawerOrderSource.set('custom');
    this.activeOrderBouquet.set(customPreviewBouquet);
    this.selectedSize.set('Nhỏ');
    this.voucherError.set(null);
    this.drawerValidationError.set(null);
    this.submitOrderError.set(null);
    this.confirmedOrder.set(null);
    this.drawerOpen.set(true);
    return true;
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerValidationError.set(null);
    this.submitOrderError.set(null);
  }

  toggleAddon(addonId: string): void {
    this.selectedAddons.update((current) =>
      current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]
    );
  }

  isAddonSelected(addonId: string): boolean {
    return this.selectedAddons().includes(addonId);
  }

  resetConfirmedOrder(): void {
    this.confirmedOrder.set(null);
    this.drawerValidationError.set(null);
    this.submitOrderError.set(null);
  }

  /**
   * Xác thực đầy đủ thông tin nhận hoa và gửi đơn thật lên `POST /api/orders` (Render + MongoDB Atlas).
   * Trả về `true` nếu qua bước xác thực và đã bắt đầu gửi request, `false` nếu thiếu dữ liệu đầu vào.
   */
  submitOrderToApi(onSuccess?: (order: ConfirmedOrder) => void): boolean {
    if (this.submittingOrder()) {
      return false;
    }

    const validated = this.validateOrderFields();
    if (!validated) {
      return false;
    }

    this.submitOrderSub?.unsubscribe();
    this.submitOrderError.set(null);
    this.submittingOrder.set(true);
    this.slowServerNotice.set(false);
    this.clearSlowNoticeTimer();

    if (this.isBrowser) {
      this.slowNoticeTimer = setTimeout(() => {
        if (this.submittingOrder()) {
          this.slowServerNotice.set(true);
        }
      }, SLOW_SERVER_HINT_DELAY_MS);
    }

    const source = this.drawerOrderSource();
    const bouquet = this.activeOrderBouquet();
    const size = this.selectedSize();
    const addonItems = this.selectedAddonItems();
    const addonNames = addonItems.map((a) => a.name);
    const hasAtelierExtras = source === 'custom' || size !== 'Nhỏ' || addonNames.length > 0;
    const rawAppliedCode = this.appliedVoucherCode();
    const effectiveVoucher =
      rawAppliedCode === 'FLEURE20' && this.voucherDiscount() === 0 ? null : rawAppliedCode;

    const noteParts: string[] = [
      `Lịch giao: ${validated.scheduleLabel} (${this.selectedTimeSlot()})`,
      `Thiệp 3D: "${validated.cleanMessage}"`,
    ];

    if (source === 'custom') {
      noteParts.push(
        `[BÓ PHỐI RIÊNG] ${bouquet.name} — ${this.customStemsSummary()} · Tạm tính dự kiến tại tiệm: ${this.formatVnd(this.drawerTotalPrice())}`
      );
    } else if (size !== 'Nhỏ') {
      noteParts.push(`Nâng cấp kích cỡ: ${size} (+${this.formatVnd(this.sizeDeltas[size] ?? 0)})`);
    }

    if (addonNames.length > 0) {
      noteParts.push(
        `Quà tặng kèm: ${addonNames.join(', ')} (+${this.formatVnd(this.addonsSubtotal())})`
      );
    }

    const payload: ApiCreateOrderPayload = {
      customer: {
        fullName: validated.cleanName,
        phone: validated.normalizedPhone,
        address: validated.cleanAddress,
        note: noteParts.join(' | '),
      },
      items: [
        {
          productId: bouquet.apiProductId || DEFAULT_CUSTOM_BASE_PRODUCT_ID,
          quantity: 1,
        },
      ],
      voucherCode: effectiveVoucher,
    };

    this.submitOrderSub = this.http
      .post<ApiSavedOrder>(`${this.apiBase}/orders`, payload)
      .pipe(timeout(API_TIMEOUT_MS))
      .subscribe({
        next: (saved) => {
          this.clearSlowNoticeTimer();
          this.submittingOrder.set(false);
          this.slowServerNotice.set(false);
          this.submitOrderError.set(null);

          const confirmed = this.buildConfirmedOrder({
            validated,
            orderCode: saved.orderCode || this.generateFallbackOrderCode(),
            persistedToDb: true,
            orderStatus: saved.status || 'Đã tiếp nhận',
            dbOrderId: saved._id,
            dbGrandTotal: saved.grandTotal,
            hasAtelierExtras,
            savedOrder: saved,
          });

          this.confirmedOrder.set(confirmed);
          this.recentOrders.update((prev) => [
            saved,
            ...prev.filter((item) => item.orderCode !== saved.orderCode),
          ].slice(0, 5));

          onSuccess?.(confirmed);
        },
        error: (err: unknown) => {
          this.clearSlowNoticeTimer();
          this.submittingOrder.set(false);
          this.slowServerNotice.set(false);

          const serverMessage =
            err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
              ? err.error.message
              : null;

          this.submitOrderError.set(
            serverMessage ||
              'Không thể lưu đơn lên máy chủ Render/MongoDB lúc này. Bạn có thể bấm "Đặt hoa ngay" để thử lại hoặc tạo phiếu gửi Zalo trực tiếp.'
          );
        },
      });

    return true;
  }

  /**
   * Phương án dự phòng minh bạch khi mất kết nối mạng hoặc Render tạm ngưng:
   * chỉ được gọi khi người dùng chủ động bấm nút tạo phiếu Zalo tạm (không lưu MongoDB).
   */
  submitOfflineZaloFallback(): ConfirmedOrder | null {
    const validated = this.validateOrderFields();
    if (!validated) {
      return null;
    }

    this.submitOrderError.set(null);
    const source = this.drawerOrderSource();
    const size = this.selectedSize();
    const addonNames = this.selectedAddonItems().map((a) => a.name);
    const confirmed = this.buildConfirmedOrder({
      validated,
      orderCode: this.generateFallbackOrderCode(),
      persistedToDb: false,
      orderStatus: 'Phiếu tạm gửi Zalo',
      hasAtelierExtras: source === 'custom' || size !== 'Nhỏ' || addonNames.length > 0,
    });

    this.confirmedOrder.set(confirmed);
    return confirmed;
  }

  /** Định dạng tiền tệ Việt Nam chuẩn mực (ví dụ: 390000 -> '390.000đ') */
  formatVnd(amount: number): string {
    const safeNumber = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
    return `${safeNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;
  }

  /** Ẩn bớt chữ số giữa của SĐT khi hiển thị danh sách đơn gần nhất trên giao diện */
  maskPhoneNumber(phone: string): string {
    const digits = phone.replace(/\s+/g, '');
    if (digits.length < 7) return digits;
    return `${digits.slice(0, 4)}•••${digits.slice(-3)}`;
  }

  // =========================================================================
  // HÀM NỘI BỘ CHUYỂN ĐỔI DỮ LIỆU API, XÁC THỰC & LOCALSTORAGE
  // =========================================================================
  private mapApiProductsToBouquets(apiProducts: readonly ApiProduct[]): BouquetItem[] {
    const featuredSet = new Set<number>(FEATURED_HANGING_PRODUCT_IDS);
    const hasCuratedMatch = apiProducts.some((p) => featuredSet.has(p.id));

    return apiProducts.map((product, index) => {
      const occasionSet = new Set<OccasionId>();
      if (VALID_OCCASION_IDS.has(product.categorySlug)) {
        occasionSet.add(product.categorySlug as OccasionId);
      }
      for (const extra of EXTRA_OCCASIONS_BY_PRODUCT_ID[product.id] ?? []) {
        occasionSet.add(extra);
      }
      if (occasionSet.size === 0) {
        occasionSet.add('hoa-sinh-nhat');
      }

      const resolvedImage = /^https?:\/\//i.test(product.image)
        ? product.image
        : STUDIO_CUTOUT_BY_PRODUCT_ID[product.id] ??
          STUDIO_CUTOUT_BY_CATEGORY_SLUG[product.categorySlug] ??
          '/images/bouquet-juliet-peony.png';

      const tag =
        product.badge?.trim() ||
        (product.discount > 0 ? `-${product.discount}%` : undefined);

      return {
        id: product.slug || `fleure-product-${product.id}`,
        apiProductId: product.id,
        name: product.name,
        poeticNote: product.meaning || product.description,
        story: product.description,
        basePrice: product.priceValue,
        oldPriceValue:
          product.oldPriceValue > product.priceValue ? product.oldPriceValue : undefined,
        discount: product.discount > 0 ? product.discount : undefined,
        sold: product.sold,
        categorySlug: product.categorySlug,
        image: resolvedImage,
        occasionIds: [...occasionSet],
        featuredInHanging: hasCuratedMatch ? featuredSet.has(product.id) : index < 7,
        stemsSummary: product.description,
        tag,
      };
    });
  }

  private validateOrderFields(): {
    cleanName: string;
    normalizedPhone: string;
    cleanAddress: string;
    scheduleLabel: string;
    cleanMessage: string;
  } | null {
    const cleanName = this.recipientName().trim();
    if (cleanName.length < 2) {
      this.drawerValidationError.set('Vui lòng nhập tên người nhận (tối thiểu 2 ký tự).');
      return null;
    }

    const normalizedPhone = this.recipientPhone().replace(/[\s.-]/g, '');
    if (!/^(0|\+84)\d{8,10}$/.test(normalizedPhone)) {
      this.drawerValidationError.set(
        'Vui lòng nhập số điện thoại người nhận hợp lệ (9 – 11 chữ số, bắt đầu bằng 0 hoặc +84).'
      );
      return null;
    }

    const cleanAddress = this.recipientAddress().trim();
    if (cleanAddress.length < 5) {
      this.drawerValidationError.set(
        'Vui lòng nhập địa chỉ giao hoa đầy đủ (số nhà, tên đường, quận/huyện).'
      );
      return null;
    }

    if (this.deliveryDay() === 'Chọn ngày' && !this.customDeliveryDate().trim()) {
      this.drawerValidationError.set('Vui lòng chọn ngày giao hoa cụ thể trên lịch.');
      return null;
    }

    this.drawerValidationError.set(null);

    const scheduleLabel =
      this.deliveryDay() === 'Chọn ngày'
        ? `Ngày ${this.customDeliveryDate().trim()}`
        : this.deliveryDay();
    const cleanMessage =
      this.cardMessage().trim() || 'Chúc bạn một ngày thật dịu dàng và rạng rỡ.';

    return {
      cleanName,
      normalizedPhone,
      cleanAddress,
      scheduleLabel,
      cleanMessage,
    };
  }

  private buildConfirmedOrder(params: {
    validated: {
      cleanName: string;
      normalizedPhone: string;
      cleanAddress: string;
      scheduleLabel: string;
      cleanMessage: string;
    };
    orderCode: string;
    persistedToDb: boolean;
    orderStatus: string;
    dbOrderId?: string;
    dbGrandTotal?: number;
    hasAtelierExtras: boolean;
    savedOrder?: ApiSavedOrder;
  }): ConfirmedOrder {
    const {
      validated,
      orderCode,
      persistedToDb,
      orderStatus,
      dbOrderId,
      dbGrandTotal,
      hasAtelierExtras,
      savedOrder,
    } = params;

    const source = this.drawerOrderSource();
    const bouquet = this.activeOrderBouquet();
    const size = this.selectedSize();
    const addonItems = this.selectedAddonItems();
    const addonNames = addonItems.map((a) => a.name);

    // Nếu không có nâng cấp cỡ/quà tặng/phối riêng, khớp tuyệt đối theo số tiền MongoDB đã chốt
    const useServerNumbers = persistedToDb && !hasAtelierExtras && Boolean(savedOrder);
    const subtotalBeforeDiscount = useServerNumbers
      ? savedOrder!.subtotal
      : this.drawerSubtotal();
    const discountAmount = useServerNumbers
      ? savedOrder!.discountAmount
      : this.voucherDiscount();
    const shippingFee = useServerNumbers ? savedOrder!.shippingFee : this.shippingFee();
    const totalPrice = useServerNumbers ? savedOrder!.grandTotal : this.drawerTotalPrice();
    const rawAppliedCode = useServerNumbers ? savedOrder!.voucherCode : this.appliedVoucherCode();
    const voucherCode =
      rawAppliedCode === 'FLEURE20' && discountAmount === 0 ? null : rawAppliedCode;

    const wrapName = source === 'custom' ? this.selectedWrap().name : undefined;
    const stemsSummary = source === 'custom' ? this.customStemsSummary() : bouquet.stemsSummary;

    const lines: string[] = [
      `[FLEURÉ FLOWER BOUTIQUE — ĐƠN ĐẶT HOA #${orderCode}]`,
      `• Trạng thái: ${orderStatus}${persistedToDb ? ' (Đã lưu hệ thống MongoDB)' : ''}`,
      `• Mẫu hoa: ${bouquet.name}${source === 'collection' ? ` (Cỡ ${size})` : size !== 'Nhỏ' ? ` (Nâng cấp phom ${size})` : ''}`,
      `• Thành phần: ${stemsSummary}`,
    ];

    if (addonNames.length > 0) {
      lines.push(`• Quà tặng kèm: ${addonNames.join(', ')}`);
    }

    lines.push(
      `• Giao hoa: ${validated.scheduleLabel} · Khung giờ ${this.selectedTimeSlot()}`,
      `• Người nhận: ${validated.cleanName} (${validated.normalizedPhone})`,
      `• Địa chỉ giao: ${validated.cleanAddress}`,
      `• Lời chúc thiệp 3D: "${validated.cleanMessage}"`,
      `• Tạm tính: ${this.formatVnd(subtotalBeforeDiscount)}`
    );

    if (voucherCode) {
      const voucherSummary =
        discountAmount > 0
          ? `-${this.formatVnd(discountAmount)}`
          : 'Miễn phí giao hỏa tốc 60 phút';
      lines.push(`• Mã ưu đãi (${voucherCode}): ${voucherSummary}`);
    }

    lines.push(
      `• Phí giao hỏa tốc TP.HCM: ${shippingFee === 0 ? 'Miễn phí' : this.formatVnd(shippingFee)}`,
      `• Tổng thanh toán: ${this.formatVnd(totalPrice)}`,
      '• Cửa hàng: FLEURÉ Flower Boutique · 45 Nguyễn Huệ, Quận 1, TP.HCM · Zalo/Hotline: 0909 123 456'
    );

    return {
      source,
      bouquetId: bouquet.id,
      apiProductId: bouquet.apiProductId || DEFAULT_CUSTOM_BASE_PRODUCT_ID,
      bouquetName: bouquet.name,
      bouquetImage: bouquet.image,
      stemsSummary,
      wrapName,
      size,
      selectedAddonIds: [...this.selectedAddons()],
      addonNames,
      deliveryDay: this.deliveryDay(),
      customDate: this.customDeliveryDate().trim(),
      timeSlot: this.selectedTimeSlot(),
      cardMessage: validated.cleanMessage,
      recipientName: validated.cleanName,
      recipientPhone: validated.normalizedPhone,
      recipientAddress: validated.cleanAddress,
      voucherCode,
      discountAmount,
      shippingFee,
      subtotalBeforeDiscount,
      totalPrice,
      orderCode,
      zaloShareText: lines.join('\n'),
      createdAtIso: savedOrder?.createdAt ?? new Date().toISOString(),
      persistedToDb,
      orderStatus,
      dbOrderId,
      dbGrandTotal,
      hasAtelierExtras,
    };
  }

  private clearSlowNoticeTimer(): void {
    if (this.slowNoticeTimer !== null) {
      clearTimeout(this.slowNoticeTimer);
      this.slowNoticeTimer = null;
    }
  }

  private loadInitialStemCounts(): Record<string, number> {
    if (!this.isBrowser) {
      return { ...DEFAULT_STARTER_STEMS };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_STEMS);
      if (!raw) {
        return { ...DEFAULT_STARTER_STEMS };
      }
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ...DEFAULT_STARTER_STEMS };
      }

      const validIds = new Set(this.stems.map((s) => s.id));
      const sanitized: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (validIds.has(key) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
          sanitized[key] = Math.min(MAX_STEMS_PER_VARIETY, Math.floor(value));
        }
      }
      return sanitized;
    } catch {
      return { ...DEFAULT_STARTER_STEMS };
    }
  }

  private loadInitialWrapId(): WrapPaperId {
    if (!this.isBrowser) {
      return 'hong-phan';
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_WRAP);
      if (raw === 'hong-phan' || raw === 'kem-phap' || raw === 'do-ruby') {
        return raw;
      }
      return 'hong-phan';
    } catch {
      return 'hong-phan';
    }
  }

  private generateFallbackOrderCode(): string {
    const timePart = Date.now().toString().slice(-4);
    const randomPart = Math.floor(10 + Math.random() * 90).toString();
    return `FLR-${timePart}${randomPart}`;
  }
}
