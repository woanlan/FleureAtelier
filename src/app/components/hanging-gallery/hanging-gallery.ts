import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/icon/icon';
import { BouquetItem } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';

/** Trạng thái vị trí tương đối của từng bó hoa trên thanh đồng treo */
export type HangingSlotState =
  | 'neg2'
  | 'neg1'
  | 'center'
  | 'pos1'
  | 'pos2'
  | 'hidden-left'
  | 'hidden-right';

/** Dữ liệu hiển thị cho mỗi vị trí bó hoa trên kệ đồng 3D */
export interface HangingSlotView {
  readonly bouquet: BouquetItem;
  readonly index: number;
  readonly offset: number;
  readonly slotState: HangingSlotState;
  readonly isVisibleDesktop: boolean;
}

/**
 * Phòng trưng bày hoa treo nghệ thuật (`<app-hanging-gallery>`).
 * - Tái hiện kệ đồng ngang của xưởng hoa với dây treo mảnh 1px và khoen đồng.
 * - Bó hoa đang chọn bước ra phía trước (`translate3d(0, 14px, 0) scale(1)`), rõ nét tuyệt đối;
 *   các bó kế cận lùi chiều sâu và mờ dần tự nhiên (`transform`, `opacity`, `filter`).
 */
@Component({
  selector: 'app-hanging-gallery',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './hanging-gallery.html',
  styleUrl: './hanging-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HangingGallery {
  readonly atelier = inject(AtelierService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Tham chiếu danh sách các nút bó hoa treo để bảo toàn focus bàn phím khi trượt kệ */
  private readonly hangSlotBtns =
    viewChildren<ElementRef<HTMLButtonElement>>('hangSlotBtn');

  /**
   * Tính toán vị trí vòng tròn quanh `activeHangingIndex` cho toàn bộ bó hoa treo.
   * Giữ nguyên danh sách theo `bouquet.id` để trình duyệt nội suy chuyển động mượt mà.
   */
  readonly hangingSlots = computed<readonly HangingSlotView[]>(() => {
    const items = this.atelier.hangingBouquets();
    const total = items.length;
    if (total === 0) {
      return [];
    }

    const activeIdx =
      ((this.atelier.activeHangingIndex() % total) + total) % total;
    const half = Math.floor(total / 2);

    return items.map((bouquet, index) => {
      let diff = index - activeIdx;
      if (diff > half) {
        diff -= total;
      } else if (diff < -half) {
        diff += total;
      }

      let slotState: HangingSlotState;
      if (diff === 0) {
        slotState = 'center';
      } else if (diff === -1) {
        slotState = 'neg1';
      } else if (diff === 1) {
        slotState = 'pos1';
      } else if (diff === -2) {
        slotState = 'neg2';
      } else if (diff === 2) {
        slotState = 'pos2';
      } else if (diff < -2) {
        slotState = 'hidden-left';
      } else {
        slotState = 'hidden-right';
      }

      return {
        bouquet,
        index,
        offset: diff,
        slotState,
        isVisibleDesktop: Math.abs(diff) <= 2,
      };
    });
  });

  /** Nhãn chỉ số thứ tự dạng 01 / 07 dùng cho bộ điều hướng */
  readonly activePositionLabel = computed<string>(() => {
    const total = this.atelier.hangingBouquets().length;
    if (total === 0) {
      return '00 / 00';
    }
    const current =
      (((this.atelier.activeHangingIndex() % total) + total) % total) + 1;
    const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(current)} / ${pad(total)}`;
  });

  /** Chọn trực tiếp một bó hoa treo trên kệ */
  onSelectSlot(index: number): void {
    this.atelier.selectHanging(index);
  }

  /** Điều hướng kệ treo bằng phím mũi tên Trái / Phải và giữ focus không rơi về body (luật N9, I31) */
  onStageKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    const slotButtons = this.hangSlotBtns();
    const activeEl = this.isBrowser ? document.activeElement : null;
    const isFocusInsideSlot =
      !!activeEl &&
      slotButtons.some(
        (btnRef) =>
          btnRef.nativeElement === activeEl || btnRef.nativeElement.contains(activeEl)
      );

    event.preventDefault();
    if (event.key === 'ArrowLeft') {
      this.atelier.prevHanging();
    } else {
      this.atelier.nextHanging();
    }

    if (isFocusInsideSlot && this.isBrowser) {
      const focusActiveSlot = (): void => {
        const currentButtons = this.hangSlotBtns();
        const total = currentButtons.length;
        if (total === 0) {
          return;
        }
        const activeIdx =
          ((this.atelier.activeHangingIndex() % total) + total) % total;
        currentButtons[activeIdx]?.nativeElement.focus({ preventScroll: true });
      };

      queueMicrotask(focusActiveSlot);
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(focusActiveSlot);
      }
    }
  }

  /** Mở ngăn kéo đặt hoa cho mẫu đang đứng ở tâm điểm */
  orderActiveBouquet(): void {
    this.atelier.openOrderForBouquet(this.atelier.activeHangingBouquet());
  }
}

export { HangingGallery as HangingGalleryComponent };
