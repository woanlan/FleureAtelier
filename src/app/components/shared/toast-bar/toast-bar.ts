import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AtelierService } from '../../../services/atelier.service';
import { IconComponent } from '../icon/icon';

/**
 * Thanh thông báo Toast nổi cuối màn hình (`<app-toast-bar>`).
 * Hỗ trợ nút "Hoàn tác" khi người dùng vừa xóa sản phẩm khỏi giỏ hoa.
 */
@Component({
  selector: 'app-toast-bar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toast-bar.html',
  styleUrl: './toast-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastBar {
  readonly atelier = inject(AtelierService);
}
