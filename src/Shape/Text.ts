import { CVFocusEvent, emitter, EventHandler } from "@/Events";
import { clearInterval, interval } from "@/Utils";
import { rotateByDegrees } from "@/Utils/Math";
import { Shape } from "@/core/Shape/Shape";
import { CanvasCursorType, EventType, ShapeConstructorOptions } from "@/core/Shape/types";
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
  private _selectionColor: string = "#1890ff";

  // 绘制光标/编辑
  private _isEditing: boolean = false;
  private _selectionStart: number = 0;
  private _selectionEnd: number = 0;
  private _cursorVisible: boolean = false;
  /** 光标位置 */
  private _cursorPosition: number = 0;
  /** 光标闪烁时间 */
  private _cursorBlinkInterval: { id: NodeJS.Timeout } | null = null;
  /** 是否正在选择文本 */
  private _isSelecting: boolean = false;

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
    this._selectionColor = options.selectionColor || "#1890ff";
    // TODO:针对 lineHeight，现有先暂不支持，实现较为复杂
    // this._lineHeight = options.lineHeight || 4;
  }

  /** 开始编辑
   * @private
   */
  public readonly __startEditing = () => {
    this._isEditing = true;
    this._cursorPosition = this._text.length;
    this._cursorVisible = true;
    this.isUpdate = true;
    this._startCursorBlink();
  };

  /** 停止编辑
   * @private
   */
  public readonly __stopEditing = () => {
    this._isEditing = false;
    this._cursorVisible = false;
    this.isUpdate = true;
    this._stopCursorBlink();
  };

  /** 开始选择文本
   * @private
   */
  public readonly __startSelecting = (position: number) => {
    if (!this._userSelect) return;
    
    this._isSelecting = true;
    this._selectionStart = position;
    this._selectionEnd = position;
    this._cursorPosition = position;
    this.isUpdate = true;
  };

  /** 更新选择范围
   * @private
   */
  public readonly __updateSelection = (position: number) => {
    if (!this._isSelecting || !this._userSelect) return;
    
    this._selectionEnd = position;
    this._cursorPosition = position;
    this.isUpdate = true;
  };

  /** 结束选择文本
   * @private
   */
  public readonly __stopSelecting = () => {
    this._isSelecting = false;
    // 确保选区开始位置总是小于结束位置
    if (this._selectionStart > this._selectionEnd) {
      [this._selectionStart, this._selectionEnd] = [this._selectionEnd, this._selectionStart];
    }
    this.isUpdate = true;
  };

  /** 获取当前选中的文本 */
  public getSelectedText(): string {
    if (this._selectionStart === this._selectionEnd) return "";
    const start = Math.min(this._selectionStart, this._selectionEnd);
    const end = Math.max(this._selectionStart, this._selectionEnd);
    return this._text.substring(start, end);
  }

  /** 清除选区 */
  public clearSelection(): void {
    this._selectionStart = this._selectionEnd = this._cursorPosition;
    this.isUpdate = true;
  }

  private _startCursorBlink(): void {
    this._cursorBlinkInterval = interval(() => {
      this._cursorVisible = !this._cursorVisible;
      this.isUpdate = true;
      emitter.emit(EventType.UpdateShape, this);
    }, 500);
  }

  private _stopCursorBlink(): void {
    if (this._cursorBlinkInterval) {
      clearInterval(this._cursorBlinkInterval.id);
      this._cursorBlinkInterval = null;
      emitter.emit(EventType.UpdateShape, this);
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

    // 绘制选区
    if (this._selectionStart !== this._selectionEnd && this._userSelect) {
      const start = Math.min(this._selectionStart, this._selectionEnd);
      const end = Math.max(this._selectionStart, this._selectionEnd);
      
      // 计算选区位置
      const startX = this.measureText(this._text.slice(0, start))!.width;
      const width = this.measureText(this._text.slice(start, end))!.width;
      
      // 绘制选区背景
      context.fillStyle = this._selectionColor;
      context.fillRect(startX, -this._fontSize / 2, width, this._fontSize);
    }

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
      const cursorX = this._cursorPosition === 0 ? 0 : this.measureText(this._text.slice(0, this._cursorPosition))!.width;
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
    const lines = this._text.split("\n");
    const lineHeight = this._fontSize * 1.2; // 估算行高
    
    let lineIndex = Math.floor(y / lineHeight);
    lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
    
    const line = lines[lineIndex];
    
    let low = 0;
    let high = line.length;
    
    // 二分，本质在[0, width]找到最接近x轴最接近的字符
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const width = this.measureText(line.slice(0, mid))!.width;
      if (width >= x) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    
    if(low === 0) {
      const currentWidth = this.measureText(line.slice(0, 1))!.width;
      if(x > currentWidth / 2) {
        low++;
      }
    } else if (low > 0 && low <= line.length) {
      // 检查点是否在字符的中心偏右侧，如果是则返回左侧索引
      const leftWidth = this.measureText(line.slice(0, low - 1))!.width;
      const currentWidth = this.measureText(line.slice(0, low))!.width;
      const charWidth = currentWidth - leftWidth;
      
      // 如果点在字符的中心偏右侧，则返回左侧的索引
      if (x < leftWidth + charWidth / 2) {
        low = low - 1;
      }
    }

    return lines.slice(0, lineIndex).join("\n").length + low;
  }

  /** 测量文本 */
  measureText(text: string): TextMetrics | undefined
  measureText(context?: CanvasRenderingContext2D, text?: string): TextMetrics | undefined
  measureText(
    contextOrText?: CanvasRenderingContext2D | string,
    text?: string
  ): TextMetrics | undefined {
    let currentContext: CanvasRenderingContext2D;
    if(contextOrText instanceof CanvasRenderingContext2D) {
      currentContext = contextOrText;
    } else {
      currentContext = document.createElement("canvas").getContext("2d")!;
      currentContext.font = `${this._fontSize}px ${this._fontFamily}`;
      currentContext.textAlign = this._textAlign;
      currentContext.textBaseline = this._textBaseline;
      currentContext.direction = this._direction;
      currentContext.translate(this.absolutePosition.x, this.absolutePosition.y);
      currentContext.rotate(this.absoluteRotation);
      currentContext.scale(this.absoluteScale.x, this.absoluteScale.y);
    }
    const actualText = text ?? (typeof contextOrText === 'string' ? contextOrText : undefined);
    const metrics = currentContext.measureText(actualText ?? this._text);
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

  /** 设置选区范围 */
  setSelectionRange(start: number, end: number): void {
    if (!this._userSelect) return;
    
    this._selectionStart = Math.max(0, Math.min(start, this._text.length));
    this._selectionEnd = Math.max(0, Math.min(end, this._text.length));
    this._cursorPosition = this._selectionEnd;
    this.isUpdate = true;
  }

  get selectionStart(): number {
    return this._selectionStart;
  }

  get selectionEnd(): number {
    return this._selectionEnd;
  }

  get isSelecting(): boolean {
    return this._isSelecting;
  }

  get userSelect(): boolean {
    return this._userSelect;
  }

  set userSelect(value: boolean) {
    this._userSelect = value;
    if (!value) {
      this.clearSelection();
    }
  }

  get selectionColor(): string {
    return this._selectionColor;
  }

  set selectionColor(value: string) {
    this._selectionColor = value;
    this.isUpdate = true;
  }
}

export default Text;
