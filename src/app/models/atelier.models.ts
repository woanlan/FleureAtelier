/**
 * Định nghĩa các kiểu dữ liệu & hợp đồng miền nghiệp vụ cho
 * "FLEURÉ — Flower Boutique" (Gói chút hoa, gửi chút thương).
 */

/** Danh mục 6 dịp tặng hoa chủ đạo tại FLEURÉ */
export type OccasionId =
  | 'hoa-sinh-nhat'
  | 'hoa-tinh-yeu'
  | 'hoa-chuc-mung'
  | 'hoa-cuoi'
  | 'lan-ho-diep'
  | 'gui-loi-cam-on';

/** Kích cỡ bó hoa và mức phụ phí tương ứng (VND) */
export type BouquetSize = 'Nhỏ' | 'Vừa' | 'Lớn';

/** Bảng chênh lệch giá theo kích cỡ bó hoa tại FLEURÉ (VND) */
export const BOUQUET_SIZE_DELTAS: Readonly<Record<BouquetSize, number>> = {
  Nhỏ: 0,
  Vừa: 150000,
  Lớn: 320000,
};

/** Thông tin hiển thị chi tiết cho từng lựa chọn kích cỡ bó hoa */
export interface BouquetSizeOption {
  size: BouquetSize;
  deltaPrice: number;
  stemsHint: string;
}

export const BOUQUET_SIZE_OPTIONS: readonly BouquetSizeOption[] = [
  { size: 'Nhỏ', deltaPrice: 0, stemsHint: 'Phom tiêu chuẩn niêm yết' },
  { size: 'Vừa', deltaPrice: 150000, stemsHint: 'Tăng thêm 40% lượng cành đầy đặn' },
  { size: 'Lớn', deltaPrice: 320000, stemsHint: 'Phom đại sang trọng nổi bật' },
];

/** Trạng thái đồng bộ danh mục sản phẩm từ Backend Render / MongoDB */
export type CatalogSyncStatus = 'loading' | 'live' | 'fallback';

/** Cấu trúc một bó hoa trả về từ REST API `GET /api/products` (MongoDB `fleure_shop`) */
export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: string;
  categorySlug: string;
  price: string;
  oldPrice: string;
  priceValue: number;
  oldPriceValue: number;
  image: string;
  description: string;
  meaning: string;
  discount: number;
  sold: number;
  createdAt?: string;
  badge?: string;
  badgeClass?: string;
}

/** Thông tin khách hàng gửi lên `POST /api/orders` theo hợp đồng Backend `asm/be` */
export interface ApiOrderCustomer {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
}

/** Gói dữ liệu đặt hoa gửi lên `POST /api/orders` */
export interface ApiCreateOrderPayload {
  customer: ApiOrderCustomer;
  items: { productId: number; quantity: number }[];
  voucherCode?: string | null;
}

/** Từng dòng sản phẩm đã được MongoDB xác thực đơn giá trong hóa đơn */
export interface ApiSavedOrderItem {
  productId: number;
  name: string;
  price: string;
  priceValue: number;
  image: string;
  quantity: number;
}

/** Đơn đặt hoa đã lưu thành công trong collection `orders` của MongoDB */
export interface ApiSavedOrder {
  _id?: string;
  orderCode: string;
  slug?: string;
  customer: ApiOrderCustomer;
  items: ApiSavedOrderItem[];
  voucherCode: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  status: string;
  createdAt?: string;
}

/** Mã nhận diện 3 dòng giấy gói lụa Pháp tại FLEURÉ */
export type WrapPaperId = 'hong-phan' | 'kem-phap' | 'do-ruby';

/** Mã ưu đãi chính thức của FLEURÉ */
export type VoucherCode = 'FLEURE20' | 'YEUHOA15' | 'FREESHIP60';

/** Thông tin hiển thị một mã ưu đãi FLEURÉ */
export interface VoucherOption {
  code: VoucherCode;
  label: string;
  description: string;
  minSubtotal: number;
}

/** Phản hồi trạng thái khi áp dụng mã ưu đãi trong ngăn kéo đặt hoa */
export interface VoucherFeedback {
  status: 'success' | 'error';
  text: string;
}

