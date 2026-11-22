import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeVi from '@angular/common/locales/vi';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { OrderDrawer } from './components/order-drawer/order-drawer';
import { ProductCard } from './components/shared/product-card/product-card';
import { ApiProduct, ApiSavedOrder } from './models/atelier.models';
import { ProductDetailPage } from './pages/product-detail-page/product-detail-page';
import { AtelierService } from './services/atelier.service';

registerLocaleData(localeVi);

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
 * Bộ kiểm thử đơn vị toàn diện (Vitest + Angular TestBed + HttpTestingController)
 * cho "FLEURÉ — Flower Boutique" (Khung Mobile-First 430px + Đa trang Lazy Loading + 6 Collection MongoDB):
 * 1. Khởi tạo khung `.website` 430px, BottomNav, duy nhất một `<h1>` chứa "FLEURÉ" trên `/` và khóa `[inert]` khi mở Drawer.
 * 2. Đồng bộ `GET /api/products`, chuẩn hóa đường dẫn `/assets/...` và giữ fallback an toàn khi lỗi mạng.
 * 3. Chuyển đổi 6 dịp tặng cập nhật chính xác `activeOccasion().headline`.
 * 4. Bàn tự phối hoa chặn < 3 cành và mở đơn khi >= 3 cành.
 * 5. Mã ưu đãi `FLEURE20`, `YEUHOA15`, `FREESHIP60` và miễn phí giao 60p từ 399.000đ.
 * 6. `OrderDrawer` xác thực tên/SĐT/địa chỉ, gửi `POST /api/orders` lưu MongoDB và hiển thị mã `#FL-xxxxxx`.
 * 7. Phục hồi lỗi khi `POST /api/orders` thất bại & hỗ trợ phiếu Zalo tạm tường minh.
 * 8. `ProductCard` sử dụng chuẩn Angular 22 `input.required()`, `output()` và `DecimalPipe` (`vi-VN`).
 * 9. Giỏ hàng đa món lưu `localStorage`, xóa kèm Hoàn tác (`undoRemoveCartItem`) & gửi `POST /api/orders`.
 * 10. `ProductDetailPage` dùng `linkedSignal()` tự động reset `quantity` về `1` khi đổi `:slug`.
 * 11. Kiểm chứng định tuyến Lazy Loading chuẩn SEO (`/products`, `/category/:slug`, `/promotions`, `/posts -> /bai_viet`, `/experience`, `/cart`).
 */
