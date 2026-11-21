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
 * 18 vị trí cắm hoa xoắn gốc (spiral hand-tied) chuẩn kỹ thuật tiệm hoa Pháp–Hàn:
 * giữ cành đan chéo tại nút eo bó (`transform-origin: 50% 80%`) và xòe tròn hài hòa.
 */
const HAND_TIED_SLOTS: readonly HandTiedStemSlot[] = [
  // Tâm điểm & cặp ôm hai bên (3 cành đầu tiên cân đối, thoáng từng bông hoa)
  { angleDeg: -1, offsetX: 0, offsetY: 3.5, scale: 1.03, zIndex: 34 },
  { angleDeg: -16, offsetX: -9.5, offsetY: -2.0, scale: 0.99, zIndex: 30 },
  { angleDeg: 15, offsetX: 9.5, offsetY: -1.5, scale: 0.99, zIndex: 31 },
  // 2 cành mở rộng hai cánh trái/phải (5 cành xòe tròn khoe trọn từng bông)
  { angleDeg: -26, offsetX: -16.5, offsetY: 2.5, scale: 0.95, zIndex: 27 },
  { angleDeg: 25, offsetX: 16.5, offsetY: 3.0, scale: 0.95, zIndex: 28 },
  // Lớp vòm cao phía sau — nhô hẳn lên trên để cành thứ 6, 7 luôn hiện rõ trọn mặt hoa
  { angleDeg: -10, offsetX: -7.5, offsetY: -12.5, scale: 0.96, zIndex: 24 },
  { angleDeg: 11, offsetX: 8.0, offsetY: -12.0, scale: 0.96, zIndex: 25 },
  // Hai cánh ngoài vươn bay tự nhiên
  { angleDeg: -32, offsetX: -20.0, offsetY: -4.5, scale: 0.92, zIndex: 21 },
  { angleDeg: 31, offsetX: 20.0, offsetY: -4.0, scale: 0.92, zIndex: 22 },
  // Lớp đỉnh trung tâm vươn cao (cực nổi cho Phi yến, Tulip, Hồng Đỏ, Lan)
  { angleDeg: 0, offsetX: 0.5, offsetY: -14.5, scale: 0.93, zIndex: 20 },
  // Lớp tiền cảnh thấp ôm sát cổ giấy chữ V
  { angleDeg: -10, offsetX: -6.5, offsetY: 7.5, scale: 0.93, zIndex: 36 },
  { angleDeg: 11, offsetX: 6.5, offsetY: 7.5, scale: 0.93, zIndex: 37 },
  // Lớp vòm cao hai bên
  { angleDeg: -20, offsetX: -13.5, offsetY: -11.0, scale: 0.91, zIndex: 18 },
  { angleDeg: 20, offsetX: 13.5, offsetY: -10.5, scale: 0.91, zIndex: 19 },
  // Lớp phụ điểm xuyết đầy đặn (15..18 cành)
  { angleDeg: -36, offsetX: -22.0, offsetY: 3.5, scale: 0.88, zIndex: 16 },
  { angleDeg: 36, offsetX: 22.0, offsetY: 3.5, scale: 0.88, zIndex: 17 },
  { angleDeg: -17, offsetX: -11.5, offsetY: 8.0, scale: 0.89, zIndex: 35 },
  { angleDeg: 17, offsetX: 11.5, offsetY: 8.0, scale: 0.89, zIndex: 38 },
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
