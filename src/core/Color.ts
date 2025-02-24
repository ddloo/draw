/** 颜色类型 */
export enum ColorType {
  /** 白色 */
  White = "white",
  /** 黑色 */
  Black = "black",
  /** 红色 */
  Red = "red",
  /** 绿色 */
  Green = "green",
  /** 蓝色 */
  Blue = "blue",
  /** 黄色 */
  Yellow = "yellow",
  /** 紫色 */
  Cyan = "cyan",
  /** 橙色 */
  Magenta = "magenta",
  /** 透明 */
  Transparent = "transparent"
}

export class Color {
  public r: number;
  public g: number;
  public b: number;
  /** 透明度，范围在 0 到 1 */
  public a: number;

  constructor(color: ColorType | `${ColorType}` | `#${string}`);
  constructor(r: number, g: number, b: number, a?: number);
  constructor(
    colorOrR: ColorType | string | number,
    g?: number,
    b?: number,
    a: number = 1
  ) {
    if (typeof colorOrR === "string") {
      if (Object.values(ColorType).includes(colorOrR as ColorType) || colorOrR in ColorType) {
        // 假设是颜色类型
        const { r, g, b, a } = Color.fromColorType(colorOrR as ColorType);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      } else {
        // 假设是十六进制颜色
        const { r, g, b, a } = Color.fromHex(colorOrR);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
    } else if (typeof colorOrR === "number") {
      // 假设是 RGBA
      this.r = colorOrR;
      this.g = g!;
      this.b = b!;
      this.a = a;
    } else {
      throw new Error("创建 Color 失败，输入了无效的色值");
    }

    this._clamp();
  }

  /** 颜色类型转换为 RGBA */
  static fromColorType(colorType: ColorType): Color {
    switch (colorType) {
        case ColorType.White:
            return new Color(255, 255, 255);
        case ColorType.Black:
            return new Color(0, 0, 0);
        case ColorType.Red:
            return new Color(255, 0, 0);
        case ColorType.Green:
            return new Color(0, 255, 0);
        case ColorType.Blue:
            return new Color(0, 0, 255);
        case ColorType.Yellow:
            return new Color(255, 255, 0);
        case ColorType.Cyan:
            return new Color(0, 255, 255);
        case ColorType.Magenta:
            return new Color(255, 0, 255);
        case ColorType.Transparent:
            return new Color(0, 0, 0, 0);
    }
}
  /** HEX - 创建颜色的静态方法 */
  static fromHex(hex: string): Color {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return new Color(r, g, b, 1);
  }

  /** RGB - 创建颜色的静态方法 */
  static fromRGB(r: number, g: number, b: number): Color {
    return new Color(r, g, b);
  }

  /** RGBA - 创建颜色的静态方法 */
  static fromRGBA(r: number, g: number, b: number, a: number): Color {
    return new Color(r, g, b, a);
  }

  /** 偏移色值 */
  offset(amount: number): Color {
    return new Color(
      this.r + amount,
      this.g + amount,
      this.b + amount,
      this.a
    )._clamp();
  }

  /** 混合颜色 */
  mix(other: Color, weight: number = 0.5): Color {
    return new Color(
      this.r * (1 - weight) + other.r * weight,
      this.g * (1 - weight) + other.g * weight,
      this.b * (1 - weight) + other.b * weight,
      this.a * (1 - weight) + other.a * weight
    )._clamp();
  }

  /** 设置透明度 */
  alpha(alpha: number) {
    this.a = alpha;
    return this;
  }

  /** 转换为 rgba 字符串 */
  toRGBA(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  /** 转换为十六进制字符串 */
  toHex(): string {
    const r = Math.round(this.r).toString(16).padStart(2, '0');
    const g = Math.round(this.g).toString(16).padStart(2, '0');
    const b = Math.round(this.b).toString(16).padStart(2, '0');
    
    // 将 alpha 值（0-1）转换为两位十六进制（00-FF）
    const a = Math.round(this.a * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}${a}`;
  }

  /** 限制颜色值，确保颜色值在有效范围内 */
  private _clamp(): Color {
    this.r = Math.min(255, Math.max(0, Math.round(this.r)));
    this.g = Math.min(255, Math.max(0, Math.round(this.g)));
    this.b = Math.min(255, Math.max(0, Math.round(this.b)));
    this.a = Math.min(1, Math.max(0, this.a));
    return this;
  }
}