/** Tùy chọn ngày giao hoa trong ngăn kéo đặt đơn */
export type DeliveryDayOption = 'Hôm nay' | 'Ngày mai' | 'Chọn ngày';

/** Nguồn khởi tạo đơn hàng: từ bộ sưu tập tuyển chọn hoặc từ bàn tự phối hoa */
export type OrderSource = 'collection' | 'custom';

/** Mẫu bó hoa nghệ thuật tuyển chọn của FLEURÉ (đồng bộ trực tiếp từ MongoDB hoặc bộ lưu sẵn) */
export interface BouquetItem {
  id: string;
  /** Mã số định danh sản phẩm gốc trong collection `products` của MongoDB */
  apiProductId: number;
  name: string;
  poeticNote: string;
  story: string;
  basePrice: number;
  /** Giá gốc gạch ngang khi sản phẩm đang có ưu đãi trên MongoDB */
  oldPriceValue?: number;
  discount?: number;
  sold?: number;
  categorySlug?: string;
  image: string;
  occasionIds: OccasionId[];
  featuredInHanging: boolean;
  stemsSummary: string;
  tag?: string;
}

/** Chủ đề thị giác & lời tựa cho từng dịp tặng hoa */
export interface OccasionTheme {
  id: OccasionId;
  label: string;
  headline: string;
  poeticQuote: string;
  poeticSub: string;
  /** Màu nền pastel dịu mắt của phân khu dịp tặng */
  bgHex: string;
  /** Màu chữ tiêu đề đảm bảo tương phản WCAG AA >= 7.1:1 trên bgHex */
  headlineHex: string;
  /** Bộ 3 mã màu cho hiệu ứng cánh hoa rơi tự nhiên */
  petalColors: string[];
  /** Mã bó hoa tâm điểm đại diện cho dịp tặng */
  heroBouquetId: string;
}

/** Thông tin một loại cành hoa lẻ trong phân khu "Tự bó hoa" */
export interface FlowerStem {
  id: string;
  name: string;
  origin: string;
  pricePerStem: number;
  /** Sắc hoa chính dùng cho chấm màu & huy hiệu nhận diện */
  colorHex: string;
  /** Sắc chuyển phụ của cánh hoa */
  secondaryHex: string;
  /** Ảnh cận cảnh bông hoa vuông cho thẻ chọn bên trái */
  image: string;
  /** Ảnh tách nền PNG trong suốt nguyên cành hoa thật (có cuống xanh) cho sân khấu tự phối */
  stemCutoutImage: string;
  seasonNote: string;
}

/** Tùy chọn giấy gói & ruy băng đi kèm bó hoa tự phối */
export interface WrapPaperOption {
  id: WrapPaperId;
  name: string;
  price: number;
  paperHex: string;
  paperFoldHex: string;
  ribbonHex: string;
  /** Ảnh tách nền PNG lớp giấy quạt phía sau bó hoa */
  backImage: string;
  /** Ảnh tách nền PNG lớp phễu giấy trước kèm nơ satin thật */
  frontImage: string;
  description: string;
}

/** Quà tặng tinh tế chọn kèm trong ngăn kéo đặt hoa */
export interface AddonOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

/** Mốc mùa hoa Đà Lạt đặc trưng trong "Lịch mùa hoa Đà Lạt" */
export interface SeasonalFlower {
  id: string;
  monthLabel: string;
  name: string;
  scentLevel: string;
  vaseLife: string;
  poeticNote: string;
  image: string;
  linkedBouquetId: string;
}

/** Dòng tổng hợp một loại cành hoa đã chọn kèm số lượng và thành tiền */
export interface SelectedStemEntry {
  stem: FlowerStem;
  count: number;
  subtotal: number;
}

