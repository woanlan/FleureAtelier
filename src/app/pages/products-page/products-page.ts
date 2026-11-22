import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AtelierIconName, IconComponent } from '../../components/shared/icon/icon';
import { ProductCard } from '../../components/shared/product-card/product-card';
import { ApiCategory, ApiProduct, ProductSortOption } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/** Cấu trúc một tùy chọn sắp xếp trên dải công cụ ngang */
interface SortOptionItem {
  readonly value: ProductSortOption;
  readonly label: string;
  readonly icon: AtelierIconName;
}

/** Danh sách các tên icon danh mục hợp lệ trong hệ thống biểu tượng FLEURÉ */
const VALID_CATEGORY_ICONS: ReadonlySet<string> = new Set<AtelierIconName>([
  'cake',
  'heart',
  'party-popper',
  'gem',
  'flower-2',
  'sparkles',
  'layout-grid',
]);

/** Chuẩn hóa chuỗi tiếng Việt không dấu để lọc dự phòng chính xác khi tìm kiếm cục bộ */
function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Trang Danh mục & Bộ sưu tập hoa FLEURÉ (`/products` và `/category/:slug`).
 * - Thiết kế nguyên bản cho khung ứng dụng Mobile-First 430px (không dùng breakpoint Desktop).
 * - Kết nối trực tiếp REST API lọc theo danh mục (`:slug`) và tìm kiếm (`?search=`) có dự phòng tức thì.
 * - Hỗ trợ 5 chế độ sắp xếp, lưới 2 cột chuẩn ASM 1 và phân trang 6 mẫu/trang.
 */
