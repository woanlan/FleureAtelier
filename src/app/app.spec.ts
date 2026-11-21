import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { OrderDrawer } from './components/order-drawer/order-drawer';
import { ApiProduct, ApiSavedOrder } from './models/atelier.models';
import { AtelierService } from './services/atelier.service';

const MOCK_API_PRODUCTS: ApiProduct[] = [
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
    image: 'assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
    description: 'Bó hoa hồng kem dâu phối cùng hoa cẩm chướng và lá bạc eucalyptus.',
    meaning: 'Dịu dàng, trân trọng và lời chúc ngọt ngào gửi đến người thương.',
    discount: 15,
    sold: 142,
    badge: 'NEW',
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
    image: 'assets/hasfarm/bo-hoa-tulip-806.jpg',
    description: 'Những búp tulip hồng nhập khẩu bung nở vừa độ.',
    meaning: 'Tình yêu chân thành, lời tỏ tình tinh tế.',
    discount: 0,
    sold: 118,
    badge: 'NEW',
  },
];

/**
 * Bộ kiểm thử đơn vị (Vitest + Angular TestBed + HttpTestingController) cho "FLEURÉ — Flower Boutique":
 * 1. Khởi tạo App thành công, render duy nhất một thẻ `<h1>` chứa "FLEURÉ" và gắn `[inert]` lên nền khi mở ngăn kéo.
 * 2. Đồng bộ danh mục hoa từ `GET /api/products` (live & fallback khi lỗi mạng).
 * 3. Chuyển đổi 6 dịp tặng trong `AtelierService` cập nhật chính xác `activeOccasion().headline`.
 * 4. Bàn tự phối hoa kiểm tra 0 cành (tổng = 0đ), chặn dưới 3 cành và mở đơn khi >= 3 cành.
 * 5. Bộ áp mã ưu đãi FLEURÉ (`FLEURE20`, `YEUHOA15`, `FREESHIP60`) và miễn phí giao 60p từ 399.000đ.
 * 6. `OrderDrawer` xác thực tên/SĐT/địa chỉ, gửi `POST /api/orders` đúng hợp đồng MongoDB và hiển thị mã `#FL-xxxxxx`.
 * 7. Phục hồi lỗi khi `POST /api/orders` thất bại (giữ nguyên dữ liệu nhập & cho phép tạo phiếu Zalo tạm).
 */
