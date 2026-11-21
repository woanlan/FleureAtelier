import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { FlowerStem, WrapPaperId } from '../../models/atelier.models';
import { AtelierService } from '../../services/atelier.service';
import { IconComponent } from '../shared/icon/icon';
import { PetalCanvasComponent } from '../shared/petal-canvas/petal-canvas';

/** Tọa độ sắp xếp xoắn ốc tự nhiên cho từng cành hoa thật (tính theo % trên khung 4:5) */
interface HandTiedStemSlot {
  /** Độ nghiêng cành tính từ nút buộc eo bó (độ) */
  readonly angleDeg: number;
  /** Độ dịch ngang tâm bông tính theo % bề rộng khung */
  readonly offsetX: number;
  /** Độ dịch dọc tính theo % chiều cao khung (âm = cao hơn, dương = thấp hơn ở tiền cảnh) */
  readonly offsetY: number;
  /** Tỷ lệ chiều cao cành hoa để tạo độ sâu tự nhiên */
  readonly scale: number;
  /** Thứ tự lớp xếp chồng trước/sau của cành hoa */
  readonly zIndex: number;
}

/** Một cành hoa thật cụ thể đã được gán vị trí cố định trên sân khấu */
export interface PositionedRealStem {
  readonly trackKey: string;
  readonly stem: FlowerStem;
  readonly slotIndex: number;
  readonly angleDeg: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly zIndex: number;
  /** Biến đổi riêng theo từng dáng hoa (cành vươn cao như Phi yến / Tulip / Lan hồ điệp) */
  readonly tallBoost: number;
}

interface StableStemInstance {
  readonly key: string;
  readonly stemId: string;
  readonly occurrence: number;
}

const MAX_VISIBLE_STEMS = 18;
const MAX_STEM_PER_ITEM = 30;
const MIN_STEMS_TO_WRAP = 3;

/**
 * 18 vị trí cắm hoa xoắn gốc (spiral hand-tied) đan xen cân đối trái – phải:
 * đảo chiều cặp 3–4 và 5–6 để khi phối 2 loài hoa (VD: 3 Hồng Juliet + 2 Mẫu Đơn),
 * sắc hoa phân bổ đều hai bên thay vì dồn lệch 1 phía, đồng thời mặt hoa ngồi sát cổ giấy chữ V.
 */
const HAND_TIED_SLOTS: readonly HandTiedStemSlot[] = [
  // Slot 0: Tâm điểm tiền cảnh ôm sát cổ chữ V
  { angleDeg: -1, offsetX: 0, offsetY: 4.5, scale: 1.03, zIndex: 35 },
  // Slot 1 & 2: Cặp tầng giữa trái / phải
  { angleDeg: -15, offsetX: -9.5, offsetY: -1.5, scale: 0.99, zIndex: 30 },
  { angleDeg: 15, offsetX: 9.5, offsetY: -1.5, scale: 0.99, zIndex: 31 },
  // Slot 3 (PHẢI ngoài) & Slot 4 (TRÁI ngoài): đảo chiều giúp 2 loài hoa đan xen đối xứng 2 bên!
  { angleDeg: 25, offsetX: 16.0, offsetY: 3.5, scale: 0.95, zIndex: 28 },
  { angleDeg: -25, offsetX: -16.0, offsetY: 3.5, scale: 0.95, zIndex: 27 },
  // Slot 5 & 6: Tầng vòm cao nhô rõ phía sau
  { angleDeg: -9, offsetX: -7.0, offsetY: -10.5, scale: 0.95, zIndex: 24 },
  { angleDeg: 10, offsetX: 7.5, offsetY: -10.5, scale: 0.95, zIndex: 25 },
  // Slot 7 & 8: Hai cánh ngoài vươn bay tự nhiên
  { angleDeg: 31, offsetX: 19.5, offsetY: -3.5, scale: 0.91, zIndex: 22 },
  { angleDeg: -31, offsetX: -19.5, offsetY: -3.5, scale: 0.91, zIndex: 21 },
  // Slot 9: Đỉnh trung tâm vươn cao (cực nổi cho Phi yến, Tulip, Lan, Hồng Đỏ)
  { angleDeg: 0, offsetX: 0.5, offsetY: -12.5, scale: 0.92, zIndex: 20 },
  // Slot 10 & 11: Tiền cảnh thấp ôm cổ giấy
  { angleDeg: -9, offsetX: -6.0, offsetY: 8.0, scale: 0.92, zIndex: 36 },
  { angleDeg: 10, offsetX: 6.0, offsetY: 8.0, scale: 0.92, zIndex: 37 },
  // Slot 12 & 13: Vòm cao hai bên
  { angleDeg: 19, offsetX: 13.0, offsetY: -9.5, scale: 0.90, zIndex: 19 },
  { angleDeg: -19, offsetX: -13.0, offsetY: -9.5, scale: 0.90, zIndex: 18 },
  // Slot 14..17: Lớp phụ điểm xuyết đầy đặn
  { angleDeg: -35, offsetX: -21.5, offsetY: 4.0, scale: 0.87, zIndex: 16 },
  { angleDeg: 35, offsetX: 21.5, offsetY: 4.0, scale: 0.87, zIndex: 17 },
  { angleDeg: -16, offsetX: -11.0, offsetY: 8.5, scale: 0.88, zIndex: 34 },
  { angleDeg: 16, offsetX: 11.0, offsetY: 8.5, scale: 0.88, zIndex: 38 },
];

