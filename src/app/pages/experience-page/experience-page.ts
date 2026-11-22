import { DecimalPipe, isPlatformBrowser } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/shared/icon/icon';
import {
  ApiExperienceVideo,
  ApiProduct,
  ExperienceCategory,
} from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/**
 * Trang Trải Nghiệm Video Nghệ Thuật Bó Hoa FLEURÉ (`/experience`).
 * - Thiết kế nguyên bản Mobile-First 375px – 430px, đầu trang nền Ruby đậm (`surface-espresso`).
 * - Đồng bộ danh sách video từ `GET /api/experiences`, lọc theo 4 danh mục cuộn ngang.
 * - Hỗ trợ chuyển tập phát sóng tức thì, tăng lượt xem cục bộ và thêm nhanh bó hoa liên kết vào giỏ.
 */
@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, IconComponent],
  templateUrl: './experience-page.html',
  styleUrl: './experience-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperiencePage {
  readonly atelier = inject(AtelierService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Tham chiếu phần tử `<video>` chính để tải lại nguồn phát an toàn khi đổi tập */
  readonly atelierVideo = viewChild<ElementRef<HTMLVideoElement>>('atelierVideo');

  /** 4 danh mục trải nghiệm chuẩn FLEURÉ Atelier */
  readonly categories: readonly ExperienceCategory[] = [
    'Tất cả',
    'Atelier FLEURÉ',
    'Kỹ thuật bó hoa',
    'Chăm hoa tại nhà',
  ];

  readonly selectedCategory = signal<ExperienceCategory>('Tất cả');
  readonly selectedVideoId = signal<number | null>(null);
  readonly viewBoostMap = signal<Record<number, number>>({});

  /** Danh sách video sau khi lọc theo danh mục đang chọn */
  readonly filteredVideos = computed<readonly ApiExperienceVideo[]>(() => {
    const category = this.selectedCategory();
    const list = this.atelier.experiences();
    if (category === 'Tất cả') {
      return list;
    }
    return list.filter((video) => video.category === category);
  });

  /** Video đang phát trong trình phát chính (tự động chọn tập đầu của danh mục hiện tại) */
  readonly activeVideo = computed<ApiExperienceVideo | null>(() => {
    const list = this.filteredVideos();
    if (list.length === 0) {
      return null;
    }
    const chosenId = this.selectedVideoId();
    return list.find((video) => video.id === chosenId) ?? list[0];
  });

  /** Bó hoa liên kết xuất hiện trong tập video đang xem */
  readonly linkedProduct = computed<ApiProduct | undefined>(() => {
    const current = this.activeVideo();
    return current ? this.atelier.getApiProductById(current.linkedProductId) : undefined;
  });

  constructor() {
    if (this.isBrowser) {
      this.atelier.ensureExperiencesLoaded();
    }
  }

  /** Đổi danh mục lọc video và tự đồng bộ nguồn phát an toàn trên trình duyệt */
  selectCategory(category: ExperienceCategory): void {
    if (this.selectedCategory() === category) {
      return;
    }
    this.selectedCategory.set(category);

    const nextList = this.filteredVideos();
    const currentId = this.selectedVideoId();
    const stillVisible = nextList.some((video) => video.id === currentId);

    if (!stillVisible) {
      this.selectedVideoId.set(nextList[0]?.id ?? null);
      this.reloadVideoSafely();
    }
  }

  /** Chọn một tập video từ danh sách phát, cộng +1 lượt xem cục bộ và nạp lại thẻ `<video>` */
  selectVideo(videoId: number): void {
    this.selectedVideoId.set(videoId);
    this.viewBoostMap.update((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] ?? 0) + 1,
    }));
    this.reloadVideoSafely();
  }

  /** Tổng lượt xem hiển thị = lượt xem từ MongoDB + lượt xem người dùng vừa chọn trong phiên */
  getDisplayViews(video: ApiExperienceVideo): number {
    return video.views + (this.viewBoostMap()[video.id] ?? 0);
  }

  /** Định dạng số thứ tự bước hướng dẫn (01, 02, 03) */
  formatStepIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  /** Thêm nhanh bó hoa liên kết trong video vào giỏ hàng đa món */
  addLinkedProductToCart(product: ApiProduct): void {
    this.atelier.addToCart(product, 1);
  }

  /** Tải lại danh sách video từ Backend Render / MongoDB */
  retryLoadExperiences(): void {
    this.atelier.ensureExperiencesLoaded(true);
  }

  private reloadVideoSafely(): void {
    if (!this.isBrowser) {
      return;
    }
    queueMicrotask(() => {
      const videoEl = this.atelierVideo()?.nativeElement;
      if (videoEl) {
        videoEl.load();
      }
    });
  }
}