/** Bản nháp đơn đặt hoa đang thao tác trong Order Drawer */
export interface OrderDraft {
  source: OrderSource;
  bouquetId: string;
  apiProductId: number;
  bouquetName: string;
  bouquetImage: string;
  stemsSummary: string;
  wrapName?: string;
  size: BouquetSize;
  selectedAddonIds: string[];
  deliveryDay: DeliveryDayOption;
  customDate: string;
  timeSlot: string;
  cardMessage: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  voucherCode: string | null;
  discountAmount: number;
  shippingFee: number;
  subtotalBeforeDiscount: number;
  totalPrice: number;
}

/** Đơn đặt hoa đã xác nhận hoàn tất (lưu MongoDB thực tế hoặc phiếu tạm gửi Zalo) */
export interface ConfirmedOrder extends OrderDraft {
  orderCode: string;
  zaloShareText: string;
  addonNames: string[];
  createdAtIso: string;
  /** Cờ xác thực đơn đã được lưu thành công vào collection `orders` trên MongoDB */
  persistedToDb: boolean;
  /** Trạng thái xử lý trả về từ máy chủ (VD: 'Đã tiếp nhận') */
  orderStatus: string;
  /** MongoDB ObjectId (`_id`) khi đã lưu lên máy chủ */
  dbOrderId?: string;
  /** Tổng tiền sản phẩm gốc do Backend MongoDB xác thực */
  dbGrandTotal?: number;
  /** Đánh dấu đơn có thêm tùy chọn nâng cấp cỡ, quà tặng kèm hoặc bó phối riêng ghi chú cho nghệ nhân */
  hasAtelierExtras: boolean;
}

// ============================================================================
// HỢP ĐỒNG DỮ LIỆU ĐA TRANG & 6 COLLECTION MONGODB (`fleure_shop`)
// ============================================================================

/** Danh mục hoa tươi đồng bộ từ `GET /api/categories` hoặc `GET /api/home` */
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  order: number;
  icon: string;
  description: string;
}

/** Banner khuyến mãi / chiến dịch đồng bộ từ `GET /api/banners` hoặc `GET /api/home` */
export interface ApiBanner {
  id: number;
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
  image: string;
  order: number;
  isActive: boolean;
}

/** Danh mục bài viết cẩm nang hoa */
export type PostCategory =
  | 'Tất cả'
  | 'Chăm sóc hoa'
  | 'Ý nghĩa hoa'
  | 'Nghệ thuật gói'
  | 'Xu hướng';

/** Bài viết cẩm nang đồng bộ từ `GET /api/posts` */
export interface ApiPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  careTip: string;
  image: string;
  category: Exclude<PostCategory, 'Tất cả'>;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
  relatedProductId: number;
}

/** Danh mục video trải nghiệm Atelier */
export type ExperienceCategory =
  | 'Tất cả'
  | 'Atelier FLEURÉ'
  | 'Kỹ thuật bó hoa'
  | 'Chăm hoa tại nhà';

/** Video trải nghiệm bó hoa & workshop đồng bộ từ `GET /api/experiences` */
export interface ApiExperienceVideo {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: Exclude<ExperienceCategory, 'Tất cả'>;
  duration: string;
  views: number;
  posterImage: string;
  videoUrl: string;
  steps: string[];
  linkedProductId: number;
  publishedAt: string;
}

/** Dữ liệu tổng hợp 6 khối cho trang chủ trả về từ `GET /api/home` */
export interface ApiHomePayload {
  banners: ApiBanner[];
  categories: ApiCategory[];
  newProducts: ApiProduct[];
  bestSellingProducts: ApiProduct[];
  saleProducts: ApiProduct[];
  latestPosts: ApiPost[];
}

/** Một dòng sản phẩm nằm trong giỏ hàng đa món (`/cart`) lưu tại localStorage */
export interface CartItem {
  product: ApiProduct;
  quantity: number;
}

/** 5 chế độ sắp xếp sản phẩm trên trang `/products` và `/category/:slug` */
export type ProductSortOption =
  | 'newest'
  | 'bestseller'
  | 'promotion'
  | 'price-asc'
  | 'price-desc';

/** Trạng thái thông báo Toast nổi cuối màn hình (hỗ trợ Hoàn tác khi xóa sản phẩm khỏi giỏ) */
export interface ToastState {
  message: string;
  canUndo: boolean;
}
