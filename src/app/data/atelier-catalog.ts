import {
  AddonOption,
  ApiBanner,
  ApiCategory,
  ApiExperienceVideo,
  ApiPost,
  ApiProduct,
  BouquetItem,
  DeliveryDayOption,
  FlowerStem,
  OccasionId,
  OccasionTheme,
  SeasonalFlower,
  VoucherOption,
  WrapPaperOption,
} from '../models/atelier.models';

/**
 * Bản đồ ánh xạ ảnh tách nền studio trong suốt (`/images/bouquet-*.png`) cho từng mã sản phẩm
 * trong collection `products` của MongoDB `fleure_shop`, giúp kệ hoa treo 3D và sân khấu dịp tặng
 * giữ trọn thẩm mỹ tách nền không viền trắng.
 */
export const STUDIO_CUTOUT_BY_PRODUCT_ID: Readonly<Record<number, string>> = {
  12: '/images/bouquet-juliet-peony.png',
  11: '/images/bouquet-carnation-pink.png',
  10: '/images/bouquet-delphinium-blue.png',
  9: '/images/bouquet-juliet-peony.png',
  8: '/images/bouquet-carnation-pink.png',
  7: '/images/bouquet-orchid-gold.png',
  6: '/images/bouquet-bridal-white.png',
  5: '/images/bouquet-bridal-white.png',
  4: '/images/bouquet-carnation-pink.png',
  3: '/images/bouquet-orchid-gold.png',
  2: '/images/bouquet-sunflower-peach.png',
  1: '/images/bouquet-dahlia-wine.png',
};

/** Ảnh tách nền dự phòng theo `categorySlug` nếu MongoDB có thêm sản phẩm mới */
export const STUDIO_CUTOUT_BY_CATEGORY_SLUG: Readonly<Record<string, string>> = {
  'hoa-sinh-nhat': '/images/bouquet-juliet-peony.png',
  'hoa-tinh-yeu': '/images/bouquet-dahlia-wine.png',
  'hoa-chuc-mung': '/images/bouquet-sunflower-peach.png',
  'hoa-cuoi': '/images/bouquet-bridal-white.png',
  'lan-ho-diep': '/images/bouquet-orchid-gold.png',
  'gui-loi-cam-on': '/images/bouquet-delphinium-blue.png',
};

/** 7 sản phẩm tiêu biểu (mỗi mẫu mang 1 ảnh studio riêng biệt) trưng bày trên kệ hoa treo 3D */
export const FEATURED_HANGING_PRODUCT_IDS: readonly number[] = [12, 1, 11, 10, 6, 7, 2];

/** Mã sản phẩm MongoDB tâm điểm cho từng dịp tặng trên sân khấu chuyển màu */
export const OCCASION_HERO_PRODUCT_ID: Readonly<Record<OccasionId, number>> = {
  'hoa-sinh-nhat': 12,
  'hoa-tinh-yeu': 1,
  'hoa-chuc-mung': 2,
  'hoa-cuoi': 6,
  'lan-ho-diep': 7,
  'gui-loi-cam-on': 10,
};

/** Ánh xạ bổ sung các dịp phụ giúp mỗi dịp trong 6 thẻ luôn hiển thị đủ 4 mẫu hoa đa dạng */
export const EXTRA_OCCASIONS_BY_PRODUCT_ID: Readonly<Record<number, readonly OccasionId[]>> = {
  12: ['hoa-sinh-nhat', 'hoa-tinh-yeu', 'gui-loi-cam-on'],
  11: ['hoa-tinh-yeu', 'hoa-sinh-nhat', 'hoa-cuoi'],
  10: ['hoa-chuc-mung', 'gui-loi-cam-on', 'hoa-sinh-nhat'],
  9: ['hoa-sinh-nhat', 'gui-loi-cam-on', 'hoa-chuc-mung'],
  8: ['hoa-tinh-yeu', 'gui-loi-cam-on'],
  7: ['lan-ho-diep', 'hoa-chuc-mung'],
  6: ['hoa-cuoi', 'gui-loi-cam-on'],
  5: ['hoa-cuoi', 'hoa-tinh-yeu'],
  4: ['hoa-sinh-nhat', 'gui-loi-cam-on'],
  3: ['lan-ho-diep', 'gui-loi-cam-on', 'hoa-cuoi'],
  2: ['hoa-chuc-mung', 'hoa-sinh-nhat', 'lan-ho-diep'],
  1: ['hoa-tinh-yeu', 'hoa-chuc-mung', 'lan-ho-diep'],
};

/** Liên kết mã bó hoa tĩnh của Lịch mùa hoa Đà Lạt sang `apiProductId` tương ứng trên MongoDB */
export const LEGACY_BOUQUET_TO_PRODUCT_ID: Readonly<Record<string, number>> = {
  'diu-ngot-pastel': 12,
  'hong-nhung-ruby': 1,
  'cam-chuong-ngot-ngao': 11,
  'phi-yen-suong-mai': 10,
  'bach-hong-tinh-khoi': 6,
  'lan-ho-diep-hoang-kim': 7,
  'huong-duong-rang-ro': 2,
};

/**
 * Danh mục 7 bó hoa nghệ thuật dự phòng hiển thị tức thì (0ms) trong lúc tải dữ liệu trực tiếp
 * từ `GET https://fleureshop.onrender.com/api/products` (hoặc khi mất mạng tạm thời).
 */
