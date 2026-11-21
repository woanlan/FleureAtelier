import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../shared/icon/icon';
import { PetalCanvasComponent } from '../shared/petal-canvas/petal-canvas';
import { BouquetItem, OccasionId } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/**
 * Phân khu Chọn hoa theo dịp (`<app-occasion-showcase>`).
 * - Nền pastel chuyển màu êm ái (`600ms cubic-bezier(0.22, 1, 0.36, 1)`) kèm cánh hoa rơi theo từng dịp.
 * - Bố cục sân khấu tạp chí 3 cột trên Desktop (`>= 1024px`) và luồng dọc + lưới 2x2 trên Mobile (`375px–1023px`).
 * - Quản lý mẫu hoa xem thử thuần `computed()` (không sao chép state trong `effect`).
 */
@Component({
  selector: 'app-occasion-showcase',
  standalone: true,
  imports: [PetalCanvasComponent, IconComponent],
  templateUrl: './occasion-showcase.html',
  styleUrl: './occasion-showcase.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccasionShowcase implements AfterViewInit {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly chipScrollerRef =
    viewChild<ElementRef<HTMLElement>>('chipScroller');

  /**
   * Bản đồ lưu mã bó hoa người dùng bấm xem thử cho từng dịp.
   * Tự động trả về mẫu tâm điểm của dịp mới ngay khi `atelier.selectedOccasionId()` thay đổi.
   */
  readonly selectedBouquetByOccasion = signal<Partial<Record<OccasionId, string>>>({});

  /** Bó hoa đang được chọn đè tạm thời trong dịp hiện tại (trả về null nếu dùng bó tâm điểm mặc định) */
  readonly previewBouquetOverride = computed<BouquetItem | null>(() => {
    const occasionId = this.atelier.selectedOccasionId();
    const overrideId = this.selectedBouquetByOccasion()[occasionId];
    if (!overrideId) {
      return null;
    }
    return this.atelier.occasionBouquets().find((b) => b.id === overrideId) ?? null;
  });

  /** Bó hoa hiển thị chính giữa sân khấu (suy dẫn thuần túy, không dùng effect gán lại state) */
  readonly displayedBouquet = computed<BouquetItem>(() => {
    return this.previewBouquetOverride() ?? this.atelier.activeOccasionHeroBouquet();
  });

  /** Trạng thái mép mờ & nút cuộn ngang cho dải chip dịp tặng trên màn hẹp (luật R10) */
  readonly canScrollChipsLeft = signal<boolean>(false);
  readonly canScrollChipsRight = signal<boolean>(false);

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const scroller = this.chipScrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }

    const syncScrollFlags = (): void => {
      this.updateChipScrollFlags(scroller);
    };

    // Đo lần đầu sau khi trình duyệt bố cục xong dải chip
    syncScrollFlags();
    scroller.addEventListener('scroll', syncScrollFlags, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => syncScrollFlags());
      resizeObserver.observe(scroller);
    }

    this.destroyRef.onDestroy(() => {
      scroller.removeEventListener('scroll', syncScrollFlags);
      resizeObserver?.disconnect();
    });
  }

  /** Chuyển đổi chủ đề dịp tặng và đặt lại tâm điểm về bó đại diện của dịp đó */
  onSelectOccasion(occasionId: OccasionId, triggerButton?: HTMLElement): void {
    this.selectedBouquetByOccasion.set({});
    this.atelier.selectOccasion(occasionId);

    // Tự cuộn chip đang chọn vào giữa khung cuộn ngang mà không kéo cuộn dọc cả trang (luật R10)
    if (this.isBrowser && triggerButton && window.innerWidth < 1024) {
      const scroller = this.chipScrollerRef()?.nativeElement;
      if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) {
        const targetLeft =
          triggerButton.offsetLeft -
          scroller.clientWidth / 2 +
          triggerButton.offsetWidth / 2;
        const prefersReduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: prefersReduced ? 'auto' : 'smooth',
        });
      }
    }
  }

  /** Đưa một trong 4 bó hoa vòm thu nhỏ lên sân khấu trung tâm */
  onSelectThumbnail(bouquet: BouquetItem): void {
    const currentOccasionId = this.atelier.selectedOccasionId();
    this.selectedBouquetByOccasion.update((prev) => ({
      ...prev,
      [currentOccasionId]: bouquet.id,
    }));
  }

  /** Cuộn dải chip ngang 80% bề rộng khung cho thiết bị dùng chuột ở màn hẹp (luật R10) */
  scrollChipsByPage(direction: -1 | 1): void {
    if (!this.isBrowser) {
      return;
    }
    const scroller = this.chipScrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.8,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  }

  /** Mở ngăn kéo đặt hoa cho mẫu đang trình diễn trên sân khấu */
  orderDisplayedBouquet(): void {
    this.atelier.openOrderForBouquet(this.displayedBouquet());
  }

  private updateChipScrollFlags(scroller: HTMLElement): void {
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    this.canScrollChipsLeft.set(scroller.scrollLeft > 2);
    this.canScrollChipsRight.set(maxScrollLeft - scroller.scrollLeft > 2);
  }
}

export { OccasionShowcase as OccasionShowcaseComponent };
