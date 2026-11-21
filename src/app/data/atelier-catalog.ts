import {
  AddonOption,
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