export const SIGNATURE_BOUQUETS: readonly BouquetItem[] = [
  {
    id: 'diu-ngot-pastel',
    apiProductId: 12,
    name: 'Bó Hoa Dịu Ngọt Pastel FLEURÉ',
    poeticNote: 'Dịu dàng, trân trọng và lời chúc ngọt ngào gửi đến người thương.',
    story:
      'Bó hoa hồng kem dâu phối cùng hoa cẩm chướng và lá bạc eucalyptus, gói giấy lụa Hàn Quốc mềm mại chuẩn phong cách Pháp.',
    basePrice: 390000,
    oldPriceValue: 460000,
    discount: 15,
    categorySlug: 'hoa-sinh-nhat',
    image: '/images/bouquet-juliet-peony.png',
    occasionIds: ['hoa-sinh-nhat', 'hoa-tinh-yeu', 'hoa-cuoi', 'gui-loi-cam-on'],
    featuredInHanging: true,
    stemsSummary: 'Hồng kem dâu Đà Lạt, cẩm chướng phấn, lá bạc eucalyptus',
    tag: 'NEW',
  },
  {
    id: 'hong-nhung-ruby',
    apiProductId: 1,
    name: 'Chậu Hồng Tình Nhân Rực Rỡ',
    poeticNote: 'Yêu thương trọn vẹn, thủy chung và đầy đam mê.',
    story:
      'Chậu hoa hồng đỏ thắm thiết kế phủ xanh mướt mắt, tượng trưng cho tình cảm bền bỉ và chân thành.',
    basePrice: 350000,
    oldPriceValue: 440000,
    discount: 20,
    categorySlug: 'hoa-tinh-yeu',
    image: '/images/bouquet-dahlia-wine.png',
    occasionIds: ['hoa-tinh-yeu', 'hoa-chuc-mung', 'lan-ho-diep'],
    featuredInHanging: true,
    stemsSummary: 'Hồng đỏ ruby tuyển chọn, lá khuynh diệp bạc',
    tag: '-20%',
  },
  {
    id: 'cam-chuong-ngot-ngao',
    apiProductId: 11,
    name: 'Bó Hoa Tulip Hồng Nắng Mai',
    poeticNote: 'Tình yêu chân thành, lời tỏ tình tinh tế và niềm vui thuần khiết.',
    story:
      'Những búp tulip hồng nhập khẩu bung nở vừa độ, thân xanh mướt, thắt nơ ruy băng lụa thanh lịch.',
    basePrice: 480000,
    categorySlug: 'hoa-tinh-yeu',
    image: '/images/bouquet-carnation-pink.png',
    occasionIds: ['hoa-sinh-nhat', 'hoa-tinh-yeu', 'gui-loi-cam-on'],
    featuredInHanging: true,
    stemsSummary: 'Tulip hồng nhập khẩu, ruy băng lụa FLEURÉ',
    tag: 'NEW',
  },
  {
    id: 'phi-yen-suong-mai',
    apiProductId: 10,
    name: 'Hộp Hoa Hạnh Phúc Ngọc Ngà',
    poeticNote: 'Sự viên mãn, đong đầy yêu thương trong mọi dịp kỷ niệm.',
    story:
      'Thiết kế hộp hoa cao cấp kết hợp hồng phấn Ohara thơm dịu và lá bạc xanh pastel, giữ tươi 5–7 ngày.',
    basePrice: 490000,
    oldPriceValue: 620000,
    discount: 21,
    categorySlug: 'hoa-chuc-mung',
    image: '/images/bouquet-delphinium-blue.png',
    occasionIds: ['gui-loi-cam-on', 'hoa-sinh-nhat', 'hoa-chuc-mung', 'hoa-cuoi'],
    featuredInHanging: true,
    stemsSummary: 'Hồng phấn Ohara Đà Lạt, lá bạc pastel, hộp tròn cao cấp',
    tag: '-21%',
  },
  {
    id: 'bach-hong-tinh-khoi',
    apiProductId: 6,
    name: 'Hoa Bàn Tiệc Calimero Kem Sữa',
    poeticNote: 'Sự tinh tế, thanh khiết và ấm áp cho ngày chung đôi.',
    story:
      'Cụm hồng kem đào và hoa đồng nội nhỏ xinh cắm bình gốm phong cách Minimalist Châu Âu.',
    basePrice: 310000,
    categorySlug: 'hoa-cuoi',
    image: '/images/bouquet-bridal-white.png',
    occasionIds: ['hoa-cuoi', 'hoa-tinh-yeu', 'lan-ho-diep'],
    featuredInHanging: true,
    stemsSummary: 'Hồng kem đào, Calimero kem sữa, hoa đồng nội Đà Lạt',
    tag: 'NEW',
  },
  {
    id: 'lan-ho-diep-hoang-kim',
    apiProductId: 7,
    name: 'Lan Hồ Điệp Hồng Phát Phú Quý',
    poeticNote: 'Tài lộc vượng phát, thanh cao và lời chúc thành công rực rỡ.',
    story:
      'Chậu sứ men ngọc trồng 5 cành lan hồ điệp hồng tím căng tràn, bền hoa hơn 30 ngày thích hợp khai trương và tân gia.',
    basePrice: 890000,
    oldPriceValue: 1150000,
    discount: 23,
    categorySlug: 'lan-ho-diep',
    image: '/images/bouquet-orchid-gold.png',
    occasionIds: ['lan-ho-diep', 'hoa-chuc-mung', 'hoa-cuoi'],
    featuredInHanging: true,
    stemsSummary: '5 Cành Lan hồ điệp Bảo Lộc, chậu sứ men ngọc',
    tag: '-23%',
  },
  {
    id: 'huong-duong-rang-ro',
    apiProductId: 2,
    name: 'Bó Hướng Dương Rạng Rỡ Nắng',
    poeticNote: 'Niềm tin kiên định và tương lai luôn hướng về ánh mặt trời.',
    story:
      'Hướng dương cánh vàng rực rỡ truyền tải khí thế tươi mới trong ngày tốt nghiệp, thăng chức hay khai trương.',
    basePrice: 295000,
    oldPriceValue: 370000,
    discount: 20,
    categorySlug: 'hoa-chuc-mung',
    image: '/images/bouquet-sunflower-peach.png',
    occasionIds: ['hoa-chuc-mung', 'hoa-sinh-nhat', 'lan-ho-diep', 'gui-loi-cam-on'],
    featuredInHanging: true,
    stemsSummary: 'Hướng dương Đơn Dương, hồng kem đào, cúc họa mi',
    tag: '-20%',
  },
];

/**
 * 6 Chủ đề dịp tặng hoa kèm bảng màu nền pastel & màu tiêu đề đạt chuẩn WCAG AA (>= 7.1:1).
 * Mỗi dịp ánh xạ chính xác 4 bó hoa tuyển chọn trong SIGNATURE_BOUQUETS.
 */
