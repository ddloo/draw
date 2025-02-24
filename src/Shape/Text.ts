import { clearInterval, interval } from "@/Utils";
import { rotateByDegrees } from "@/Utils/Math";
import { Shape } from "@/core/Shape/Shape";
import { CanvasCursorType, ShapeConstructorOptions } from "@/core/Shape/types";
import { Vector2 } from "@/core/Vector2";

interface TextOptions extends ShapeConstructorOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  direction?: CanvasDirection;
  userSelect?: boolean;
  editable?: boolean;
  // lineHeight?: number;
  /** 当 userSelect 为 true 时，选中文案颜色 */
  selectionColor?: string;
}

class Text extends Shape<Text> {
  private _text: string;
  private _fontSize: number;
  private _fontFamily: string;
  private _textAlign: CanvasTextAlign;
  private _textBaseline: CanvasTextBaseline;
  private _direction: CanvasDirection = "inherit";
  private _lineHeight: number = 4;
  private _userSelect: boolean = true;
  private _editable: boolean = true;

  // 绘制光标/编辑
  private _isEditing: boolean = false;
  private _selectionStart: number = 0;
  private _selectionEnd: number = 0;
  private _cursorVisible: boolean = false;
  /** 光标位置 */
  private _cursorPosition: number = 0;
  /** 光标闪烁时间 */
  private _cursorBlinkInterval: { id: NodeJS.Timeout } | null = null;

  constructor(options: TextOptions = {}) {
    super({ cursor: CanvasCursorType.Text, ...options });
    this._text = options.text || "";
    this._fontSize = options.fontSize || 16;
    this._fontFamily = options.fontFamily || "Arial";
    this._textAlign = options.textAlign || "left";
    this._textBaseline = options.textBaseline || "middle";
    this._direction = options.direction || "inherit";
    this._userSelect = options.userSelect || true;
    this._editable = options.editable || true;
    // TODO:针对 lineHeight，现有先暂不支持，实现较为复杂
    // this._lineHeight = options.lineHeight || 4;
  }

  /** 内部使用的函数，不建议外部调用 */
  public readonly __startEditing = () => {
    this._isEditing = true;
    this._cursorPosition = this._text.length;
    this._cursorVisible = true;
    this.isUpdate = true;
    this._startCursorBlink();
  };

  public readonly __stopEditing = () => {
    this._isEditing = false;
    this._cursorVisible = false;
    this.isUpdate = true;
    this._stopCursorBlink();
  };

  private _startCursorBlink(): void {
    this._cursorBlinkInterval = interval(() => {
      this._cursorVisible = !this._cursorVisible;
      this.isUpdate = true;
    }, 500);
  }

  private _stopCursorBlink(): void {
    if (this._cursorBlinkInterval) {
      clearInterval(this._cursorBlinkInterval.id);
      this._cursorBlinkInterval = null;
    }
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    this.isUpdate = true;
    this.isUpdateBoxSize = true;
  }

  get fontSize(): number {
    return this._fontSize;
  }

