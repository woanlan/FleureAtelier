import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AtelierService } from '../../services/atelier.service';
import { AtelierIconName, IconComponent } from '../shared/icon/icon';

/** Cam kết chế tác thủ công tại FLEURÉ — Flower Boutique */
export interface CraftCommitment {
  readonly id: string;
  readonly icon: AtelierIconName;
  readonly title: string;
  readonly detail: string;
}

/** Liên kết điều hướng nhanh cuối trang */
export interface FooterRouteLink {
  readonly label: string;
  readonly route: string;
  readonly fragment?: string;
}

/**
 * Chân trang nghệ thuật (`<app-atelier-footer>`):
 * Nền Rượu vang Ruby đậm độ tương phản cao (> 11:1), giới thiệu 3 chuẩn mực chế tác
 * của FLEURÉ — Flower Boutique cùng địa chỉ 45 Nguyễn Huệ Q.1 TP.HCM, Hotline/Zalo 0909 123 456
 * và liên kết điều hướng đa trang sang Sản phẩm, Tự phối hoa, Khuyến mãi, Bài viết, Trải nghiệm & Giỏ hoa.
 */
@Component({
  selector: 'app-atelier-footer',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './atelier-footer.html',
  styleUrl: './atelier-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierFooter {
  readonly atelier = inject(AtelierService);

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

  /** Các liên kết điều hướng đa trang cuối chân trang */
  readonly quickLinks: readonly FooterRouteLink[] = [
    { label: 'Tất cả sản phẩm hoa', route: '/products' },
    { label: 'Bàn tự phối bó hoa', route: '/', fragment: 'tu-bo-hoa' },
    { label: 'Ưu đãi & Flash Sale', route: '/promotions' },
    { label: 'Góc cẩm nang hoa', route: '/bai_viet' },
    { label: 'Video trải nghiệm Atelier', route: '/experience' },
    { label: 'Giỏ hoa & Thanh toán', route: '/cart' },
  ];

  /** Mở ngăn kéo đặt hoa trực tiếp với mẫu hoa tiêu biểu đang treo tại phòng trưng bày */
  openOrderWorkbench(): void {
    this.atelier.openOrderForBouquet(this.atelier.activeHangingBouquet());
  }
}

export { AtelierFooter as AtelierFooterComponent };