export const OCCASION_THEMES: readonly OccasionTheme[] = [
  {
    id: 'hoa-sinh-nhat',
    label: 'Hoa sinh nhật',
    headline: 'Tuổi mới dịu ngọt',
    poeticQuote: 'Gói trọn nắng sớm Đà Lạt cho ngày sinh nhật thật đáng nhớ.',
    poeticSub:
      'Hoa tươi cắt cành mỗi sáng, thắt nơ lụa Pháp và giao hỏa tốc 60 phút tận tay tại TP.HCM.',
    bgHex: '#FFF1F4',
    headlineHex: '#831B38',
    petalColors: ['#F4B8C8', '#FAD8E1', '#E88DA5'],
    heroBouquetId: 'diu-ngot-pastel',
  },
  {
    id: 'hoa-tinh-yeu',
    label: 'Hoa tình yêu',
    headline: 'Gửi chút thương',
    poeticQuote: 'Không cần lời hoa mỹ, một bó hồng phấn đã nói thay trái tim.',
    poeticSub:
      'Từ sắc hồng pastel ngọt ngào đến thược dược đỏ ruby nồng nàn kèm thiệp viết tay gấp 3D.',
    bgHex: '#FCE8EE',
    headlineHex: '#7A1734',
    petalColors: ['#E69EB2', '#F8CDD8', '#C95A78'],
    heroBouquetId: 'hong-nhung-ruby',
  },
  {
    id: 'hoa-chuc-mung',
    label: 'Hoa chúc mừng',
    headline: 'Rực rỡ khởi đầu',
    poeticQuote: 'Chúc mừng cột mốc mới, tốt nghiệp, thăng chức và khai trương hanh thông.',
    poeticSub:
      'Hướng dương nắng sớm, lan hồ điệp hoàng kim và những sắc hoa tiếp thêm niềm vui trọn vẹn.',
    bgHex: '#FDF2E9',
    headlineHex: '#7C3A1D',
    petalColors: ['#F2C58A', '#F7DDB4', '#E8A58B'],
    heroBouquetId: 'huong-duong-rang-ro',
  },
  {
    id: 'hoa-cuoi',
    label: 'Hoa cưới',
    headline: 'Ngày chung đôi',
    poeticQuote: 'Bạch hồng và mao lương tinh khiết gói tay chuẩn phong cách Minimalist Pháp.',
    poeticSub:
      'Phom hoa cầm tay cô dâu và hoa lễ kỷ niệm thanh thoát, giữ trọn dáng đẹp suốt buổi tiệc.',
    bgHex: '#F9F6F7',
    headlineHex: '#4E333C',
    petalColors: ['#EBDDE1', '#FFFFFF', '#D8E3DC'],
    heroBouquetId: 'bach-hong-tinh-khoi',
  },
  {
    id: 'lan-ho-diep',
    label: 'Lan hồ điệp',
    headline: 'Sắc lan vượng khí',
    poeticQuote: 'Chậu lan Bảo Lộc tuyển chọn cành dày, nở rộ bền đẹp suốt 35 đến 45 ngày.',
    poeticSub:
      'Quà biếu đối tác, khai trương và tân gia sang trọng trong chậu gốm thủ công tinh giản.',
    bgHex: '#FBF3E4',
    headlineHex: '#6B4A1A',
    petalColors: ['#E8CA8C', '#F5E1B8', '#E9B9A6'],
    heroBouquetId: 'lan-ho-diep-hoang-kim',
  },
  {
    id: 'gui-loi-cam-on',
    label: 'Gửi lời cảm ơn',
    headline: 'Thay lời tri ân',
    poeticQuote: 'Cảm ơn những người đã luôn âm thầm nâng đỡ và sẻ chia cùng bạn.',
    poeticSub:
      'Phi yến xanh dịu mát, cẩm chướng phấn và hồng kem gửi trọn sự trân quý chân thành.',
    bgHex: '#EFF3F7',
    headlineHex: '#384D63',
    petalColors: ['#BFD3E8', '#DCE7F3', '#F4C4D0'],
    heroBouquetId: 'phi-yen-suong-mai',
  },
];

/**
 * 10 Dòng cành hoa tươi cắt cành từ Đà Lạt & nhập khẩu mỗi sáng tại Sài Gòn.
 * Mức giá thực tế FLEURÉ: 30.000đ – 95.000đ/cành.
 */
export const FLOWER_STEMS: readonly FlowerStem[] = [
  {
    id: 'juliet-rose',
    name: 'Hồng Juliet Đà Lạt',
    origin: 'Vườn cao nguyên Đà Lạt',
    pricePerStem: 55000,
    colorHex: '#F2B8A2',
    secondaryHex: '#FADAD0',
    image: '/images/stems/juliet-rose.jpg',
    stemCutoutImage: '/images/studio-stems/juliet-rose.png',
    seasonNote: 'Cánh xoáy cổ điển, hương trà dịu ngọt',
  },
  {
    id: 'ecuador-red',
    name: 'Hồng Đỏ Ruby Ecuador',
    origin: 'Nhập khẩu Ecuador · Tươi mỗi sáng',
    pricePerStem: 65000,
    colorHex: '#9D2547',
    secondaryHex: '#C94A6A',
    image: '/images/stems/ecuador-red.jpg',
    stemCutoutImage: '/images/studio-stems/ecuador-red.png',
    seasonNote: 'Bông đại nhung đỏ ruby, độ bền cao',
  },
  {
    id: 'white-rose',
    name: 'Bạch Hồng Ohara',
    origin: 'Ohara · Đà Lạt sương sớm',
    pricePerStem: 48000,
    colorHex: '#F7F3EE',
    secondaryHex: '#E5DDD6',
    image: '/images/stems/white-rose.jpg',
    stemCutoutImage: '/images/studio-stems/white-rose.png',
    seasonNote: 'Trắng ngà tinh khiết, hương thơm thanh nhẹ',
  },
  {
    id: 'peony',
    name: 'Mẫu Đơn Hồng Phấn',
    origin: 'Nhập khẩu Hà Lan / Cao nguyên',
    pricePerStem: 95000,
    colorHex: '#F2A9BC',
    secondaryHex: '#FAD8E1',
    image: '/images/stems/peony.jpg',
    stemCutoutImage: '/images/studio-stems/peony.png',
    seasonNote: 'Trăm lớp cánh lụa bung nở mềm mại',
  },
  {
    id: 'tulip',
    name: 'Tulip Hồng Nắng Mai',
    origin: 'Nhập khẩu Hà Lan',
    pricePerStem: 52000,
    colorHex: '#F4A6B8',
    secondaryHex: '#FCE0E7',
    image: '/images/stems/tulip.jpg',
    stemCutoutImage: '/images/studio-stems/tulip.png',
    seasonNote: 'Dáng khép thanh tao, vươn theo ánh sáng',
  },
  {
    id: 'hydrangea',
    name: 'Cẩm Tú Cầu Trại Mát',
    origin: 'Trại Mát · Đà Lạt',
    pricePerStem: 68000,
    colorHex: '#9BB7D4',
    secondaryHex: '#C9DCF0',
    image: '/images/stems/hydrangea.jpg',
    stemCutoutImage: '/images/studio-stems/hydrangea.png',
    seasonNote: 'Cầu hoa mây xanh tạo nền đầy đặn',
  },
  {
    id: 'orchid',
    name: 'Lan Hồ Điệp Bảo Lộc',
    origin: 'Nhà vườn Bảo Lộc · Lâm Đồng',
    pricePerStem: 90000,
    colorHex: '#E8C77B',
    secondaryHex: '#F7E7BE',
    image: '/images/stems/orchid.jpg',
    stemCutoutImage: '/images/studio-stems/orchid.png',
    seasonNote: 'Cánh dày sang trọng, nở bền nhiều tuần',
  },
  {
    id: 'delphinium',
    name: 'Phi Yến Xanh Sương Mai',
    origin: 'Đà Lạt / Nhập khẩu Nhật Bản',
    pricePerStem: 58000,
    colorHex: '#6E9BC5',
    secondaryHex: '#ADCBE8',
    image: '/images/stems/delphinium.jpg',
    stemCutoutImage: '/images/studio-stems/delphinium.png',
    seasonNote: 'Chuỗi hoa vươn cao thanh thoát',
  },
  {
    id: 'sunflower',
    name: 'Hướng Dương Nắng Sớm',
    origin: 'Nông trại Đơn Dương · Lâm Đồng',
    pricePerStem: 38000,
    colorHex: '#E2A832',
    secondaryHex: '#F6D57A',
    image: '/images/stems/sunflower.jpg',
    stemCutoutImage: '/images/studio-stems/sunflower.png',
    seasonNote: 'Nhụy nâu sẫm, sắc vàng ấm rạng rỡ',
  },
  {
    id: 'chamomile',
    name: 'Cúc Họa Mi Đà Lạt',
    origin: 'Vườn hoa Lạc Dương · Đà Lạt',
    pricePerStem: 30000,
    colorHex: '#FAF8F2',
    secondaryHex: '#E8C547',
    image: '/images/stems/chamomile.jpg',
    stemCutoutImage: '/images/studio-stems/chamomile.png',
    seasonNote: 'Nét chấm phá đồng nội trong trẻo',
  },
];