/**
 * Phân khu "Tự bó hoa" (`<app-custom-bouquet-studio>`):
 * Tái hiện sống động trải nghiệm cắm từng cành hoa thật tách nền PNG bay trượt vào bó thắt dây,
 * sau đó bấm "Bó hoa" để 2 lớp giấy lụa thật (quạt giấy nền sau + phễu giấy & nơ satin phía trước)
 * kèm nhành lá khuynh diệp bạc ôm trọn bó hoa mượt mà.
 */
@Component({
  selector: 'app-custom-bouquet-studio',
  standalone: true,
  imports: [IconComponent, PetalCanvasComponent],
  templateUrl: './custom-bouquet-studio.html',
  styleUrl: './custom-bouquet-studio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomBouquetStudio {
  readonly atelier = inject(AtelierService);
  readonly maxStemPerVariety = MAX_STEM_PER_ITEM;
  readonly eucalyptusImage = '/images/studio-stems/eucalyptus.png';
  readonly stagePetalColors = ['#F4B8C8', '#FAD8E1', '#F7D2DC'];

  /** Tham chiếu các nút chọn giấy gói để điều hướng mũi tên chuẩn WAI-ARIA radiogroup */
  private readonly wrapRadioButtons = viewChildren<ElementRef<HTMLButtonElement>>('wrapRadioBtn');

  /**
   * Trạng thái đã gói giấy lụa (`true`) hay đang cầm cành rời buộc dây (`false`).
   * - Khi mở trang với mẫu 5 cành mặc định: hiển thị sẵn bó đã gói giấy thật lung linh.
   * - Khi bấm "Làm lại" (0 cành) hoặc "Xem cành rời": chuyển về chế độ xếp từng cành rời bay vào bó,
   *   sau đó bấm "Bó hoa" để chạy hiệu ứng giấy lụa & nơ satin bọc quanh bó hoa như clip mẫu.
   */
  readonly isWrapped = signal<boolean>(this.atelier.totalCustomStems() >= MIN_STEMS_TO_WRAP);

  /** Giữ thứ tự chèn ổn định để khi bấm + chỉ cành hoa mới bay vào, không làm nhảy các cành cũ */
  private readonly stableInstances = signal<readonly StableStemInstance[]>([]);

  private readonly stemById = new Map<string, FlowerStem>(
    this.atelier.stems.map((s) => [s.id, s])
  );

  constructor() {
    // Đồng bộ danh sách cành ổn định theo `atelier.stemCounts()` (chỉ thêm cuối / gỡ cuối từng loài)
    effect(() => {
      const counts = this.atelier.stemCounts();
      const total = this.atelier.totalCustomStems();

      this.stableInstances.update((prev) => {
        // Giữ lại toàn bộ cành cũ vẫn còn hợp lệ với số lượng mới
        const kept = prev.filter((inst) => inst.occurrence < (counts[inst.stemId] ?? 0));
        const existingKeys = new Set(kept.map((i) => i.key));
        const next = [...kept];

        // Đan xen các cành mới theo vòng (đặc biệt đẹp khi khởi tạo nhiều cành cùng lúc)
        const entries = this.atelier.selectedStemEntries();
        if (entries.length > 0) {
          const maxCount = Math.max(...entries.map((e) => e.count));
          for (let occ = 0; occ < maxCount; occ++) {
            for (const entry of entries) {
              if (occ < entry.count) {
                const key = `${entry.stem.id}-${occ}`;
                if (!existingKeys.has(key)) {
                  existingKeys.add(key);
                  next.push({ key, stemId: entry.stem.id, occurrence: occ });
                }
              }
            }
          }
        }
        return next;
      });

      // Nếu người dùng xóa sạch cành về 0 -> tự động mở lại chế độ xếp cành rời
      if (total === 0 && this.isWrapped()) {
        this.isWrapped.set(false);
      }
    });
  }

  /** Tối đa 18 cành hoa thật đặt vào các vị trí xoắn gốc cố định */
  readonly positionedStems = computed<readonly PositionedRealStem[]>(() => {
    const list = this.stableInstances().slice(0, MAX_VISIBLE_STEMS);
    const result: PositionedRealStem[] = [];

    for (let idx = 0; idx < list.length; idx++) {
      const inst = list[idx];
      const stem = this.stemById.get(inst.stemId);
      if (!stem) continue;
      const slot = HAND_TIED_SLOTS[idx] ?? HAND_TIED_SLOTS[0];
      result.push({
        trackKey: inst.key,
        stem,
        slotIndex: idx,
        angleDeg: slot.angleDeg,
        offsetX: slot.offsetX,
        offsetY: slot.offsetY,
        scale: slot.scale,
        zIndex: slot.zIndex,
        tallBoost: this.resolveTallBoost(stem.id),
      });
    }

    return result;
  });

  /** Số cành vượt ngưỡng 18 cành hiển thị trên sân khấu */
  readonly hiddenBloomCount = computed<number>(() =>
    Math.max(0, this.atelier.totalCustomStems() - MAX_VISIBLE_STEMS)
  );

  /** Nhãn tên giấy gói chuẩn tiếng Việt (tránh lặp chữ "Giấy Giấy Đỏ Ruby") */
  readonly wrapDisplayLabel = computed<string>(() => {
    const name = this.atelier.selectedWrap().name;
    return name.startsWith('Giấy') ? name : `Giấy ${name}`;
  });

  /** Cờ xác định bó hoa đã đủ >= 3 cành để tiến hành gói giấy hoặc đặt hàng */
  readonly canWrapOrOrder = computed<boolean>(
    () => this.atelier.totalCustomStems() >= MIN_STEMS_TO_WRAP
  );

  /** Bấm chọn 1 trong 3 loại giấy gói: đổi giấy tức thì và tự kích hoạt gói nếu đã đủ >= 3 cành */
  selectWrapPaper(wrapId: WrapPaperId): void {
    this.atelier.selectWrap(wrapId);
    if (this.canWrapOrOrder() && !this.isWrapped()) {
      this.isWrapped.set(true);
    }
  }

  /** Bật/tắt chế độ xem cành rời buộc dây vs đã gói giấy lụa thật */
  toggleWrapPreview(): void {
    if (this.isWrapped()) {
      this.isWrapped.set(false);
      return;
    }
    this.wrapBouquetNow();
  }

  /** Nút "Bó hoa" trên sân khấu/bảng tóm tắt: kiểm tra >= 3 cành rồi chạy hiệu ứng gói giấy thật */
  wrapBouquetNow(): void {
    if (this.atelier.totalCustomStems() < MIN_STEMS_TO_WRAP) {
      this.atelier.customBuilderError.set(
        'Chọn tối thiểu 3 cành hoa để nghệ nhân có thể lên phom bó.'
      );
      return;
    }
    this.atelier.customBuilderError.set(null);
    this.isWrapped.set(true);
  }

  /** Xử lý nút chính trên bảng tóm tắt: nếu đang để cành rời -> chạy "Bó hoa", nếu đã gói -> mở ngăn đặt hàng */
  onPrimaryAction(): void {
    if (!this.isWrapped()) {
      this.wrapBouquetNow();
      return;
    }
    this.atelier.openOrderForCustomBouquet();
  }

  /** Làm lại toàn bộ về 0 cành và mở chế độ xếp cành rời để trải nghiệm từng bông bay vào */
  onResetStudio(): void {
    this.isWrapped.set(false);
    this.atelier.resetCustomBouquet();
  }

  /** Khôi phục gợi ý 5 cành tiêu chuẩn và mở hiệu ứng gói giấy mượt */
  onRestoreStarter(): void {
    this.atelier.restoreStarterBouquet();
    this.isWrapped.set(true);
  }

  onWrapKeydown(event: KeyboardEvent, currentIndex: number): void {
    const papers = this.atelier.wrapPapers;
    const total = papers.length;
    if (total === 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % total;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + total) % total;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = total - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetPaper = papers[nextIndex];
      if (targetPaper) {
        this.selectWrapPaper(targetPaper.id);
        this.wrapRadioButtons()[nextIndex]?.nativeElement.focus();
      }
    }
  }

  /** Tinh chỉnh nhẹ chiều cao tự nhiên cho các giống hoa vươn cao (Phi yến, Lan hồ điệp, Tulip) */
  private resolveTallBoost(stemId: string): number {
    switch (stemId) {
      case 'delphinium':
        return -5;
      case 'orchid':
        return -3.5;
      case 'tulip':
        return -2;
      case 'chamomile':
        return -2.5;
      default:
        return 0;
    }
  }
}

export { CustomBouquetStudio as CustomBouquetStudioComponent };