  set fontSize(value: number) {
    this._fontSize = value;
    this.isUpdate = true;
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  set fontFamily(value: string) {
    this._fontFamily = value;
    this.isUpdate = true;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.save();

    const { x, y } = this.absolutePosition;
    const scale = this.absoluteScale;

    context.translate(x, y);
    context.rotate(this.absoluteRotation);
    context.scale(scale.x, scale.y);

    context.font = `${this._fontSize}px ${this._fontFamily}`;
    context.textAlign = this._textAlign;
    context.textBaseline = this._textBaseline;
    context.direction = this._direction;

    if (this.relativeFillColor.a > 0) {
      context.fillStyle = this.relativeFillColor.toHex();
      context.fillText(this._text, 0, 0);
    }

    if (this.lineWidth > 0) {
      context.strokeStyle = this.relativeStrokeColor.toHex();
      context.lineWidth = this.lineWidth;
      context.strokeText(this._text, 0, 0);
    }

    if (this._isEditing && this._cursorVisible) {
      const cursorX = this.measureText(
        context,
        this._text.slice(0, this._cursorPosition)
      )!.width;
      context.beginPath();
      context.moveTo(cursorX, -this._fontSize / 2);
      context.lineTo(cursorX, this._fontSize / 2);
      context.strokeStyle = this.relativeFillColor.toHex();
      context.lineWidth = 1;
      context.stroke();
    }

    this.isUpdate = false;
    context.restore();
  }

  /** 设置光标位置 */
  setCursorPosition(position: number): void {
    this._cursorPosition = position;
    this.isUpdate = true;
  }

  /** 插入文本 */
  insertText(text: string): void {
    this._text =
      this._text.slice(0, this._cursorPosition) +
      text +
      this._text.slice(this._cursorPosition);
    this._cursorPosition += text.length;
    this.isUpdate = true;
    this.isUpdateBoxSize = true;
  }

  /** 删除文本
   * @description 传入正数删除后面的文本，传入负数删除前面的文本
   */
  deleteText(count: number): void {
    if (count > 0) {
      this._text =
        this._text.slice(0, this._cursorPosition) +
        this._text.slice(this._cursorPosition + count);
    } else {
      const deleteCount = Math.min(Math.abs(count), this._cursorPosition);
      this._text =
        this._text.slice(0, this._cursorPosition - deleteCount) +
        this._text.slice(this._cursorPosition);
      this._cursorPosition -= deleteCount;
    }

    this.isUpdate = true;
    this.isUpdateBoxSize = true;
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

  /** 计算文本的包围盒 */
  protected calculateBoundingBox(context?: CanvasRenderingContext2D) {
    const currentContext =
      context || document.createElement("canvas").getContext("2d");

    if (!currentContext) return null;

    currentContext.save();
    currentContext.font = `${this._fontSize}px ${this._fontFamily}`;

    const metrics = this.measureText(currentContext)!;
    const textWidth = metrics.width;
    const textHeight = this._fontSize;

    let offsetX = 0;
    let offsetY = 0;

    switch (this._textAlign) {
      case "center": {
        offsetX = -textWidth / 2;
        break;
      }
      case "right": {
        offsetX = -textWidth;
        break;
      }
    }

    switch (this._textBaseline) {
      case "middle": {
        offsetY = -textHeight / 2;
        break;
      }
      case "bottom": {
        offsetY = -textHeight;
        break;
      }
      case "top":
        break;
      default:
        offsetY = -textHeight * 0.75;
    }

    if (this._direction === "rtl") {
      // 对于RTL文本,需要翻转X轴的偏移
      offsetX = -offsetX - textWidth;
    }

    const { x, y } = this.absolutePosition;
    const scale = this.absoluteScale;

    currentContext.restore();

    return {
      left: x + offsetX * scale.x,
      top: y + offsetY * scale.y,
      right: x + offsetX * scale.x + textWidth * scale.x,
      bottom: y + offsetY * scale.y + textHeight * scale.y,
    };
  }

  /**
   * 根据给定点获取最近的字符索引
   * @param x 相对于文本左上角的 X 坐标
   * @param y 相对于文本左上角的 Y 坐标
   * @returns 最近的字符索引
   */
  getIndexFromPoint(x: number, y: number): number {
    const context = document.createElement("canvas").getContext("2d")!;
    const metrics = this.measureText(context);
    if (!metrics) return 0;

    const lines = this._text.split("\n");
    let totalHeight = 0;
    let lineIndex = 0;

    // TODO: 不应该使用估算行高，但由于 canvas 不支持获取/设置行高
    // 估算行高，可以根据需要调整这个倍数
    const estimatedLineHeight = this._fontSize * 1.2;

    if (this._direction === "rtl") {
      // 对于RTL文本，需要从右到左遍历
      for (let i = lines.length - 1; i >= 0; i--) {
        if (totalHeight + this._fontSize > y) {
          lineIndex = i;
          break;
        }
        totalHeight += estimatedLineHeight;
      }
    } else {
      // 找到正确的行
      for (let i = 0; i < lines.length; i++) {
        if (totalHeight + this._fontSize > y) {
          lineIndex = i;
          break;
        }
        totalHeight += estimatedLineHeight;
      }
    }

    // 如果点击在最后一行之后，返回文本长度
    if (lineIndex >= lines.length) return this._text.length;

    const line = lines[lineIndex];
    let totalWidth = 0;
    let charIndex = 0;

    // 考虑文本对齐方式
    const lineWidth = this.measureText(context, line)!.width;
    let startX = 0;
    switch (this._textAlign) {
      case "center":
        startX = -lineWidth / 2;
        break;
      case "right":
        startX = -lineWidth;
        break;
      default: // 'left'
        startX = 0;
    }

    // 如果点击位置在当前行文本起始位置之前，返回行首索引
    if (x < startX)
      return (
        this._text.split("\n").slice(0, lineIndex).join("\n").length + lineIndex
      );

    if (this._direction === 'rtl') {
      // 对于RTL文本，需要从右到左遍历
      for (let i = line.length - 1; i >= 0; i--) {
        const char = line[i];
        const charWidth = this.measureText(context, char)!.width;
        totalWidth += charWidth;
  
        if (startX + lineWidth - totalWidth <= x) {
          charIndex = i;
          break;
        }
      }
    } else {
      // 遍历每个字符，累加宽度直到超过点击位置
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const charWidth = this.measureText(context, char)!.width;
        totalWidth += charWidth;
  
        if (startX + totalWidth >= x) {
          // 如果点击位置更接近这个字符的左半边，返回当前索引
          // 否则返回下一个索引
          charIndex =
            x - (startX + totalWidth - charWidth) < startX + totalWidth - x
              ? i
              : i + 1;
          break;
        }
      }
    }


    // 计算总的索引位置
    const previousLinesLength = this._text
      .split("\n")
      .slice(0, lineIndex)
      .join("\n").length;
    return previousLinesLength + (lineIndex > 0 ? lineIndex : 0) + charIndex;
  }

  /** 测量文本 */
  measureText(
    context?: CanvasRenderingContext2D,
    text?: string
  ): TextMetrics | undefined {
    const currentContext =
      context || document.createElement("canvas").getContext("2d");

    if (!currentContext) return;

    currentContext.save();
    currentContext.font = `${this._fontSize}px ${this._fontFamily}`;
    const metrics = currentContext.measureText(text || this._text);
    currentContext.restore();
    return metrics;
  }

  get isEditing(): boolean {
    return this._isEditing;
  }

  /** 光标位置 */
  get cursorPosition(): number {
    return this._cursorPosition;
  }

  set cursorPosition(value: number) {
    this._cursorPosition = value;
    this.isUpdate = true;
  }

  get direction(): CanvasDirection {
    return this._direction;
  }

  set direction(value: CanvasDirection) {
    this._direction = value;
    this.isUpdate = true;
  }

  get textAlign(): CanvasTextAlign {
    return this._textAlign;
  }

  set textAlign(value: CanvasTextAlign) {
    this._textAlign = value;
    this.isUpdate = true;
  }

  get textBaseline(): CanvasTextBaseline {
    return this._textBaseline;
  }

  set textBaseline(value: CanvasTextBaseline) {
    this._textBaseline = value;
    this.isUpdate = true;
  }
}

export default Text;