/** Cấu hình gợi ý 5 cành khởi đầu hài hòa cho bàn tự phối hoa FLEURÉ */
export const DEFAULT_STARTER_STEMS: Readonly<Record<string, number>> = {
  'juliet-rose': 3,
  peony: 2,
};

/**
 * 3 Phong cách giấy gói lụa Pháp & ruy băng thủ công tại FLEURÉ (ảnh studio tách nền trước/sau).
 */
export const WRAP_PAPERS: readonly WrapPaperOption[] = [
  {
    id: 'hong-phan',
    name: 'Lụa Hồng Phấn',
    price: 40000,
    paperHex: '#F9DDE5',
    paperFoldHex: '#EDC1CE',
    ribbonHex: '#9D2547',
    backImage: '/images/studio-wraps/wrap-hong-phan-back.png',
    frontImage: '/images/studio-wraps/wrap-hong-phan-front.png',
    description: 'Giấy lụa pastel mềm mịn đặc trưng FLEURÉ, thắt nơ ruy băng đỏ ruby tinh tế.',
  },
  {
    id: 'kem-phap',
    name: 'Voan Kem Pháp',
    price: 50000,
    paperHex: '#F7EFE6',
    paperFoldHex: '#E8D9CA',
    ribbonHex: '#B86279',
    backImage: '/images/studio-wraps/wrap-kem-phap-back.png',
    frontImage: '/images/studio-wraps/wrap-kem-phap-front.png',
    description: 'Lớp voan kem mờ phong cách Minimalist Pháp, nâng đỡ trọn vẹn mọi sắc hoa nhẹ nhàng.',
  },
  {
    id: 'do-ruby',
    name: 'Giấy Đỏ Ruby',
    price: 60000,
    paperHex: '#6E1832',
    paperFoldHex: '#4E0E22',
    ribbonHex: '#F2B8C6',
    backImage: '/images/studio-wraps/wrap-do-ruby-back.png',
    frontImage: '/images/studio-wraps/wrap-do-ruby-front.png',
    description: 'Giấy mỹ thuật đỏ rượu vang dập vân nhẹ, phối ruy băng hồng phấn champagne sang trọng.',
  },
];

/**
 * 4 Quà tặng kèm tinh tế trong ngăn kéo hoàn tất đơn hoa FLEURÉ.
 */
export const ADDON_OPTIONS: readonly AddonOption[] = [
  {
    id: 'watercolor-card',
    name: 'Thiệp vẽ màu nước FLEURÉ',
    price: 35000,
    description: 'Giấy cotton 300gsm vẽ họa tiết hoa màu nước, viết tay theo lời chúc của bạn',
  },
  {
    id: 'rose-white-tea-candle',
    name: 'Nến thơm Hoa Hồng & Trà Trắng',
    price: 180000,
    description: 'Sáp đậu nành thiên nhiên, hương hoa hồng dịu nhẹ hòa quyện trà trắng (150g)',
  },
  {
    id: 'fresh-chocolate-9',
    name: 'Hộp Socola Tươi 9 viên',
    price: 195000,
    description: 'Nama socola tươi cacao nguyên chất thắt ruy băng đồng bộ tông FLEURÉ',
  },
  {
    id: 'chrysal-flower-food',
    name: 'Gói dưỡng hoa Chrysal Hà Lan',
    price: 25000,
    description: 'Giữ nước trong và kéo dài độ tươi của hoa thêm 3 đến 5 ngày',
  },
];

/**
 * 3 Mã ưu đãi chính thức của FLEURÉ — Flower Boutique.
 */
export const VOUCHER_OPTIONS: readonly VoucherOption[] = [
  {
    code: 'FLEURE20',
    label: 'Giảm 20%',
    description: 'Giảm 20% cho đơn từ 450.000đ',
    minSubtotal: 450000,
  },
  {
    code: 'YEUHOA15',
    label: 'Giảm 15%',
    description: 'Giảm 15% thành viên mới FLEURÉ',
    minSubtotal: 0,
  },
  {
    code: 'FREESHIP60',
    label: 'Freeship 60p',
    description: 'Miễn phí giao hỏa tốc 60 phút nội thành TP.HCM',
    minSubtotal: 0,
  },
];

/**
 * 6 Thức hoa cao nguyên theo mùa trong "Lịch mùa hoa Đà Lạt".
 */