@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [RouterLink, ProductCard, IconComponent],
  templateUrl: './products-page.html',
  styleUrl: './products-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  readonly atelier = inject(AtelierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Tham chiếu đỉnh vùng lưới sản phẩm để cuộn mượt khi chuyển trang */
  private readonly catalogGridTopRef = viewChild<ElementRef<HTMLElement>>('catalogGridTop');

  /** Số mẫu hoa hiển thị mỗi trang trong lưới 2 cột (3 hàng × 2 cột) */
  readonly pageSize = 6;

  /** 5 chế độ sắp xếp sản phẩm chuẩn cửa hàng hoa FLEURÉ */
  readonly sortOptions: readonly SortOptionItem[] = [
    { value: 'newest', label: 'Mới nhất', icon: 'sparkles' },
    { value: 'bestseller', label: 'Bán chạy', icon: 'flame' },
    { value: 'promotion', label: 'Giảm giá', icon: 'tag' },
    { value: 'price-asc', label: 'Giá thấp → cao', icon: 'arrow-up-narrow-wide' },
    { value: 'price-desc', label: 'Giá cao → thấp', icon: 'arrow-down-wide-narrow' },
  ];

  /** Slug danh mục hiện tại từ route `:slug` (mặc định `'tat-ca'`) */
  readonly activeCategorySlug = signal<string>('tat-ca');

  /** Danh sách sản phẩm trả về từ API theo danh mục (`null` khi đang ở Tất cả hoặc dùng dự phòng) */
  readonly categoryProductsFromApi = signal<ApiProduct[] | null>(null);

  /** Trạng thái đang đồng bộ danh mục từ Backend */
  readonly categoryLoading = signal<boolean>(false);

  /** Giá trị ô nhập tìm kiếm ngay trong trang */
  readonly searchInputValue = signal<string>('');

  /** Từ khóa tìm kiếm đã áp dụng (đồng bộ từ `?search=`) */
  readonly appliedSearchTerm = signal<string>('');

  /** Chế độ sắp xếp đang được kích hoạt */
  readonly activeSort = signal<ProductSortOption>('newest');

  /** Trang hiện tại của bộ phân trang (bắt đầu từ 1) */
  readonly currentPage = signal<number>(1);

  /** Thông tin danh mục đang chọn (nếu khác `'tat-ca'`) */
  readonly activeCategory = computed<ApiCategory | null>(() => {
    const slug = this.activeCategorySlug();
    if (slug === 'tat-ca') return null;
    return this.atelier.categories().find((cat) => cat.slug === slug) ?? null;
  });

  /** Nhãn hiển thị cuối breadcrumb */
  readonly breadcrumbLabel = computed<string>(() => {
    const category = this.activeCategory();
    if (category) return category.name;
    if (this.activeCategorySlug() !== 'tat-ca') return this.activeCategorySlug();
    return 'Bộ sưu tập hoa';
  });

  /** Tiêu đề `<h1>` duy nhất của trang */
  readonly pageTitle = computed<string>(() => {
    const category = this.activeCategory();
    return category ? category.name : 'Bộ sưu tập hoa FLEURÉ';
  });

  /** Mô tả ngắn dưới tiêu đề phù hợp ngữ cảnh danh mục */
  readonly pageDescription = computed<string>(() => {
    const category = this.activeCategory();
    if (category?.description) return category.description;
    return 'Hoa tươi Đà Lạt tuyển chọn mỗi sáng, gói giấy lụa Pháp và giao hỏa tốc 60 phút nội thành.';
  });

  /** Tổng số mẫu hoa trong toàn bộ cửa hàng */
  readonly totalCatalogCount = computed<number>(() => this.atelier.apiProducts().length);

  /** Có đang bật bất kỳ bộ lọc hoặc từ khóa tìm kiếm nào hay không */
  readonly hasActiveFilters = computed<boolean>(
    () =>
      this.activeCategorySlug() !== 'tat-ca' ||
      this.appliedSearchTerm().trim().length > 0 ||
      this.activeSort() !== 'newest'
  );

  /** Trạng thái đang gọi API tìm kiếm hoặc tải danh mục */
  readonly isSyncing = computed<boolean>(
    () => this.categoryLoading() || this.atelier.searching()
  );

  /** Danh sách mẫu hoa sau khi kết hợp danh mục, từ khóa tìm kiếm và tiêu chí sắp xếp */
  readonly filteredProducts = computed<ApiProduct[]>(() => {
    const slug = this.activeCategorySlug();
    const query = this.appliedSearchTerm().trim();
    const allProducts = this.atelier.apiProducts();
    const apiCategoryItems = this.categoryProductsFromApi();
    const apiSearchItems = this.atelier.searchResults();

    let source: readonly ApiProduct[];

    if (query) {
      if (apiSearchItems !== null) {
        source =
          slug === 'tat-ca'
            ? apiSearchItems
            : apiSearchItems.filter((item) => item.categorySlug === slug);
      } else {
        const base =
          slug === 'tat-ca'
            ? allProducts
            : (apiCategoryItems ?? allProducts.filter((item) => item.categorySlug === slug));
        const normalizedQuery = normalizeVietnamese(query);
        source = base.filter((item) => {
          const haystack = normalizeVietnamese(
            `${item.name} ${item.category} ${item.meaning} ${item.description}`
          );
          return haystack.includes(normalizedQuery);
        });
      }
    } else if (slug !== 'tat-ca') {
      source =
        apiCategoryItems !== null
          ? apiCategoryItems
          : allProducts.filter((item) => item.categorySlug === slug);
    } else {
      source = allProducts;
    }

    const sorted = [...source];
    switch (this.activeSort()) {
      case 'bestseller':
        sorted.sort((a, b) => b.sold - a.sold || b.id - a.id);
        break;
      case 'promotion':
        sorted.sort((a, b) => b.discount - a.discount || b.sold - a.sold || b.id - a.id);
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.priceValue - b.priceValue || b.sold - a.sold);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.priceValue - a.priceValue || b.sold - a.sold);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => {
          const dateCompare = (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
          return dateCompare !== 0 ? dateCompare : b.id - a.id;
        });
        break;
    }

    return sorted;
  });

  /** Tổng số kết quả khớp sau khi lọc */
  readonly totalFilteredCount = computed<number>(() => this.filteredProducts().length);

  /** Tổng số trang theo `pageSize = 6` */
  readonly totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(this.totalFilteredCount() / this.pageSize))
  );

  /** Chỉ số trang hiện tại luôn nằm trong khoảng hợp lệ `[1, totalPages]` */
  readonly safeCurrentPage = computed<number>(() =>
    Math.min(Math.max(1, this.currentPage()), this.totalPages())
  );

  /** Danh sách số trang `[1, 2, ...]` để vẽ thanh phân trang */
  readonly pageNumbers = computed<number[]>(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  /** Danh sách tối đa 6 mẫu hoa hiển thị ở trang hiện tại */
  readonly paginatedProducts = computed<ApiProduct[]>(() => {
    const startIndex = (this.safeCurrentPage() - 1) * this.pageSize;
    return this.filteredProducts().slice(startIndex, startIndex + this.pageSize);
  });

  /** QueryParams giữ lại `?search=` khi người dùng bấm chuyển danh mục */
  readonly preservedSearchParams = computed<Params>(() => {
    const q = this.appliedSearchTerm().trim();
    return q ? { search: q } : {};
  });

  constructor() {
    if (this.isBrowser) {
      this.atelier.ensureHomeLoaded();
    }

    // Lắng nghe tham số `:slug` trên route `/category/:slug` (hoặc `/products` -> `'tat-ca'`)
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((paramMap) => {
          const slug = (paramMap.get('slug') ?? 'tat-ca').trim() || 'tat-ca';
          this.activeCategorySlug.set(slug);
          this.currentPage.set(1);

          if (slug === 'tat-ca') {
            this.categoryProductsFromApi.set(null);
            this.categoryLoading.set(false);
            return of<ApiProduct[] | null>(null);
          }

          if (!this.isBrowser) {
            this.categoryProductsFromApi.set(null);
            this.categoryLoading.set(false);
            return of<ApiProduct[] | null>(null);
          }

          this.categoryLoading.set(true);
          this.categoryProductsFromApi.set(null);
          return this.atelier
            .fetchProductsByFilter({ categorySlug: slug })
            .pipe(catchError(() => of<ApiProduct[] | null>(null)));
        })
      )
      .subscribe((products) => {
        this.categoryProductsFromApi.set(products);
        this.categoryLoading.set(false);
      });

    // Đồng bộ tham số tìm kiếm `?search=` vào AtelierService và kích hoạt gọi REST API
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((queryMap) => {
      const search = (queryMap.get('search') ?? '').trim();
      this.searchInputValue.set(search);
      this.appliedSearchTerm.set(search);
      this.atelier.searchQuery.set(search);
      this.atelier.searchProductsFromApi(search);
      this.currentPage.set(1);
    });
  }

  /** Cập nhật giá trị ô tìm kiếm khi người dùng gõ phím */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInputValue.set(value);
    this.atelier.searchQuery.set(value);

    // Nếu người dùng xóa sạch ô tìm kiếm khi trước đó đang có từ khóa, tự động gỡ lọc tìm kiếm
    if (!value.trim() && this.appliedSearchTerm()) {
      this.clearSearch();
    }
  }

  /** Gửi biểu mẫu tìm kiếm: gọi API và cập nhật query param `?search=` trên URL */
  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const clean = this.searchInputValue().trim();
    this.appliedSearchTerm.set(clean);
    this.atelier.searchQuery.set(clean);
    this.atelier.searchProductsFromApi(clean);
    this.currentPage.set(1);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: clean || null },
      queryParamsHandling: 'merge',
    });
  }

  /** Xóa nhanh từ khóa tìm kiếm hiện tại nhưng vẫn giữ danh mục đang xem */
  clearSearch(): void {
    this.searchInputValue.set('');
    this.appliedSearchTerm.set('');
    this.atelier.searchQuery.set('');
    this.atelier.searchProductsFromApi('');
    this.currentPage.set(1);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge',
    });
  }

  /** Đổi tiêu chí sắp xếp và đưa danh sách về trang đầu tiên */
  selectSort(option: ProductSortOption): void {
    if (this.activeSort() === option) return;
    this.activeSort.set(option);
    this.currentPage.set(1);
  }

  /** Chuyển sang trang mục tiêu và cuộn nhẹ về đầu lưới sản phẩm */
  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    if (clamped === this.safeCurrentPage()) return;
    this.currentPage.set(clamped);

    if (this.isBrowser) {
      const target = this.catalogGridTopRef()?.nativeElement;
      if (target) {
        const prefersReduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  }

  /** Đặt lại toàn bộ danh mục, tìm kiếm và sắp xếp về trạng thái mặc định `/products` */
  resetAllFilters(): void {
    this.activeSort.set('newest');
    this.searchInputValue.set('');
    this.appliedSearchTerm.set('');
    this.atelier.searchQuery.set('');
    this.atelier.searchProductsFromApi('');
    this.currentPage.set(1);

    void this.router.navigate(['/products']);
  }

  /** Ánh xạ tên icon danh mục từ MongoDB sang bộ icon Lucide an toàn của FLEURÉ */
  resolveCategoryIcon(icon: string | undefined): AtelierIconName {
    if (icon && VALID_CATEGORY_ICONS.has(icon)) {
      return icon as AtelierIconName;
    }
    return 'flower-2';
  }
}
