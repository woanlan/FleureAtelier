import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';

interface FloatingPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  swayAmplitude: number;
  swaySpeed: number;
  swayPhase: number;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  opacity: number;
  colorIndex: number;
}

/**
 * Component Canvas hiệu ứng cánh hoa rơi tự nhiên (`<app-petal-canvas>`).
 * - Chỉ khởi chạy vòng lặp `requestAnimationFrame` trên trình duyệt (`isPlatformBrowser`).
 * - Tự động tạm dừng khi khuất khỏi khung nhìn (`IntersectionObserver`), khi ẩn tab,
 *   hoặc khi hệ điều hành bật chế độ giảm chuyển động (`prefers-reduced-motion: reduce`).
 * - Dọn dẹp trọn vẹn tài nguyên qua `DestroyRef`.
 */
@Component({
  selector: 'app-petal-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
  },
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  template: `<canvas #petalCanvas aria-hidden="true"></canvas>`,
})
export class PetalCanvasComponent implements AfterViewInit {
  /** Bảng màu cánh hoa (mặc định tông phấn hồng ngà, tự cập nhật khi đổi dịp tặng) */
  readonly colors = input<readonly string[]>(['#F4C2C2', '#FADADD', '#FFF5EE']);

  /** Mật độ số lượng cánh hoa tối đa trên khung vẽ */
  readonly density = input<number>(22);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('petalCanvas');
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private ctx: CanvasRenderingContext2D | null = null;
  private petals: FloatingPetal[] = [];
  private width = 0;
  private height = 0;
  private rafId: number | null = null;
  private isInViewport = true;
  private prefersReducedMotion = false;
  private isTabHidden = false;
  private initialized = false;

  constructor() {
    // Đồng bộ lại số lượng cánh hoa hoặc vẽ lại khung tĩnh khi input colors / density đổi
    effect(() => {
      const palette = this.colors();
      const targetDensity = Math.max(0, Math.min(60, Math.floor(this.density())));
      if (!this.isBrowser || !this.initialized) return;

      this.syncPetalCount(targetDensity, palette.length);
      this.updateLoopState();
      if (this.prefersReducedMotion) {
        this.renderFrame(false);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.measureAndResize();
    this.initialized = true;
    this.syncPetalCount(
      Math.max(0, Math.min(60, Math.floor(this.density()))),
      Math.max(1, this.colors().length)
    );

    // 1. Theo dõi chế độ giảm chuyển động của người dùng (an toàn cả trong môi trường jsdom test)
    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    this.prefersReducedMotion = motionQuery?.matches ?? false;
    const onMotionChange = (event: MediaQueryListEvent): void => {
      this.prefersReducedMotion = event.matches;
      this.updateLoopState();
      if (this.prefersReducedMotion) {
        this.renderFrame(false);
      }
    };
    motionQuery?.addEventListener('change', onMotionChange);

    // 2. Theo dõi thay đổi kích thước khung chứa
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        this.measureAndResize();
        if (this.prefersReducedMotion) {
          this.renderFrame(false);
        }
      });
      resizeObserver.observe(this.hostRef.nativeElement);
    }

    // 3. Tạm dừng vòng lặp khi phân khu cuộn ra ngoài màn hình
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            this.isInViewport = entry.isIntersecting;
            this.updateLoopState();
          }
        },
        { threshold: 0.02 }
      );
      intersectionObserver.observe(this.hostRef.nativeElement);
    }

    // 4. Tạm dừng khi người dùng chuyển sang tab khác
    const onVisibilityChange = (): void => {
      this.isTabHidden = document.hidden;
      this.updateLoopState();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (this.prefersReducedMotion) {
      this.renderFrame(false);
    } else {
      this.updateLoopState();
    }

    // Dọn dẹp toàn bộ tài nguyên khi hủy component
    this.destroyRef.onDestroy(() => {
      this.stopLoop();
      motionQuery?.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
    });
  }

  private measureAndResize(): void {
    const host = this.hostRef.nativeElement;
    const canvas = this.canvasRef().nativeElement;
    const rect = host.getBoundingClientRect();
    const nextW = Math.max(1, Math.floor(rect.width));
    const nextH = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = nextW;
    this.height = nextH;
    canvas.width = Math.floor(nextW * dpr);
    canvas.height = Math.floor(nextH * dpr);

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private syncPetalCount(targetCount: number, paletteLength: number): void {
    const safePaletteLen = Math.max(1, paletteLength);
    while (this.petals.length < targetCount) {
      this.petals.push(this.createPetal(true, safePaletteLen));
    }
    if (this.petals.length > targetCount) {
      this.petals.length = targetCount;
    }
  }

  private createPetal(scatterVertically: boolean, paletteLength: number): FloatingPetal {
    const w = this.width || 1200;
    const h = this.height || 700;
    return {
      x: Math.random() * w,
      y: scatterVertically ? Math.random() * h : -24 - Math.random() * 60,
      size: 7 + Math.random() * 8.5,
      speedY: 0.35 + Math.random() * 0.65,
      swayAmplitude: 0.3 + Math.random() * 0.75,
      swaySpeed: 0.008 + Math.random() * 0.014,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.016,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: 0.012 + Math.random() * 0.018,
      opacity: 0.36 + Math.random() * 0.34,
      colorIndex: Math.floor(Math.random() * paletteLength),
    };
  }

  private updateLoopState(): void {
    const shouldAnimate =
      !this.prefersReducedMotion && this.isInViewport && !this.isTabHidden && this.petals.length > 0;

    if (shouldAnimate && this.rafId === null) {
      const tick = (): void => {
        this.renderFrame(true);
        this.rafId = window.requestAnimationFrame(tick);
      };
      this.rafId = window.requestAnimationFrame(tick);
    } else if (!shouldAnimate && this.rafId !== null) {
      this.stopLoop();
    }
  }

  private stopLoop(): void {
    if (this.rafId !== null && this.isBrowser) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private renderFrame(advancePhysics: boolean): void {
    const ctx = this.ctx;
    if (!ctx || this.width <= 0 || this.height <= 0) return;

    ctx.clearRect(0, 0, this.width, this.height);
    const palette = this.colors();
    const safePalette = palette.length > 0 ? palette : ['#F4C2C2'];

    for (const petal of this.petals) {
      if (advancePhysics) {
        petal.swayPhase += petal.swaySpeed;
        petal.y += petal.speedY;
        petal.x += Math.sin(petal.swayPhase) * petal.swayAmplitude;
        petal.rotation += petal.rotationSpeed;
        petal.tilt += petal.tiltSpeed;

        if (petal.y > this.height + 28) {
          petal.y = -24;
          petal.x = Math.random() * this.width;
        }
        if (petal.x < -28) {
          petal.x = this.width + 24;
        } else if (petal.x > this.width + 28) {
          petal.x = -24;
        }
      }

      const fillHex = safePalette[petal.colorIndex % safePalette.length];
      const scaleX = 0.45 + Math.abs(Math.cos(petal.tilt)) * 0.55;
      const r = petal.size;

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.scale(scaleX, 1);
      ctx.globalAlpha = petal.opacity;

      // Dáng cánh hoa bầu mềm tự nhiên bằng đường cong Bezier
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.85, -r * 0.55, r * 0.9, r * 0.45, 0, r);
      ctx.bezierCurveTo(-r * 0.9, r * 0.45, -r * 0.85, -r * 0.55, 0, -r);
      ctx.closePath();

      ctx.fillStyle = fillHex;
      ctx.fill();
      ctx.restore();
    }
  }
}

export { PetalCanvasComponent as PetalCanvas };