export const DALAT_SEASONAL_FLOWERS: readonly SeasonalFlower[] = [
  {
    id: 'season-tulip',
    monthLabel: 'Tháng 1 – 2',
    name: 'Tulip Hồng Nắng Mai',
    scentLevel: 'Thoang thoảng tinh khôi',
    vaseLife: '5 – 8 ngày',
    poeticNote:
      'Những đóa tulip khép hờ trong tiết xuân dịu nhẹ, vươn cánh mượt mà đón nắng đầu năm.',
    image: '/images/stems/tulip.jpg',
    linkedBouquetId: 'diu-ngot-pastel',
  },
  {
    id: 'season-dalat-ohara',
    monthLabel: 'Tháng 3 – 4',
    name: 'Hồng Ohara Kem Dâu Đà Lạt',
    scentLevel: 'Hương trái cây ngọt thanh',
    vaseLife: '6 – 8 ngày',
    poeticNote:
      'Cắt tại vườn Đà Lạt lúc sương còn đọng, tâm hoa xoáy tròn phớt hồng kem dâu cực kỳ nịnh mắt.',
    image: '/images/season-dalat-ohara.png',
    linkedBouquetId: 'bach-hong-tinh-khoi',
  },
  {
    id: 'season-peony',
    monthLabel: 'Tháng 5 – 6',
    name: 'Mẫu Đơn Phấn Cao Nguyên',
    scentLevel: 'Hương phấn thanh dịu',
    vaseLife: '5 – 7 ngày',
    poeticNote:
      'Khi nắng đầu mùa ghé cao nguyên, từng búp mẫu đơn hé nở trăm lớp cánh mềm tựa lụa tơ.',
    image: '/images/season-peony.png',
    linkedBouquetId: 'cam-chuong-ngot-ngao',
  },
  {
    id: 'season-hydrangea',
    monthLabel: 'Tháng 7 – 8',
    name: 'Cẩm Tú Cầu Trại Mát',
    scentLevel: 'Hương cỏ mây mát lành',
    vaseLife: '7 – 10 ngày',
    poeticNote:
      'Những quả cầu mây xanh biếc từ đồi Trại Mát mang hơi thở mát dịu về giữa lòng Sài Gòn.',
    image: '/images/season-hydrangea.png',
    linkedBouquetId: 'phi-yen-suong-mai',
  },
  {
    id: 'season-dalat-orchid',
    monthLabel: 'Tháng 9 – 10',
    name: 'Lan Hồ Điệp Bảo Lộc',
    scentLevel: 'Hương lan nhẹ thanh quý',
    vaseLife: '35 – 45 ngày',
    poeticNote:
      'Cành lan Bảo Lộc cánh dày, chuỗi bông đều tăm tắp, nở rộ bền bỉ qua nhiều tuần lễ.',
    image: '/images/season-dalat-orchid.png',
    linkedBouquetId: 'lan-ho-diep-hoang-kim',
  },
  {
    id: 'season-daisy',
    monthLabel: 'Tháng 11 – 12',
    name: 'Cúc Họa Mi Sương Sớm Đà Lạt',
    scentLevel: 'Hương đồng nội nhẹ nhàng',
    vaseLife: '7 – 9 ngày',
    poeticNote:
      'Gió se lạnh cuối năm gọi về những cánh cúc trắng nhụy vàng trong trẻo từ vùng đất Lạc Dương.',
    image: '/images/season-daisy.png',
    linkedBouquetId: 'huong-duong-rang-ro',
  },
];

/** Các lựa chọn ngày giao hoa */
export const DELIVERY_DAY_OPTIONS: readonly DeliveryDayOption[] = [
  'Hôm nay',
  'Ngày mai',
  'Chọn ngày',
];

/** Các khung giờ giao hoa hỏa tốc nội thành TP.HCM (mở cửa 07:30 – 21:00 mỗi ngày) */
export const DELIVERY_TIME_SLOTS: readonly string[] = [
  'Giao hỏa tốc 60 phút',
  '09:00 – 11:30',
  '13:30 – 16:30',
  '17:00 – 20:30',
];

/** Câu chúc gợi ý ngắn gọn để điền nhanh vào thiệp gấp 3D FLEURÉ */
export const GREETING_SUGGESTIONS: readonly string[] = [
  'Chúc bạn một ngày thật dịu dàng và rạng rỡ.',
  'Gói chút hoa, gửi chút thương đến người luôn ở trong tim mình.',
  'Chúc mừng cột mốc mới thật rực rỡ, hanh thông và trọn vẹn niềm vui.',
  'Cảm ơn vì đã luôn đồng hành, lắng nghe và sẻ chia ấm áp.',
];

// ============================================================================
// DỮ LIỆU DỰ PHÒNG 0MS CHO 5 COLLECTION MONGODB (HIỂN THỊ TỨC THÌ KHI RENDER KHỞI ĐỘNG)
// ============================================================================

export const FALLBACK_CATEGORIES: readonly ApiCategory[] = [
  {
    id: 1,
    name: 'Hoa sinh nhật',
    slug: 'hoa-sinh-nhat',
    order: 1,
    icon: 'cake',
    description: 'Bó hoa pastel và giỏ hoa rực rỡ gửi lời chúc mừng tuổi mới trọn vẹn.',
  },
  {
    id: 2,
    name: 'Hoa tình yêu',
    slug: 'hoa-tinh-yeu',
    order: 2,
    icon: 'heart',
    description: 'Hồng phấn cổ điển, tulip hồng và hồng tình nhân lãng mạn.',
  },
  {
    id: 3,
    name: 'Hoa chúc mừng',
    slug: 'hoa-chuc-mung',
    order: 3,
    icon: 'party-popper',
    description: 'Hướng dương và hộp hoa khai trương, tốt nghiệp, thăng chức.',
  },
  {
    id: 4,
    name: 'Hoa cưới',
    slug: 'hoa-cuoi',
    order: 4,
    icon: 'gem',
    description: 'Hoa cầm tay cô dâu và bình hoa bàn tiệc Minimalist Châu Âu.',
  },
  {
    id: 5,
    name: 'Lan hồ điệp',
    slug: 'lan-ho-diep',
    order: 5,
    icon: 'flower-2',
    description: 'Chậu lan hồ điệp sang trọng, nở bền 30–45 ngày cho tân gia & sảnh lớn.',
  },
];

