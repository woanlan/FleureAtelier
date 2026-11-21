import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { AtelierService } from '../../services/atelier.service';
import { AtelierIconName, IconComponent } from '../shared/icon/icon';

/** Cam kết chế tác thủ công tại FLEURÉ — Flower Boutique */
export interface CraftCommitment {
  readonly id: string;
  readonly icon: AtelierIconName;
  readonly title: string;
  readonly detail: string;
}

/** Liên kết neo điều hướng nhanh cuối trang */
export interface FooterAnchorLink {
  readonly label: string;
  readonly href: string;
}

/**
 * Chân trang nghệ thuật (`<app-atelier-footer>`):
 * Nền Rượu vang Ruby đậm độ tương phản cao (> 11:1), giới thiệu 3 chuẩn mực chế tác
 * của FLEURÉ — Flower Boutique cùng địa chỉ 45 Nguyễn Huệ Q.1 TP.HCM và Hotline/Zalo 0909 123 456.
 */
@Component({
  selector: 'app-atelier-footer',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './atelier-footer.html',
  styleUrl: './atelier-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierFooter {
  readonly atelier = inject(AtelierService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Ba kỷ luật chế tác cốt lõi mỗi ngày tại FLEURÉ Sài Gòn */
  readonly craftCommitments: readonly CraftCommitment[] = [
    {
      id: 'early-cut',
      icon: 'sun',
      title: 'Hoa Đà Lạt cắt sương mỗi sáng',
      detail: 'Tuyển chọn hồng pastel, tulip và lan Bảo Lộc nhập chuyến sớm nhất trong ngày.',
    },
    {
      id: 'hand-wrap',
      icon: 'scissors',
      title: 'Gói lụa hai lớp chuẩn phong cách Pháp',
      detail: 'Bó xoắn gốc kèm bông giữ ẩm và thiệp viết tay FLEURÉ cho từng đơn hàng.',
    },
    {
      id: 'express-delivery',
      icon: 'clock',
      title: 'Giao hỏa tốc nội thành TP.HCM 60 phút',
      detail: 'Miễn phí vận chuyển cho đơn từ 399.000đ và gửi ảnh thật trước khi giao.',
    },
  ];

  /** Các liên kết neo đến từng phân khu chính trên trang */
  readonly quickLinks: readonly FooterAnchorLink[] = [
    { label: 'Bộ sưu tập', href: '#bo-suu-tap' },
    { label: 'Danh mục dịp', href: '#theo-dip' },
    { label: 'Tự phối hoa', href: '#tu-bo-hoa' },
    { label: 'Mùa Đà Lạt', href: '#lich-hoa' },
  ];

  /** Mở ngăn kéo đặt hoa trực tiếp với mẫu hoa tiêu biểu đang treo tại phòng trưng bày */
  openOrderWorkbench(): void {
    this.atelier.openOrderForBouquet(this.atelier.activeHangingBouquet());
  }

  /** Cuộn mượt chủ động tới phân khu neo khi người dùng bấm liên kết chân trang */
  scrollToSection(event: Event, href: string): void {
    if (!this.isBrowser || !href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

export { AtelierFooter as AtelierFooterComponent };
