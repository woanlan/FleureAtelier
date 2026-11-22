import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../components/shared/icon/icon';
import { ApiPost, ApiProduct, PostCategory } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/** 5 danh mục cẩm nang hoa FLEURÉ theo thứ tự hiển thị trên dải tab cuộn ngang */
const POST_CATEGORIES: readonly PostCategory[] = [
  'Tất cả',
  'Chăm sóc hoa',
  'Ý nghĩa hoa',
  'Nghệ thuật gói',
  'Xu hướng',
];

/**
 * Trang Góc Cẩm Nang Hoa (`/bai_viet`) thiết kế chuẩn Mobile-First 430px cho FLEURÉ.
 * - Tự động nạp bài viết từ `GET /api/posts` trên trình duyệt (kèm dữ liệu dự phòng 0ms).
 * - Hỗ trợ deep-link `?id=<postId>` qua `toSignal(route.queryParamMap)` + `effect()`.
 * - Khung đọc bài viết đầy đủ mở ngay trên đầu danh sách, hỗ trợ đóng bằng nút hoặc phím Escape,
 *   kèm hộp Mẹo giữ hoa tươi và Thẻ Bó Hoa Liên Quan dẫn sang `/product/:slug` hoặc thêm vào giỏ.
 */
@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class PostsPage {
  readonly atelier = inject(AtelierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Danh sách 5 danh mục lọc bài viết */
  readonly categories = POST_CATEGORIES;

  /** Danh mục bài viết đang chọn */
  readonly selectedCategory = signal<PostCategory>('Tất cả');

  /** Mã số bài viết đang mở đọc đầy đủ (null nếu đang ở chế độ duyệt danh sách) */
  readonly activePostId = signal<number | null>(null);

  /** Theo dõi tham số truy vấn URL (`?id=<postId>`) theo mô hình Reactive Signal */
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Danh sách bài viết sau khi lọc theo tab danh mục hiện tại */
  readonly filteredPosts = computed<readonly ApiPost[]>(() => {
    const category = this.selectedCategory();
    const allPosts = this.atelier.posts();
    if (category === 'Tất cả') {
      return allPosts;
    }
    return allPosts.filter((post) => post.category === category);
  });

  /** Đối tượng bài viết đầy đủ đang được đọc ở khung trên đầu danh sách */
  readonly activePost = computed<ApiPost | null>(() => {
    const id = this.activePostId();
    if (id === null) return null;
    return this.atelier.posts().find((post) => post.id === id) ?? null;
  });

  /** Sản phẩm hoa gợi ý liên kết trực tiếp với bài viết đang đọc */
  readonly relatedProduct = computed<ApiProduct | undefined>(() => {
    const post = this.activePost();
    if (!post) return undefined;
    return this.atelier.getApiProductById(post.relatedProductId);
  });

  /** Theo dõi giá trị `?id=` lần đồng bộ gần nhất để không ghi đè thao tác cục bộ */
  private lastSyncedQueryId: string | null = null;

  constructor() {
    // Nạp dữ liệu bài viết mới nhất từ MongoDB khi chạy trên trình duyệt
    if (this.isBrowser) {
      this.atelier.ensurePostsLoaded();
    }

    // Đồng bộ trạng thái bài viết đang mở với deep-link `?id=<postId>` trên URL
    effect(() => {
      const rawId = this.queryParamMap().get('id');
      const allPosts = this.atelier.posts();

      if (!rawId) {
        if (this.lastSyncedQueryId !== null) {
          this.lastSyncedQueryId = null;
          this.activePostId.set(null);
        }
        return;
      }

      const parsedId = Number(rawId);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        this.lastSyncedQueryId = rawId;
        this.activePostId.set(null);
        return;
      }

      const matched = allPosts.find((post) => post.id === parsedId);
      if (matched) {
        this.lastSyncedQueryId = rawId;
        this.activePostId.set(matched.id);
      }
    });
  }

  /** Chuyển tab danh mục cẩm nang hoa */
  selectCategory(category: PostCategory): void {
    this.selectedCategory.set(category);
    if (this.activePostId() !== null) {
      this.closePost();
    }
  }

  /** Đặt lại bộ lọc danh mục về "Tất cả" */
  resetCategory(): void {
    this.selectedCategory.set('Tất cả');
  }

  /** Mở đọc một bài viết và cập nhật query param `?id=` để hỗ trợ chia sẻ / nút Back */
  openPost(post: ApiPost): void {
    this.activePostId.set(post.id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: post.id },
      queryParamsHandling: 'merge',
    });

    if (this.isBrowser) {
      const prefersReduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  /** Đóng khung đọc bài viết và quay lại danh sách bài viết */
  closePost(): void {
    this.activePostId.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Đóng khung đọc bài viết khi người dùng nhấn phím Escape */
  onEscapeKey(): void {
    if (this.activePost() !== null) {
      this.closePost();
    }
  }

  /** Thử tải lại danh sách bài viết từ máy chủ khi gặp lỗi kết nối */
  retryLoadPosts(): void {
    this.atelier.ensurePostsLoaded(true);
  }

  /** Chuyển ngày ISO `YYYY-MM-DD` sang định dạng thân thiện `DD/MM/YYYY` */
  formatPublishedDate(rawDate: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate.trim());
    if (!match) return rawDate;
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
}