describe('FLEURÉ — Flower Boutique (Mobile-First 430px & Full-Stack MongoDB)', () => {
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

  it('khởi tạo khung Mobile 430px (.website), BottomNav, chỉ 1 <h1> "FLEURÉ" ở / và khóa [inert] khi mở Drawer', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: LOCALE_ID, useValue: 'vi-VN' },
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);
    httpMock.match('/api/home').forEach((req) =>
      req.flush({
        banners: [],
        categories: [],
        newProducts: MOCK_API_PRODUCTS,
        bestSellingProducts: MOCK_API_PRODUCTS,
        saleProducts: [MOCK_API_PRODUCTS[0]],
        latestPosts: [],
      })
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const rootElement = fixture.nativeElement as HTMLElement;
    const h1Elements = rootElement.querySelectorAll('h1');

    expect(fixture.componentInstance).toBeTruthy();
    expect(rootElement.querySelector('.atelier-page-shell.website')).toBeTruthy();
    expect(rootElement.querySelector('app-bottom-nav')).toBeTruthy();
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

  it('nạp danh mục sản phẩm thật từ GET /api/products, chuẩn hóa URL /assets/... và giữ fallback an toàn khi mất kết nối', () => {
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
    expect(atelier.apiProducts()[0].image).toBe('/assets/hasfarm/bo-hoa-diu-ngot-597.jpg');

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

    expect(atelier.openOrderForCustomBouquet()).toBe(false);
    expect(atelier.customBuilderError()).toBeTruthy();
    expect(atelier.drawerOpen()).toBe(false);

    atelier.incrementStem('peony');
    expect(atelier.totalCustomStems()).toBe(3);
    expect(atelier.customBuilderError()).toBeNull();

    expect(atelier.openOrderForCustomBouquet()).toBe(true);
    expect(atelier.drawerOrderSource()).toBe('custom');
    expect(atelier.drawerOpen()).toBe(true);
  });

  it('áp dụng chính xác mã ưu đãi FLEURE20, YEUHOA15, FREESHIP60 và ngưỡng miễn phí giao 60p từ 399.000đ', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const atelier = TestBed.inject(AtelierService);

    atelier.openOrderForBouquet(atelier.bouquets()[0]);
    expect(atelier.selectedSize()).toBe('Nhỏ');
    expect(atelier.drawerSubtotal()).toBe(390000);
    expect(atelier.shippingFee()).toBe(25000);

    atelier.applyVoucher('FLEURE20');
    expect(atelier.appliedVoucherCode()).toBeNull();
    expect(atelier.voucherError()).toContain('450.000đ');

    atelier.applyVoucher('FREESHIP60');
    expect(atelier.shippingFee()).toBe(0);
    expect(atelier.drawerTotalPrice()).toBe(390000);

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

    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('tên người nhận');

    atelier.recipientName.set('Nguyễn Minh Thư');
    atelier.recipientPhone.set('12345');
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('số điện thoại');

    atelier.recipientPhone.set('0909 123 456');
    atelier.recipientAddress.set('Q1');
    fixture.componentInstance.onSubmitOrder();
    fixture.detectChanges();
    expect(atelier.drawerValidationError()).toContain('địa chỉ giao hoa');

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
    expect(confirmed?.persistedToDb).toBe(true);
    expect(confirmed?.orderCode).toBe('FL-849201');
    expect(confirmed?.totalPrice).toBe(356500);
    expect(atelier.recentOrders()[0]?.orderCode).toBe('FL-849201');
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

    fixture.componentInstance.onSubmitOfflineFallback();
    fixture.detectChanges();

    const offlineOrder = atelier.confirmedOrder();
    expect(offlineOrder?.persistedToDb).toBe(false);
    expect(offlineOrder?.orderCode).toMatch(/^FLR-\d{6}$/);
    httpMock.verify();
  });

  it('ProductCard nhận input.required(), định dạng giá bằng DecimalPipe (vi-VN) và phát output() chuẩn Lab 1–2', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [{ provide: LOCALE_ID, useValue: 'vi-VN' }, provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', {
      ...MOCK_API_PRODUCTS[0],
      image: '/assets/hasfarm/bo-hoa-diu-ngot-597.jpg',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('390.000đ');
    expect(el.textContent).toContain('460.000đ');

    const addedProducts: ApiProduct[] = [];
    const quickOrderedProducts: ApiProduct[] = [];
    fixture.componentInstance.addToCart.subscribe((p) => addedProducts.push(p));
    fixture.componentInstance.quickOrder.subscribe((p) => quickOrderedProducts.push(p));

    (el.querySelector('.card-add-btn') as HTMLButtonElement).click();
    (el.querySelector('.card-quick-btn') as HTMLButtonElement).click();

    expect(addedProducts[0]?.id).toBe(12);
    expect(quickOrderedProducts[0]?.id).toBe(12);
  });

  it('Giỏ hàng đa món lưu bền, tăng/giảm, xóa kèm Hoàn tác (Undo Toast) và gửi POST /api/orders xóa giỏ', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const atelier = TestBed.inject(AtelierService);
    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);

    const [p1, p2] = atelier.apiProducts();
    atelier.addToCart(p1, 2);
    atelier.addToCart(p2, 1);

    expect(atelier.cartCount()).toBe(3);
    expect(atelier.cartSubtotal()).toBe(390000 * 2 + 480000);

    // Xóa sản phẩm 2 -> hiện Toast có nút Hoàn tác -> khôi phục đúng vị trí
    atelier.removeCartItem(p2.id);
    expect(atelier.cartCount()).toBe(2);
    expect(atelier.toastState()?.canUndo).toBe(true);

    atelier.undoRemoveCartItem();
    expect(atelier.cartCount()).toBe(3);

    // Gửi đơn đa sản phẩm lên POST /api/orders -> tự làm trống giỏ hàng
    let savedCode = '';
    atelier
      .placeCartOrder({
        customer: {
          fullName: 'Nguyễn Hoàng Lân',
          phone: '0909123456',
          address: '45 Nguyễn Huệ, Quận 1, TP.HCM',
        },
        items: [
          { productId: p1.id, quantity: 2 },
          { productId: p2.id, quantity: 1 },
        ],
        voucherCode: 'FLEURE20',
      })
      .subscribe((saved) => {
        savedCode = saved.orderCode;
      });

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.items.length).toBe(2);
    req.flush({
      orderCode: 'FL-999111',
      customer: req.request.body.customer,
      items: [],
      voucherCode: 'FLEURE20',
      subtotal: 1260000,
      discountAmount: 252000,
      shippingFee: 0,
      grandTotal: 1008000,
      status: 'Đã tiếp nhận',
    } satisfies ApiSavedOrder);

    expect(savedCode).toBe('FL-999111');
    expect(atelier.cartCount()).toBe(0);
    httpMock.verify();
  });

  it('ProductDetailPage tự động reset quantity về 1 bằng linkedSignal() khi chuyển :slug sang sản phẩm khác', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: LOCALE_ID, useValue: 'vi-VN' },
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/product/bo-hoa-diu-ngot-pastel-fleure');
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);
    httpMock
      .match('/api/products/bo-hoa-diu-ngot-pastel-fleure')
      .forEach((req) => req.flush(MOCK_API_PRODUCTS[0]));
    fixture.detectChanges();

    const detailDebug = fixture.debugElement.query((el) => el.componentInstance instanceof ProductDetailPage);
    const detailComp = detailDebug.componentInstance as ProductDetailPage;

    expect(detailComp.quantity()).toBe(1);
    detailComp.increaseQuantity();
    detailComp.increaseQuantity();
    expect(detailComp.quantity()).toBe(3);

    // Chuyển sang :slug thứ hai -> linkedSignal() tự reset quantity về 1
    await router.navigateByUrl('/product/bo-hoa-tulip-hong-nang-mai');
    fixture.detectChanges();
    httpMock
      .match('/api/products/bo-hoa-tulip-hong-nang-mai')
      .forEach((req) => req.flush(MOCK_API_PRODUCTS[1]));
    httpMock.match('/api/home').forEach((req) =>
      req.flush({
        banners: [],
        categories: [],
        newProducts: [],
        bestSellingProducts: [],
        saleProducts: [],
        latestPosts: [],
      })
    );
    fixture.detectChanges();

    expect(detailComp.quantity()).toBe(1);
    httpMock.verify();
  });

  it('định tuyến Lazy Loading hoạt động chuẩn SEO (/products, /category/:slug, /promotions, /posts -> /bai_viet, /experience, /cart)', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: LOCALE_ID, useValue: 'vi-VN' },
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush(MOCK_API_PRODUCTS);

    await router.navigateByUrl('/posts');
    expect(router.url).toBe('/bai_viet');
    httpMock.match('/api/posts').forEach((req) => req.flush([]));

    await router.navigateByUrl('/category/hoa-sinh-nhat');
    expect(router.url).toBe('/category/hoa-sinh-nhat');
    httpMock.match((r) => r.url.startsWith('/api/products')).forEach((req) => req.flush(MOCK_API_PRODUCTS));
    httpMock.match('/api/home').forEach((req) =>
      req.flush({
        banners: [],
        categories: [],
        newProducts: [],
        bestSellingProducts: [],
        saleProducts: [],
        latestPosts: [],
      })
    );

    await router.navigateByUrl('/promotions');
    expect(router.url).toBe('/promotions');

    await router.navigateByUrl('/experience');
    expect(router.url).toBe('/experience');
    httpMock.match('/api/experiences').forEach((req) => req.flush([]));

    await router.navigateByUrl('/cart');
    expect(router.url).toBe('/cart');

    httpMock.verify();
  });
});
