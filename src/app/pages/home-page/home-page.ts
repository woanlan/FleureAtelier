import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomBouquetStudio } from '../../components/custom-bouquet-studio/custom-bouquet-studio';
import { HangingGallery } from '../../components/hanging-gallery/hanging-gallery';
import { HeroAtelier } from '../../components/hero-atelier/hero-atelier';
import { OccasionShowcase } from '../../components/occasion-showcase/occasion-showcase';
import { SeasonalCalendar } from '../../components/seasonal-calendar/seasonal-calendar';
import { IconComponent } from '../../components/shared/icon/icon';
import { AtelierService } from '../../services/atelier.service';

/**
 * Trang chủ FLEURÉ — Flower Boutique (`/`).
 * - Giữ nguyên trọn vẹn 100% 5 phân khu biên tập sang trọng ban đầu:
 *   HeroAtelier -> HangingGallery -> OccasionShowcase -> CustomBouquetStudio -> SeasonalCalendar.
 * - Đồng bộ thêm `GET /api/home` để hiển thị dải danh mục hoa chuẩn SEO (`/category/:slug`)
 *   và 3 thẻ khám phá dẫn sang các trang con (`/products`, `/promotions`, `/bai_viet`, `/experience`).
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    HeroAtelier,
    HangingGallery,
    OccasionShowcase,
    CustomBouquetStudio,
    SeasonalCalendar,
    IconComponent,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly atelier = inject(AtelierService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Bài viết mới nhất từ `GET /api/home` hiển thị trên thẻ Cẩm nang hoa */
  readonly featuredPost = computed(() => this.atelier.homeLatestPosts()[0] ?? this.atelier.posts()[0]);

  /** Số lượng mẫu hoa đang giảm giá trực tiếp từ MongoDB */
  readonly saleCount = computed(
    () => this.atelier.apiProducts().filter((p) => p.discount > 0).length
  );

  constructor() {
    if (this.isBrowser) {
      this.atelier.ensureHomeLoaded();
    }
  }
}
