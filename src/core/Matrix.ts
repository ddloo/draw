/** 2d矩阵 */
export class Matrix {
  constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public tx: number = 0,
    public ty: number = 0
  ) {}

  /** 创建一个单位矩阵 */
  static identity(): Matrix {
    return new Matrix();
  }

  /** 克隆矩阵 */
  clone(): Matrix {
    return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }

  /** 复制矩阵 */
  copyFrom(matrix: Matrix): Matrix {
    this.a = matrix.a;
    this.b = matrix.b;
    this.c = matrix.c;
    this.d = matrix.d;
    this.tx = matrix.tx;
    this.ty = matrix.ty;
    return this;
  }

  /** 矩阵乘法 */
  multiply(matrix: Matrix): Matrix {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    const tx1 = this.tx;
    const ty1 = this.ty;

    this.a = a1 * matrix.a + b1 * matrix.c;
    this.b = a1 * matrix.b + b1 * matrix.d;
    this.c = c1 * matrix.a + d1 * matrix.c;
    this.d = c1 * matrix.b + d1 * matrix.d;
    this.tx = tx1 * matrix.a + ty1 * matrix.c + matrix.tx;
    this.ty = tx1 * matrix.b + ty1 * matrix.d + matrix.ty;

    return this;
  }

  /** 矩阵缩放 */
  scale(sx: number, sy: number): Matrix {
    this.a *= sx;
    this.b *= sx;
    this.c *= sy;
    this.d *= sy;
    return this;
  }

  /** 矩阵旋转 */
  rotate(angle: number): Matrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;

    this.a = a1 * cos - b1 * sin;
    this.b = a1 * sin + b1 * cos;
    this.c = c1 * cos - d1 * sin;
    this.d = c1 * sin + d1 * cos;

    return this;
  }

  /** 矩阵移动 */
  translate(tx: number, ty: number): Matrix {
    this.tx += tx;
    this.ty += ty;
    return this;
  }

  /** 矩阵逆转换 */
  invert(): Matrix {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    const tx1 = this.tx;
    const ty1 = this.ty;

    let det = a1 * d1 - b1 * c1;

    if (det === 0) {
      throw new Error("Matrix 无效");
    }

    det = 1.0 / det;

    this.a = d1 * det;
    this.b = -b1 * det;
    this.c = -c1 * det;
    this.d = a1 * det;
    this.tx = (c1 * ty1 - d1 * tx1) * det;
    this.ty = (b1 * tx1 - a1 * ty1) * det;

    return this;
  }

  /** 将矩阵变成一个点 */
  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.a * x + this.c * y + this.tx,
      y: this.b * x + this.d * y + this.ty,
    };
  }

  /** 转换为字符串 */
  toString(): string {
    return `Matrix(a=${this.a}, b=${this.b}, c=${this.c}, d=${this.d}, tx=${this.tx}, ty=${this.ty})`;
  }
}
