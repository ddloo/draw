/** 2d向量 */
export class Vector2 {
  constructor(public x: number, public y: number) {}

  /** 向量加法 */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** 向量减法 */
  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** 向量缩放 */
  scale(scalar: Vector2): Vector2
  scale(scaleX: number, scaleY: number): Vector2
  scale(scalar: number): Vector2
  scale(scalarX: number | Vector2, scalarY?: number): Vector2 {
    if (scalarX instanceof Vector2) {
      return new Vector2(this.x * scalarX.x, this.y * scalarX.y);
    }
    return new Vector2(this.x * scalarX, this.y * (scalarY ?? scalarX));
  }

  /** 向量点积 */
  dot(v: Vector2): number {
    // 数学问题
    return this.x * v.x + this.y * v.y;
  }

  /** 向量长度 */
  length(): number {
    // 数学问题，开根号
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** 向量长度的平方 */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** 向量归一化（主要是为了简化运算）
   * @description 这里使用的是1-范数，还有另一种是2-范数
   * @description 文档：https://baike.baidu.com/item/%E5%90%91%E9%87%8F%E5%BD%92%E4%B8%80%E5%8C%96%E6%B3%95/22779174
   */
  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) {
      return new Vector2(0, 0);
    }
    return this.scale(1 / len);
  }

  /** 计算两点之间的距离
   * @description 利用欧式距离 Euclidean distance
   */
  distanceTo(v: Vector2): number {
    return this.subtract(v).length();
  }

  /** 计算两点之间距离的平方 */
  distanceToSquared(v: Vector2): number {
    return this.subtract(v).lengthSquared();
  }

  /** 线性插值
   * @description 在两个值之间进行平滑过渡
   */
  lerp(v1: Vector2, t: number): Vector2 {
    // 确保 t 在 [0, 1] 范围内
    t = Math.max(0, Math.min(1, t));
    
    return new Vector2(
      this.x + (v1.x - this.x) * t,
      this.y + (v1.y - this.y) * t
    );
  }

  /** 向量旋转
   * @description 画个图就可以知道，本质上是一个余弦/正弦问题
   */
  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /** 克隆向量 */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /** 设置向量的值 */
  set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }

  /** 向量相等性比较 */
  equals(v: Vector2): boolean {
    return this.x === v.x && this.y === v.y;
  }

  /** 转换为数组 */
  toArray(): [number, number] {
    return [this.x, this.y];
  }

  /** 从数组创建向量 */
  static fromArray(arr: [number, number]): Vector2 {
    return new Vector2(arr[0], arr[1]);
  }

  /** 计算基于x轴向量的角度 */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /** 向量叉积 */
  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  /** 计算两个向量的角度 */
  static radio(v1: Vector2, v2: Vector2): number {
    return Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y);
  }

  /** 创建一个零向量 */
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  /**  创建一个单位向量 */
  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  /** 计算贝塞尔曲线的平滑点 */
  static subdivideBezier(v0: Vector2, v1: Vector2, v2: Vector2, v3: Vector2, t: number = 0.5) {
    const q0 = v0.lerp(v1, t);
    const q1 = v1.lerp(v2, t);
    const q2 = v2.lerp(v3, t);
    const r0 = q0.lerp(q1, t);
    const r1 = q1.lerp(q2, t);
    const s = r0.lerp(r1, t);
    
    return s;
  }
}
