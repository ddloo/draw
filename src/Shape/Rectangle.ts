import { rotateByDegrees } from "@/Utils/Math";
import { Shape } from "@/core/Shape/Shape";
import { IBoundingBox, ShapeConstructorOptions } from "@/core/Shape/types";
import { Vector2 } from "@/core/Vector2";

interface RectangleOptions extends ShapeConstructorOptions {
  /** 矩形宽度 */
  width?: number;
  /** 矩形高度 */
  height?: number;
}

class Rectangle extends Shape {
  private _width: number;
  private _height: number;

  constructor(options: RectangleOptions = {}) {
    super(options);
    this._width = options.width || 100;  // 默认宽度
    this._height = options.height || 100;  // 默认高度
  }

  /** 矩形宽度 */
  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
    this.isUpdate = true;
  }

  /** 矩形高度 */
  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
    this.isUpdate = true;
  }

  // 绘制方法
  draw(context: CanvasRenderingContext2D): void {
    context.save();
    
    const { x, y } = this.absolutePosition;
    const w = this._width * this.absoluteScale.x;
    const h = this._height * this.absoluteScale.y;

    context.translate(x, y);
    context.rotate(this.absoluteRotation);

    if (this.relativeFillColor.a > 0) {
      context.fillStyle = this.relativeFillColor.toHex();
      context.fillRect(-w / 2, -h / 2, w, h);
    }

    if (this.lineWidth > 0) {
      context.strokeStyle = this.relativeStrokeColor.toHex();
      context.lineWidth = this.lineWidth;
      context.strokeRect(-w / 2, -h / 2, w, h);
    }

    this.isUpdate = false;
    context.restore();
  }

  protected onTranslate(dx: number, dy: number): void {
    this.position = new Vector2(dx, dy);
  }

  protected onScale(percentage: number): void {
    this.scaleSize = Vector2.one().scale(percentage);
  }

  protected onRotate(radio: number): void {
    const angle = rotateByDegrees(radio);
    this.rotation = angle;
  }

  protected calculateBoundingBox(): IBoundingBox {
    const { x, y } = this.absolutePosition;
    const w = this._width * this.absoluteScale.x;
    const h = this._height * this.absoluteScale.y;

    // 注意：这里我们计算的是未旋转时的包围盒
    // 因为包围盒是在旋转前计算的
    // 旋转的处理在基类的 isPointInShape 方法中
    return {
      left: x - w / 2,
      top: y - h / 2,
      right: x + w / 2,
      bottom: y + h / 2
    };
  }
}

export default Rectangle;