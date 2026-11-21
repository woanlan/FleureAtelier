import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { BouquetItem, SeasonalFlower } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';
import { IconComponent } from '../shared/icon/icon';

/** Ô gạch mosaic trong lưới 6 x 8 (48 ô) phủ trên khung chân dung hoa theo mùa */
export interface MosaicTile {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly delayMs: number;
  readonly isWarmTint: boolean;
}

const MOSAIC_COLS = 6;
const MOSAIC_ROWS = 8;
const TILE_STAGGER_MS = 22;
const MOSAIC_TOTAL_MS = 420 + (MOSAIC_ROWS - 1 + MOSAIC_COLS - 1) * TILE_STAGGER_MS + 40;

/** Khởi tạo tĩnh 48 ô gạch (6 cột x 8 hàng) kèm độ trễ đường chéo (row + col) * 22ms */
const MOSAIC_TILES: readonly MosaicTile[] = Array.from(
  { length: MOSAIC_COLS * MOSAIC_ROWS },
  (_, id) => {
    const row = Math.floor(id / MOSAIC_COLS);
    const col = id % MOSAIC_COLS;
    return {
      id,
      row,
      col,
      delayMs: (row + col) * TILE_STAGGER_MS,
      isWarmTint: (row + col) % 2 === 1,
    };
  }
);

/**
 * Phân khu "Mùa hoa Đà Lạt tại FLEURÉ Sài Gòn" (`<app-seasonal-calendar>`):
 * Tôn vinh 6 thức hoa cao nguyên Đà Lạt theo mùa với khung vòm thực vật học
 * và hiệu ứng mở màn lưới Mosaic 6×8 mượt mà khi chuyển mùa.
 */
@Component({
  selector: 'app-seasonal-calendar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './seasonal-calendar.html',
  styleUrl: './seasonal-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonalCalendar {
  readonly atelier = inject(AtelierService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Chỉ số thức hoa đang được chọn trong 6 mùa hoa Đà Lạt */
  readonly activeSeasonIndex = signal<number>(0);

  /** Cờ kích hoạt hiệu ứng lật ô Mosaic 6×8 trên ảnh chân dung hoa */
  readonly isMosaicTransitioning = signal<boolean>(false);

  /** Đảo pha keyframe giúp bấm liên tiếp giữa các mùa vẫn khởi chạy lại hiệu ứng mượt tức thì */
  readonly mosaicWaveToggle = signal<boolean>(false);

  readonly mosaicTiles = MOSAIC_TILES;

  private mosaicTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Thức hoa tâm điểm đang hiển thị trên khung vòm lớn */
  readonly activeSeason = computed<SeasonalFlower>(() => {
    const list = this.atelier.seasonalFlowers;
    const idx = this.activeSeasonIndex();
    return list[idx] ?? list[0];
  });

  /** Bó hoa nghệ thuật gợi ý gắn liền với thức hoa của mùa đang chọn (đồng bộ trực tiếp MongoDB) */
  readonly linkedBouquet = computed<BouquetItem>(() => {
    const targetId = this.activeSeason().linkedBouquetId;
    return this.atelier.findBouquetByRef(targetId);
  });

  constructor() {
    // Hủy bộ đếm thời gian an toàn khi component bị hủy (tránh rò rỉ bộ nhớ)
    this.destroyRef.onDestroy(() => {
      this.clearMosaicTimer();
    });
  }

  /**
   * Chuyển sang mùa hoa mới và kích hoạt hiệu ứng mở màn Mosaic 420ms.
   * Tự động bỏ qua chuyển động nếu người dùng bật chế độ giảm chuyển động trên thiết bị.
   */
  selectSeason(index: number): void {
    const list = this.atelier.seasonalFlowers;
    if (index < 0 || index >= list.length) return;
    if (index === this.activeSeasonIndex()) return;

    this.activeSeasonIndex.set(index);
    this.clearMosaicTimer();

    const prefersReducedMotion =
      this.isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.isMosaicTransitioning.set(false);
      return;
    }

    this.mosaicWaveToggle.update((prev) => !prev);
    this.isMosaicTransitioning.set(true);

    this.mosaicTimeoutId = setTimeout(() => {
      this.isMosaicTransitioning.set(false);
      this.mosaicTimeoutId = null;
    }, MOSAIC_TOTAL_MS);
  }

  /** Mở ngăn kéo đặt hoa với mẫu bó hoa đại diện cho mùa hiện tại */
  orderCurrentSeasonBouquet(): void {
    this.atelier.openOrderForBouquetById(this.activeSeason().linkedBouquetId);
  }

  private clearMosaicTimer(): void {
    if (this.mosaicTimeoutId !== null) {
      clearTimeout(this.mosaicTimeoutId);
      this.mosaicTimeoutId = null;
    }
  }
}

export { SeasonalCalendar as SeasonalCalendarComponent };