describe('FLEURÉ — Flower Boutique (Render / MongoDB API)', () => {
  beforeEach(() => {
    try {
      window.localStorage.clear();
    } catch {
      // Bỏ qua nếu môi trường kiểm thử không cho phép xóa localStorage
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('khởi tạo ứng dụng gốc, chỉ render duy nhất một thẻ <h1> chứa "FLEURÉ" và khóa nền bằng inert khi mở Drawer', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);
    fixture.detectChanges();
    await fixture.whenStable();

    const rootElement = fixture.nativeElement as HTMLElement;
    const h1Elements = rootElement.querySelectorAll('h1');

    expect(fixture.componentInstance).toBeTruthy();
    expect(h1Elements.length).toBe(1);
    expect(h1Elements[0]?.textContent).toContain('FLEURÉ');

    const atelier = TestBed.inject(AtelierService);
    const shellEl = rootElement.querySelector('.atelier-page-shell') as HTMLElement | null;
    expect(shellEl?.hasAttribute('inert')).toBe(false);
    atelier.openOrderForBouquet(atelier.bouquets()[0]);
    fixture.detectChanges();
    expect(shellEl?.hasAttribute('inert')).toBe(true);
    httpMock.verify();
  });

  it('nạp danh mục sản phẩm thật từ GET /api/products và giữ fallback an toàn khi mất kết nối', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const atelier = TestBed.inject(AtelierService);

    expect(atelier.catalogStatus()).toBe('loading');
    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);

    expect(atelier.catalogStatus()).toBe('live');
    expect(atelier.bouquets().length).toBe(2);
    expect(atelier.bouquets()[0].apiProductId).toBe(12);
    expect(atelier.bouquets()[0].image).toBe('/images/bouquet-juliet-peony.png');

    // Kiểm thử nhánh lỗi mạng -> chuyển về trạng thái fallback mà vẫn giữ danh mục hiển thị
    atelier.loadCatalogFromApi();
    httpMock
      .expectOne('/api/products')
      .flush({ message: 'Server waking up' }, { status: 503, statusText: 'Service Unavailable' });

    expect(atelier.catalogStatus()).toBe('fallback');
    expect(atelier.catalogError()).toBeTruthy();
    expect(atelier.bouquets().length).toBeGreaterThan(0);
    httpMock.verify();
  });

  it('cập nhật activeOccasion().headline chính xác khi chuyển đổi dịp tặng trong AtelierService', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const atelier = TestBed.inject(AtelierService);

    expect(atelier.activeOccasion().id).toBe('hoa-sinh-nhat');
    expect(atelier.activeOccasion().headline).toBe('Tuổi mới dịu ngọt');

    atelier.selectOccasion('hoa-tinh-yeu');
    expect(atelier.activeOccasion().id).toBe('hoa-tinh-yeu');
    expect(atelier.activeOccasion().headline).toBe('Gửi chút thương');

    atelier.selectOccasion('lan-ho-diep');
    expect(atelier.activeOccasion().id).toBe('lan-ho-diep');
    expect(atelier.activeOccasion().headline).toBe('Sắc lan vượng khí');
  });

  it('chặn đặt bó tự phối dưới 3 cành (báo lỗi customBuilderError) và mở đơn thành công khi đủ >= 3 cành', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const atelier = TestBed.inject(AtelierService);

    atelier.resetCustomBouquet();
    expect(atelier.totalCustomStems()).toBe(0);
    expect(atelier.customBouquetTotal()).toBe(0);
    expect(atelier.openOrderForCustomBouquet()).toBe(false);

    atelier.setStemCount('juliet-rose', 2);
    expect(atelier.totalCustomStems()).toBe(2);

    const blockedResult = atelier.openOrderForCustomBouquet();
    expect(blockedResult).toBe(false);
    expect(atelier.customBuilderError()).toBeTruthy();
    expect(atelier.drawerOpen()).toBe(false);

    atelier.incrementStem('peony');
    expect(atelier.totalCustomStems()).toBe(3);
    expect(atelier.customBuilderError()).toBeNull();

    const successResult = atelier.openOrderForCustomBouquet();
    expect(successResult).toBe(true);
    expect(atelier.drawerOrderSource()).toBe('custom');
    expect(atelier.drawerOpen()).toBe(true);
  });

  it('áp dụng chính xác mã ưu đãi FLEURE20, YEUHOA15, FREESHIP60 và ngưỡng miễn phí giao 60p từ 399.000đ', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const atelier = TestBed.inject(AtelierService);

    // Mở mẫu đầu tiên (390.000đ), mặc định cỡ Nhỏ (390.000đ < 399.000đ -> phí giao 25.000đ)
    atelier.openOrderForBouquet(atelier.bouquets()[0]);
    expect(atelier.selectedSize()).toBe('Nhỏ');
    expect(atelier.drawerSubtotal()).toBe(390000);
    expect(atelier.shippingFee()).toBe(25000);

    // Mã FLEURE20 yêu cầu đơn >= 450.000đ -> báo lỗi ở 390.000đ
    atelier.applyVoucher('FLEURE20');
    expect(atelier.appliedVoucherCode()).toBeNull();
    expect(atelier.voucherError()).toContain('450.000đ');

    // Áp FREESHIP60 -> miễn phí giao hỏa tốc 60p
    atelier.applyVoucher('FREESHIP60');
    expect(atelier.shippingFee()).toBe(0);
    expect(atelier.drawerTotalPrice()).toBe(390000);

    // Nâng lên cỡ Vừa (+150.000đ -> 540.000đ >= 450.000đ) và áp FLEURE20 (giảm 20% = 108.000đ, miễn ship)
    atelier.selectedSize.set('Vừa');
    atelier.applyVoucher('FLEURE20');
    expect(atelier.voucherDiscount()).toBe(108000);
    expect(atelier.shippingFee()).toBe(0);
    expect(atelier.drawerTotalPrice()).toBe(432000);
  });

  it('OrderDrawer xác thực tên/SĐT/địa chỉ, gửi POST /api/orders lưu MongoDB và hiển thị mã #FL-xxxxxx', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDrawer],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const httpMock = TestBed.inject(HttpTestingController);
    const atelier = TestBed.inject(AtelierService);
    const fixture = TestBed.createComponent(OrderDrawer);

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);

    atelier.openOrderForBouquet(atelier.bouquets()[0]);
    atelier.recipientName.set('');
    atelier.recipientPhone.set('');
    atelier.recipientAddress.set('');
    fixture.detectChanges();

    // 1. Thiếu tên người nhận
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('tên người nhận');

    // 2. Sai định dạng SĐT
    atelier.recipientName.set('Nguyễn Minh Thư');
    atelier.recipientPhone.set('12345');
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('số điện thoại');

    // 3. Thiếu địa chỉ giao hoa (bắt buộc bởi MongoDB Order schema)
    atelier.recipientPhone.set('0909 123 456');
    atelier.recipientAddress.set('Q1');
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('địa chỉ giao hoa');

    // 4. Đủ dữ liệu hợp lệ + áp mã YEUHOA15 -> gọi POST /api/orders đúng hợp đồng Backend
    atelier.recipientAddress.set('45 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM');
    atelier.applyVoucher('YEUHOA15');
    atelier.cardMessage.set('Gói chút hoa, gửi chút thương.');
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();

    expect(atelier.submittingOrder()).toBe(true);

    const postReq = httpMock.expectOne('/api/orders');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toMatchObject({
      customer: {
        fullName: 'Nguyễn Minh Thư',
        phone: '0909123456',
        address: '45 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
      },
      items: [{ productId: 12, quantity: 1 }],
      voucherCode: 'YEUHOA15',
    });

    const mockSavedOrder: ApiSavedOrder = {
      _id: '67f000000000000000000001',
      orderCode: 'FL-849201',
      customer: {
        fullName: 'Nguyễn Minh Thư',
        phone: '0909123456',
        address: '45 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
        note: postReq.request.body.customer.note,
      },
      items: [
        {
          productId: 12,
          name: 'Bó Hoa Dịu Ngọt Pastel FLEURÉ',
          price: '390.000đ',
          priceValue: 390000,
          image: 'assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
          quantity: 1,
        },
      ],
      voucherCode: 'YEUHOA15',
      subtotal: 390000,
      discountAmount: 58500,
      shippingFee: 25000,
      grandTotal: 356500,
      status: 'Đã tiếp nhận',
      createdAt: '2026-11-21T05:30:00.000Z',
    };

    postReq.flush(mockSavedOrder, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    const confirmed = atelier.confirmedOrder();
    expect(atelier.submittingOrder()).toBe(false);
    expect(confirmed).not.toBeNull();
    expect(confirmed?.persistedToDb).toBe(true);
    expect(confirmed?.orderCode).toBe('FL-849201');
    expect(confirmed?.totalPrice).toBe(356500);
    expect(atelier.recentOrders()[0]?.orderCode).toBe('FL-849201');

    const drawerText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(drawerText).toContain('Đã lưu MongoDB');
    expect(drawerText).toContain('#FL-849201');
    httpMock.verify();
  });

  it('giữ nguyên dữ liệu người nhập khi POST /api/orders lỗi và hỗ trợ tạo phiếu Zalo tạm tường minh', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDrawer],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const httpMock = TestBed.inject(HttpTestingController);
    const atelier = TestBed.inject(AtelierService);
    const fixture = TestBed.createComponent(OrderDrawer);

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);

    atelier.openOrderForBouquet(atelier.bouquets()[0]);
    atelier.recipientName.set('Trần Bảo Ngọc');
    atelier.recipientPhone.set('0912 345 678');
    atelier.recipientAddress.set('12 Lê Lợi, Quận 1, TP.HCM');
    fixture.detectChanges();

    fixture.componentInstance.onSubmitOrder();
    httpMock
      .expectOne('/api/orders')
      .flush({ message: 'Lỗi máy chủ MongoDB tạm thời.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(atelier.confirmedOrder()).toBeNull();
    expect(atelier.submitOrderError()).toContain('Lỗi máy chủ MongoDB');
    expect(atelier.recipientName()).toBe('Trần Bảo Ngọc');
    expect(atelier.recipientAddress()).toBe('12 Lê Lợi, Quận 1, TP.HCM');

    // Người dùng chủ động chọn tạo phiếu Zalo tạm khi máy chủ lỗi
    fixture.componentInstance.onSubmitOfflineFallback();
    fixture.detectChanges();

    const offlineOrder = atelier.confirmedOrder();
    expect(offlineOrder?.persistedToDb).toBe(false);
    expect(offlineOrder?.orderCode).toMatch(/^FLR-\d{6}$/);
    httpMock.verify();
  });
});