export const FALLBACK_BANNERS: readonly ApiBanner[] = [
  {
    id: 1,
    slug: 'fleure-signature-pastel-tuoi-da-lat',
    badge: 'FLEURÉ Signature',
    title: 'Gói chút hoa, gửi chút thương.',
    subtitle: 'Hồng Pastel & Tulip tươi Đà Lạt giao nhanh 60 phút nội thành.',
    ctaLabel: 'Khám phá ngay',
    ctaRoute: '/products',
    image: '/assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
    order: 1,
    isActive: true,
  },
  {
    id: 2,
    slug: 'flash-sale-30-uu-dai-cuoi-tuan',
    badge: 'Flash Sale -30%',
    title: 'Ngọt ngào ưu đãi cuối tuần',
    subtitle: 'Săn ngay mã FLEURE20 và bộ sưu tập hộp hoa giảm đến 30%.',
    ctaLabel: 'Săn ưu đãi',
    ctaRoute: '/promotions',
    image: '/assets/hasfarm/hop-hoa-hanh-phuc-721.jpg',
    order: 2,
    isActive: true,
  },
  {
    id: 3,
    slug: 'atelier-video-nghe-thuat-goi-hoa-phap',
    badge: 'Atelier Video',
    title: 'Nghệ thuật gói hoa chuẩn Pháp',
    subtitle: 'Xem video hướng dẫn phối màu giấy lụa & giữ hoa tươi lâu.',
    ctaLabel: 'Xem trải nghiệm',
    ctaRoute: '/experience',
    image: '/assets/hasfarm/bo-hoa-tulip-806.jpg',
    order: 3,
    isActive: true,
  },
];

