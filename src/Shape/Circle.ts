import { Shape } from "@/core/Shape/Shape";
import { IBoundingBox, ShapeConstructorOptions } from "@/core/Shape/types";
import { Vector2 } from "@/core/Vector2";

export interface CircleOptions extends ShapeConstructorOptions {
  /** 圆形半径 */
  radius?: number;
}

export class Circle extends Shape<Circle> {
  private _radius: number;

  constructor(options: CircleOptions = {}) {
    super(options);
    this._radius = options.radius || Vector2.one().x;
  }

  /** 圆形半径 */
  get radius(): number {
    return this._radius;
  }

  set radius(value: number) {
    this._radius = value;
  }

  protected calculateBoundingBox(): IBoundingBox {
    const { x, y } = this.absolutePosition;
    const radius = this.realRadius;
    return {
      left: x - radius,
      top: y - radius,
      right: x + radius,
      bottom: y + radius
    };
  }

  draw(context: CanvasRenderingContext2D): void {
    context.save();
    context.beginPath();
    context.arc(this.absolutePosition.x, this.absolutePosition.y, this.realRadius, 0, Math.PI * 2);

    if (this.relativeFillColor.a > 0) {
      context.fillStyle = this.relativeFillColor.toHex();
      context.fill();
    }

    if (this.lineWidth > 0) {
      context.strokeStyle = this.relativeStrokeColor.toHex();
      context.lineWidth = this.lineWidth;
      context.stroke();
    }

    this.isUpdate = false;

    context.restore();
  }

  /** 移动(相对于父节点) */
  protected onTranslate(dx: number, dy: number): void {
    this.position = new Vector2(dx, dy);
  }

  protected onScale(percentage: number): void {
    this.scaleSize = Vector2.one().scale(percentage);
  }

  protected onRotate(_angle: number): void {
    // 圆形旋转不改变形状，所以这里不需要实现
  }

  /** 圆形特有的点击检测方法 */
  isPointInShape(x: number, y: number): boolean {
    const { x: cx, y: cy } = this.absolutePosition;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= this.realRadius * this.realRadius;
  }

  protected get realRadius() {
    return this._radius * this.absoluteScale.x;
  }
}

export default Circle;