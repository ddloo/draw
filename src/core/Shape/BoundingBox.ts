// 包围盒

import { Vector2 } from "../Vector2";
import { type Shape } from "./Shape";
import { IBoundingBox } from "./types";

export class BoundingBox {
  private _left: number = 0;
  private _right: number = 0;
  private _top: number = 0;
  private _bottom: number = 0;

  constructor(box: IBoundingBox) {
    this._left = box.left;
    this._right = box.right;
    this._top = box.top;
    this._bottom = box.bottom;
  }

  get left(): number {
    return this._left;
  }
  get right(): number {
    return this._right;
  }
  get top(): number {
    return this._top;
  }
  get bottom(): number {
    return this._bottom;
  }

  get width(): number {
    return this._right - this._left;
  }
  get height(): number {
    return this._bottom - this._top;
  }

  get center(): Vector2 {
    return new Vector2(
      (this._left + this._right) / 2,
      (this._top + this._bottom) / 2
    );
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this._left && x <= this._right && y >= this._top && y <= this._bottom
    );
  }

  /** 是否和其他包围盒重叠 */
  intersects(other: BoundingBox): boolean {
    return (
      this._left < other.right &&
      this._right > other.left &&
      this._top < other.bottom &&
      this._bottom > other.top
    );
  }

  /** 从图形生成包围盒 */
  static fromShape(shape: Shape): BoundingBox {
    return new BoundingBox(shape.getBoundingBox());
  }
}