export const FALLBACK_API_PRODUCTS: readonly ApiProduct[] = [
  {
    id: 12,
    name: 'Bó Hoa Dịu Ngọt Pastel FLEURÉ',
    slug: 'bo-hoa-diu-ngot-pastel-fleure',
    categoryId: 1,
    category: 'Hoa sinh nhật',
    categorySlug: 'hoa-sinh-nhat',
    price: '390.000đ',
    oldPrice: '460.000đ',
    priceValue: 390000,
    oldPriceValue: 460000,
    image: '/assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
    description:
      'Bó hoa hồng kem dâu phối cùng hoa cẩm chướng và lá bạc eucalyptus, gói giấy lụa Hàn Quốc mềm mại chuẩn phong cách Pháp.',
    meaning: 'Dịu dàng, trân trọng và lời chúc ngọt ngào gửi đến người thương.',
    discount: 15,
    sold: 142,
    createdAt: '2026-04-28',
    badge: 'NEW',
    badgeClass: 'label-new',
  },
  {
    id: 11,
    name: 'Bó Hoa Tulip Hồng Nắng Mai',
    slug: 'bo-hoa-tulip-hong-nang-mai',
    categoryId: 2,
    category: 'Hoa tình yêu',
    categorySlug: 'hoa-tinh-yeu',
    price: '480.000đ',
    oldPrice: '',
    priceValue: 480000,
    oldPriceValue: 480000,
    image: '/assets/hasfarm/bo-hoa-tulip-806.jpg',
    description:
      'Những búp tulip hồng nhập khẩu bung nở vừa độ, thân xanh mướt, thắt nơ ruy băng lụa thanh lịch.',
    meaning: 'Tình yêu chân thành, lời tỏ tình tinh tế và niềm vui thuần khiết.',
    discount: 0,
    sold: 118,
    createdAt: '2026-04-26',
    badge: 'NEW',
    badgeClass: 'label-new',
  },
  {
    id: 10,
    name: 'Hộp Hoa Hạnh Phúc Ngọc Ngà',
    slug: 'hop-hoa-hanh-phuc-ngoc-nga',
    categoryId: 3,
    category: 'Hoa chúc mừng',
    categorySlug: 'hoa-chuc-mung',
    price: '490.000đ',
    oldPrice: '620.000đ',
    priceValue: 490000,
    oldPriceValue: 620000,
    image: '/assets/hasfarm/hop-hoa-hanh-phuc-721.jpg',
    description:
      'Thiết kế hộp hoa cao cấp kết hợp hồng phấn Ohara thơm dịu và lá bạc xanh pastel, giữ tươi 5–7 ngày.',
    meaning: 'Sự viên mãn, đong đầy yêu thương trong mọi dịp kỷ niệm.',
    discount: 21,
    sold: 165,
    createdAt: '2026-04-25',
    badge: '-21%',
    badgeClass: 'label-sale',
  },
  {
    id: 9,
    name: 'Giỏ Hoa Yêu Thương Rực Rỡ',
    slug: 'gio-hoa-yeu-thuong-ruc-ro',
    categoryId: 1,
    category: 'Hoa sinh nhật',
    categorySlug: 'hoa-sinh-nhat',
    price: '520.000đ',
    oldPrice: '650.000đ',
    priceValue: 520000,
    oldPriceValue: 650000,
    image: '/assets/hasfarm/gio-hoa-yeu-thuong-861.jpg',
    description:
      'Giỏ mây thủ công đan tay điểm xuyết đồng tiền hồng phấn, cẩm chướng kem và cát tường đầy sức sống.',
    meaning: 'Gửi gắm lời cảm ơn chân thành và sự ấm áp đến gia đình, bạn bè.',
    discount: 20,
    sold: 96,
    createdAt: '2026-04-24',
    badge: '-20%',
    badgeClass: 'label-sale',
  },
  {
    id: 8,
    name: 'Hoa Hồng Pastel Phấn Cổ Điển',
    slug: 'hoa-hong-pastel-phan-co-dien',
    categoryId: 2,
    category: 'Hoa tình yêu',
    categorySlug: 'hoa-tinh-yeu',
    price: '360.000đ',
    oldPrice: '480.000đ',
    priceValue: 360000,
    oldPriceValue: 480000,
    image: '/assets/flowers/carnation.jpg',
    description:
      'Những đóa hồng nhung màu phấn hồng cổ điển nhiều lớp cánh bồng bềnh từ nông trại Đà Lạt.',
    meaning: 'Biểu tượng của trái tim dịu êm và lời hẹn ước bền lâu.',
    discount: 25,
    sold: 184,
    createdAt: '2026-04-22',
    badge: '-25%',
    badgeClass: 'label-sale',
  },
  {
    id: 7,
    name: 'Lan Hồ Điệp Hồng Phát Phú Quý',
    slug: 'lan-ho-diep-hong-phat-phu-quy',
    categoryId: 5,
    category: 'Lan hồ điệp',
    categorySlug: 'lan-ho-diep',
    price: '890.000đ',
    oldPrice: '1.150.000đ',
    priceValue: 890000,
    oldPriceValue: 1150000,
    image: '/assets/hasfarm/lan-ho-diep-hong-phat-144.jpg',
    description:
      'Chậu sứ men ngọc trồng 5 cành lan hồ điệp hồng tím căng tràn, bền hoa hơn 30 ngày thích hợp khai trương và tân gia.',
    meaning: 'Tài lộc vượng phát, thanh cao và lời chúc thành công rực rỡ.',
    discount: 23,
    sold: 74,
    createdAt: '2026-04-20',
    badge: '-23%',
    badgeClass: 'label-sale',
  },
  {
    id: 6,
    name: 'Hoa Bàn Tiệc Calimero Kem Sữa',
    slug: 'hoa-ban-tiec-calimero-kem-sua',
    categoryId: 4,
    category: 'Hoa cưới',
    categorySlug: 'hoa-cuoi',
    price: '310.000đ',
    oldPrice: '',
    priceValue: 310000,
    oldPriceValue: 310000,
    image: '/assets/flowers/calimero.jpg',
    description:
      'Cụm hồng kem đào và hoa đồng nội nhỏ xinh cắm bình gốm phong cách Minimalist Châu Âu.',
    meaning: 'Sự tinh tế, thanh khiết và ấm áp cho ngày chung đôi.',
    discount: 0,
    sold: 89,
    createdAt: '2026-04-18',
    badge: 'NEW',
    badgeClass: 'label-new',
  },
  {
    id: 5,
    name: 'Bình Tulip Hồng Lụa Tinh Khôi',
    slug: 'binh-tulip-hong-lua-tinh-khoi',
    categoryId: 4,
    category: 'Hoa cưới',
    categorySlug: 'hoa-cuoi',
    price: '245.000đ',
    oldPrice: '350.000đ',
    priceValue: 245000,
    oldPriceValue: 350000,
    image: '/assets/flowers/baby-breath.jpg',
    description:
      '10 cành tulip cánh kép hồng ruby rạng rỡ thắt dây cói tự nhiên kèm bình thủy tinh thanh lịch.',
    meaning: 'Sức sống căng tràn, may mắn và tình cảm trọn vẹn.',
    discount: 30,
    sold: 210,
    createdAt: '2026-04-16',
    badge: '-30%',
    badgeClass: 'label-sale',
  },
  {
    id: 4,
    name: 'Cúc Ping Pong Hồng Đáng Yêu',
    slug: 'cuc-ping-pong-hong-dang-yeu',
    categoryId: 1,
    category: 'Hoa sinh nhật',
    categorySlug: 'hoa-sinh-nhat',
    price: '260.000đ',
    oldPrice: '320.000đ',
    priceValue: 260000,
    oldPriceValue: 320000,
    image: '/assets/hasfarm/cuc-ping-pong-hong.jpg',
    description:
      'Những bông cúc ping pong tròn xoe hồng phấn tươi tắn, dễ thương và giữ dáng cực lâu suốt tuần.',
    meaning: 'Niềm vui tròn đầy và năng lượng tích cực mỗi ngày.',
    discount: 19,
    sold: 131,
    createdAt: '2026-04-14',
    badge: '-19%',
    badgeClass: 'label-sale',
  },
  {
    id: 3,
    name: 'Tiểu Hồ Điệp Thanh Tú Để Bàn',
    slug: 'tieu-ho-diep-thanh-tu-de-ban',
    categoryId: 5,
    category: 'Lan hồ điệp',
    categorySlug: 'lan-ho-diep',
    price: '420.000đ',
    oldPrice: '',
    priceValue: 420000,
    oldPriceValue: 420000,
    image: '/assets/hasfarm/tieu-ho-diep-thanh-tu-076.jpg',
    description:
      'Chậu tiểu hồ điệp mini nhiều nhánh hoa nhỏ nhắn màu hồng cam dịu dàng, điểm nhấn tinh tế cho bàn làm việc.',
    meaning: 'Bình an, thanh lịch và khơi nguồn cảm hứng sáng tạo.',
    discount: 0,
    sold: 63,
    createdAt: '2026-04-12',
    badge: 'NEW',
    badgeClass: 'label-new',
  },
  {
    id: 2,
    name: 'Bó Hướng Dương Rạng Rỡ Nắng',
    slug: 'bo-huong-duong-rang-ro-nang',
    categoryId: 3,
    category: 'Hoa chúc mừng',
    categorySlug: 'hoa-chuc-mung',
    price: '295.000đ',
    oldPrice: '370.000đ',
    priceValue: 295000,
    oldPriceValue: 370000,
    image: '/assets/flowers/sunflower.jpg',
    description:
      'Hướng dương cánh vàng rực rỡ truyền tải khí thế tươi mới trong ngày tốt nghiệp, thăng chức hay khai trương.',
    meaning: 'Niềm tin kiên định và tương lai luôn hướng về ánh mặt trời.',
    discount: 20,
    sold: 156,
    createdAt: '2026-04-10',
    badge: '-20%',
    badgeClass: 'label-sale',
  },
  {
    id: 1,
    name: 'Chậu Hồng Tình Nhân Rực Rỡ',
    slug: 'chau-hong-tinh-nhan-ruc-ro',
    categoryId: 2,
    category: 'Hoa tình yêu',
    categorySlug: 'hoa-tinh-yeu',
    price: '350.000đ',
    oldPrice: '440.000đ',
    priceValue: 350000,
    oldPriceValue: 440000,
    image: '/assets/hasfarm/chau-hoa-thiet-ke-144.png',
    description:
      'Chậu hoa hồng đỏ thắm thiết kế phủ xanh mướt mắt, tượng trưng cho tình cảm bền bỉ và chân thành.',
    meaning: 'Yêu thương trọn vẹn, thủy chung và đầy đam mê.',
    discount: 20,
    sold: 192,
    createdAt: '2026-04-08',
    badge: '-20%',
    badgeClass: 'label-sale',
  },
];

export const FALLBACK_POSTS: readonly ApiPost[] = [
  {
    id: 1,
    slug: '5-bi-quyet-giu-hoa-tuoi-lau-gap-doi-ngay-nang-nong',
    title: '5 Bí Quyết Giữ Hoa Tươi Lâu Gấp Đôi Ngày Nắng Nóng',
    excerpt:
      'Chỉ với vài bước cắt gốc vát góc 45 độ, thay nước mát mỗi sáng và thêm gói dưỡng hoa đúng liều lượng...',
    content: [
      'Hoa tươi cắt cành nhạy cảm nhất với vi khuẩn phát triển trong nước và bọt khí làm nghẽn mạch dẫn. Khi vừa nhận bó hoa từ FLEURÉ, bạn hãy gỡ dây buộc nhẹ nhàng để các thân hoa thở thoải mái hơn.',
      'Dùng kéo sắc cắt vát gốc khoảng 1–2 cm dưới vòi nước sạch theo góc 45 độ nhằm tăng diện tích hút nước. Loại bỏ toàn bộ lá ngập dưới mực nước trong bình để giữ nước luôn trong suốt.',
      'Đặt bình hoa ở nơi thoáng gió, tránh ánh nắng trực tiếp buổi trưa và xa nguồn nhiệt hoặc trái cây chín (vì khí ethylene làm hoa nhanh rụng cánh).',
    ],
    careTip:
      'Thêm 1 gói dưỡng hoa Chrysal hoặc vài giọt chanh + đường giúp pH nước ổn định suốt 5–7 ngày.',
    image: '/assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
    category: 'Chăm sóc hoa',
    author: 'FLEURÉ Florist Team',
    publishedAt: '2026-04-29',
    readTimeMinutes: 4,
    relatedProductId: 12,
  },
  {
    id: 2,
    slug: 'ngon-ngu-cua-sac-hong-pastel-khi-diu-dang-len-tieng',
    title: 'Ngôn Ngữ Của Sắc Hồng Pastel: Khi Dịu Dàng Lên Tiếng',
    excerpt:
      'Không nồng cháy như hồng đỏ, hoa hồng pastel kể câu chuyện về lòng biết ơn, sự ân cần và khởi đầu an yên...',
    content: [
      'Trong nghệ thuật tặng hoa Pháp, gam màu hồng phấn pastel luôn là lựa chọn hàng đầu cho những cảm xúc tinh tế. Sắc hồng nhẹ gợi cảm giác thư thái, gần gũi và đầy nữ tính.',
      'Một bó hồng pastel phối baby trắng cực kỳ phù hợp tặng sinh nhật bạn thân, kỷ niệm ngày yêu, cảm ơn mẹ hay chúc mừng đồng nghiệp nhận công việc mới.',
      'Tại FLEURÉ, từng cành hồng được chọn lọc ở độ hé 30–40% để khi đến tay người nhận, hoa tiếp tục nở rộ rạng rỡ thêm nhiều ngày sau đó.',
    ],
    careTip:
      'Phun sương thật nhẹ lên lớp cánh ngoài vào buổi sáng sớm, tránh xịt thẳng vào nhụy hoa.',
    image: '/assets/flowers/rose-pink.jpg',
    category: 'Ý nghĩa hoa',
    author: 'Minh Anh • Atelier FLEURÉ',
    publishedAt: '2026-04-27',
    readTimeMinutes: 3,
    relatedProductId: 8,
  },
  {
    id: 3,
    slug: 'cach-phoi-giay-lua-han-quoc-tao-dang-bo-hoa-chuan-phap',
    title: 'Cách Phối Giấy Lụa Hàn Quốc Tạo Dáng Bó Hoa Chuẩn Pháp',
    excerpt:
      'Bí mật nằm ở nếp gấp tạo độ phồng tự nhiên, phối 2 lớp giấy tương phản nhẹ và chiếc nơ ruy băng ruby thanh mảnh...',
    content: [
      'Một bó hoa đẹp không chỉ nhờ hoa tươi mà còn đến từ phom giấy gói tôn dáng từng cành lá. Phong cách FLEURÉ ưu tiên giấy lụa mờ chống thấm màu kem sữa kết hợp hồng tro.',
      'Kỹ thuật xếp nếp xoắn ốc phần thân hoa giúp bó hoa đứng vững khi đặt trên bàn tiệc mà không bị bẹp phần cánh hoa phía sau.',
      'Cuối cùng, sợi ruy băng satin ruby bản nhỏ được thắt đuôi dài bay bổng chính là điểm nhấn chữ ký mang tinh thần "Gói chút hoa, gửi chút thương".',
    ],
    careTip:
      'Khi trưng bày lâu ngày, bạn có thể tháo giấy gói nhưng giữ nguyên sợi ruy băng thắt nhẹ quanh cổ bình.',
    image: '/assets/hasfarm/bo-hoa-tulip-806.jpg',
    category: 'Nghệ thuật gói',
    author: 'Atelier FLEURÉ',
    publishedAt: '2026-04-25',
    readTimeMinutes: 5,
    relatedProductId: 11,
  },
];

export const FALLBACK_EXPERIENCES: readonly ApiExperienceVideo[] = [
  {
    id: 1,
    slug: 'hanh-trinh-goi-bo-hoa-hong-pastel-signature-tai-fleure',
    title: 'Hành Trình Gói Bó Hoa Hồng Pastel Signature Tại FLEURÉ',
    subtitle:
      'Từ những cành hồng vừa cắt sương Đà Lạt đến bó hoa lụa buộc nơ ruby chỉ trong 12 phút.',
    category: 'Atelier FLEURÉ',
    duration: '00:08',
    views: 3420,
    posterImage: '/assets/flowers/hero-flower.jpg',
    videoUrl: '/assets/flower-atelier.mp4',
    steps: [
      'Làm sạch gai & tuốt lá phần gốc tiếp xúc nước.',
      'Bó xoắn ốc theo tỷ lệ vàng giúp tán hoa tròn đều 360°.',
      'Bọc 2 lớp giấy lụa Hàn Quốc chống ẩm & thắt nơ satin FLEURÉ.',
    ],
    linkedProductId: 12,
    publishedAt: '2026-04-28',
  },
  {
    id: 2,
    slug: 'cach-chon-phoi-mau-tulip-hong-voi-la-bac-eucalyptus',
    title: 'Cách Chọn & Phối Màu Tulip Hồng Với Lá Bạc Eucalyptus',
    subtitle:
      'Mẹo uốn nhẹ thân tulip và xử lý nước lạnh để cánh hoa giữ dáng đứng sang trọng.',
    category: 'Kỹ thuật bó hoa',
    duration: '00:08',
    views: 2180,
    posterImage: '/assets/hasfarm/bo-hoa-tulip-806.jpg',
    videoUrl: '/assets/flower-atelier.mp4',
    steps: [
      'Để nguyên hoa trong giấy báo ẩm 30 phút cho thân hút no nước.',
      'Cắt gốc bằng dao bén và thêm 2 viên đá nhỏ vào nước cắm.',
      'Đan xen lá bạc eucalyptus quanh viền ngoài làm nổi bật sắc hồng.',
    ],
    linkedProductId: 11,
    publishedAt: '2026-04-24',
  },
];
