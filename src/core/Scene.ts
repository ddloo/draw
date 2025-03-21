import { Shape } from "./Shape/Shape";
import Canvas from "./Canvas";
import {
  BubbleEventType,
  CaptureEventType,
  CVEvent,
  emitter,
  EventsType,
  isOpenMouseMoveEvent,
  WindowsEventKeys,
} from "@Events/index";
import { ShapeRoot } from "./Shape/ShapeRoot";
import { CanvasCursorType, CAPTURE_NAME, EventType } from "./Shape/types";
import { Vector2 } from "./Vector2";
import Text from "@/Shape/Text";
import { createTextarea } from "@/Utils/Dom";
import { BoundingBox } from "./Shape/BoundingBox";
import { BoundBoxView } from "./BoundBoxView";

export class Scene {
  private _canvas: Canvas;
  private _shapeRoot: ShapeRoot;
  private _lastCursor: CanvasCursorType;
  private _lastHoveredShape: Shape | null = null;
  /** 创建包围盒的工厂类 */
  private _boundBoxView: BoundBoxView;
  /** 需要渲染包围盒的 shape */
  private _renderedShapeBox: Set<Shape> = new Set();
  /** 渲染的包围盒 id map */
  private _boundingBox = new Map<string, string[]>();
  /** 当前正在编辑的文本 */
  private _currentEditingText: Text | null = null;
  /** 当前正在编辑的dom文本框 */
  private _hiddenTextarea: HTMLTextAreaElement = createTextarea("");
  /** 正在进行的文本选择 shape */
  private _selectingTextShape: Text | null = null;
  /** 当前获得焦点的 shape */
  private _focusedShape: Shape | null = null;

  private _isRendering: boolean = false;

  constructor(canvas?: Canvas) {
    (canvas && (this._canvas = canvas)) || (this._canvas = new Canvas());
    this._lastCursor = this._canvas.cursor;
    this._shapeRoot = new ShapeRoot();
    this._boundBoxView = new BoundBoxView();
    document.body.appendChild(this._canvas.canvas);
    this._bindEvents();
  }

  addShape(shape: Shape, zIndex?: number): string {
    const id = this._shapeRoot.addShape(shape);
    shape.traverseTree((node) => {
      if (node && node instanceof Shape) {
        this._canvas.draw(node);
      }
    });

    this.render();

    return id;
  }

  removeShape(id: string): void {
    this._shapeRoot.removeShape(id);
    this.render();
  }

  /**
   * 更新 shape 包围盒
   */
  _updateShapeBox(): void {
    // 渲染包围盒
    this._renderedShapeBox.forEach((shape) => {
      // 清理之前渲染的包围盒
      this._clearBoundingBoxView(shape);
      // 将包围盒放入渲染队列
      this._handleBoundingBox(shape);
    });
  }

  /**
   * 渲染指定区域
   * @param x 区域左上角x坐标
   * @param y 区域左上角y坐标
   * @param width 区域宽度
   * @param height 区域高度
   */
  renderArea(x: number, y: number, width: number, height: number): void {
    // 清除指定区域
    this._canvas.ctx.clearRect(x, y, width, height);

    // 保存当前状态
    this._canvas.save();

    // 设置裁剪区域，只渲染指定区域内的内容
    this._canvas.ctx.beginPath();
    this._canvas.ctx.rect(x, y, width, height);
    this._canvas.ctx.clip();

    // 渲染该区域内的所有节点
    this._shapeRoot.traverseTree((node) => {
      if (node && node instanceof Shape) {
        // 检查形状是否与指定区域相交
        const boundingBox = node.getBoundingBox();
        if (
          boundingBox.intersects(
            new BoundingBox({
              left: x,
              right: x + width,
              top: y,
              bottom: y + height,
            })
          )
        ) {
          this._canvas.draw(node);
        }
      }
    });

    // 恢复画布状态
    this._canvas.restore();
  }

  /**
   * 渲染形状
   * @param shape 形状
   */
  renderShape(shape: Shape): void {
    const { left, top, width, height } = shape.getBoundingBox();
    const gap = 4;
    this.renderArea(left - gap, top - gap, width + gap * 2, height + gap * 2);
  }

  private _performRender() {
    // 更新 shape 包围盒
    this._updateShapeBox();
    this.renderArea(
      0,
      0,
      this._canvas.canvas.width,
      this._canvas.canvas.height
    );
  }

  render(): void {
    if (this._isRendering) return;
    this._isRendering = true;

    setTimeout(() => {
      this._performRender();
      this._isRendering = false;
    }, 4);
  }

  getCanvas() {
    return this._canvas.canvas;
  }

  get context(): CanvasRenderingContext2D {
    return this._canvas.ctx;
  }

  /** 获取 canvas 坐标 */
  getCanvasPosition(
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const { top, left } = this._canvas.canvas.getBoundingClientRect();
    return { x: clientX - left, y: clientY - top };
  }

  get cursor() {
    return this._canvas.cursor;
  }

  set cursor(cursor: CanvasCursorType) {
    this._lastCursor = cursor;
  }

  /**
   * 处理包围盒
   * @param shape
   */
  private _handleBoundingBox(shape: Shape): void {
    const cornerContainer = this._boundBoxView.makeBoundingBox(shape);
    // 将角落添加到 shape 树中，后续进行渲染
    this._shapeRoot.addShape(cornerContainer);
    this._boundingBox.set(
      shape.id,
      this._boundingBox.get(shape.id)?.concat(cornerContainer.id) || [
        cornerContainer.id,
      ]
    );

    // 可能要根据不同形状，绘制不同的边框
  }

  /** 清理单个包围盒视图 */
  private _clearBoundingBoxView(shape: Shape): void {
    const boxIds = this._boundingBox.get(shape.id);
    boxIds?.forEach((id) => {
      this._shapeRoot.removeShape(id, true);
    });
    this._boundingBox.delete(shape.id);
  }

  /** 清理所有包围盒 */
  private _clearAllBoundingBox(): void {
    this._renderedShapeBox.clear();
    this._boundingBox.forEach((ids) => {
      ids.forEach((id) => {
        this._shapeRoot.removeShape(id, true);
      });
    });
    this._boundingBox.clear();
  }

  private _triggerEvent(
    toggles: ReturnType<ShapeRoot["getToggleEvents"]>,
    eventName: keyof DocumentEventMap,
    event: CVEvent,
    isCapture?: boolean
  ): void;
  private _triggerEvent(
    shape: Shape,
    eventName: keyof DocumentEventMap,
    event: CVEvent,
    isCapture?: boolean
  ): void;
  private _triggerEvent(
    shape: Shape | ReturnType<ShapeRoot["getToggleEvents"]>,
    eventName: keyof DocumentEventMap,
    event: CVEvent,
    isCapture?: boolean
  ): void {
    const currentName = eventName as EventsType;
    const captureName = `${CAPTURE_NAME}${currentName}` as EventsType;
    const toggles =
      "bubble" in shape
        ? shape
        : this._shapeRoot.getToggleEvents(shape, currentName);

    // 如果没有标明是冒泡事件还是捕获事件，则全部事件都触发
    if (isCapture == null) {
      const bubble = toggles.bubble;
      const capture = toggles.capture;

      if (bubble.length) {
        let isPropagationStopped = false;
        for (const toggle of bubble) {
          isPropagationStopped = toggle.handler(
            currentName,
            event,
            toggle.target
          );
          if (isPropagationStopped) break;
        }
      }

      if (capture.length) {
        let isPropagationStopped = false;
        for (const toggle of capture) {
          isPropagationStopped = toggle.handler(
            captureName,
            event,
            toggle.target
          );
          if (isPropagationStopped) break;
        }
      }

      return;
    }

    // 标明了是冒泡事件还是捕获事件
    const eventHandlers = isCapture ? toggles.capture : toggles.bubble;
    let isPropagationStopped = false;

    if (eventHandlers.length) {
      for (const toggle of eventHandlers) {
        isPropagationStopped = toggle.handler(
          isCapture ? captureName : currentName,
          event,
          toggle.target
        );
        if (isPropagationStopped) break;
      }
    }
  }

  /** 处理鼠标移入移出 shape */
  private _handleMouseLeaveAndEnter(event: MouseEvent, shape: Shape | null) {
    if (shape !== this._lastHoveredShape) {
      // 触发 mouseleave 事件
      if (this._lastHoveredShape) {
        this._canvas.cursor = this._lastCursor;
        this._triggerEvent(this._lastHoveredShape, "mouseleave", event);
      }
      if (shape) {
        if (shape.cursor) {
          this._canvas.cursor = shape.cursor;
        }
        this._triggerEvent(shape, "mouseenter", event);
      }
      this._lastHoveredShape = shape;
    }
  }

  private _handleEvent(
    domEventname: keyof DocumentEventMap,
    event: MouseEvent,
    isCapture = false
  ): void {
    // 鼠标位置映射到 canvas 坐标
    const { x, y } = this.getCanvasPosition(event.clientX, event.clientY);
    const shape = this._shapeRoot.findShapeFromPoint(x, y, true);

    // 当鼠标移动时，处理鼠标移入移出 shape
    if (domEventname === "mousemove" && isCapture) {
      this._handleMouseLeaveAndEnter(event, shape);
    }

    // 当鼠标按下时，处理点击 shape
    if (domEventname === "mousedown") {
      this._handleMouseDown(event, shape, isCapture);
    }

    if (!shape) return;

    // 鼠标移动事件触发次数高，需要对此做性能优化
    // 如果没有 shape 没有监听 mousemove 事件，直接返回
    if (!isOpenMouseMoveEvent && domEventname === "mousemove") return;

    this._triggerEvent(shape, domEventname, event, isCapture);
  }

  private _bindEvents(): void {
    const canvas = this._canvas.canvas;
    // 监听冒泡事件
    Object.values(BubbleEventType).forEach((eventname) => {
      canvas.addEventListener(eventname, (event: MouseEvent) =>
        this._handleEvent(eventname, event)
      );
    });

    // 监听捕获事件
    Object.values(CaptureEventType).forEach((eventname) => {
      const name = eventname.replace(CAPTURE_NAME, "").toLocaleLowerCase();
      canvas.addEventListener(
        name as any,
        (event: MouseEvent) => this._handleEvent(name as any, event, true),
        true
      );
    });

    // 监听键盘事件
    document.addEventListener("keydown", (event: KeyboardEvent) =>
      this._handleKeyDown(event)
    );
    // 监听文本输入事件
    this._hiddenTextarea.addEventListener("input", (event: Event) =>
      this._handleTextInput(event)
    );
    // 监听鼠标事件用于文本选择
    canvas.addEventListener("mousemove", (event: MouseEvent) =>
      this._handleMouseMove(event)
    );
    // 监听鼠标按下事件
    canvas.addEventListener("mouseup", (event: MouseEvent) =>
      this._handleMouseUp(event)
    );
    // 监听鼠标离开画布，结束选择
    canvas.addEventListener("mouseleave", () => {
      if (this._selectingTextShape) {
        this._selectingTextShape.__stopSelecting();
      }
    });

    // 监听更新
    emitter.on(EventType.UpdateShape, (shape: Shape) => {
      // this.renderShape(shape);
      this.render();
    });
    // 监听shape focus/blur 事件
    emitter.on(EventType.FocusShape, ({ shape, event, isCapture }) => {
      this._handleShapeFocus(shape, event, isCapture);
    });
    emitter.on(EventType.BlurShape, ({ shape, event, isCapture }) => {
      this._handleShapeBlur(shape, event, isCapture);
    });
  }

  private _handleTextSelected(shape: Shape, canvasPos: { x: number; y: number }) {
    // 如果是文本对象，需要处理文本编辑状态
    if (shape instanceof Text && shape.userSelect) {
      const textShape = shape;
      // 如果当前已经有文本对象在编辑，先停止编辑
      if (this._currentEditingText) {
        this._currentEditingText.__stopEditing();
      }
      this._currentEditingText = textShape;
      
      // 延迟设置焦点和值，让事件循环有机会完成当前的点击事件
      // 如果不延迟，会导致文本框无法可能获得焦点(时机问题)
      setTimeout(() => {
        this._hiddenTextarea.focus();
        this._hiddenTextarea.value = textShape.text;
        // 计算光标位置
        const clickPos = this._getTextRelativePosition(textShape, canvasPos.x, canvasPos.y);
        const charIndex = textShape.getIndexFromPoint(clickPos.x, clickPos.y);

        // 设置真实文本框的选择范围
        this._hiddenTextarea.setSelectionRange(charIndex, charIndex);
        // 开始选择文本
        textShape.__startSelecting(charIndex);
        this._selectingTextShape = textShape;

        // :grin:
        // 在 __startSelecting 函数中，会通知 scene 去 render
      }, 0);

      textShape.__startEditing();
    }
  }

  /** 处理鼠标按下事件
   * @description 处理点击文本对象，或者点击空白区域
   */
  private _handleMouseDown(event: MouseEvent, shape: Shape | null, isCapture = false): void {
    if(isCapture){
      let isNeedRender = false;

      // 如果点击的是文本对象，需要处理文本编辑状态
      if(shape && shape === this._currentEditingText) {
        const { x, y } = event ? this.getCanvasPosition(event.clientX, event.clientY) : shape.absolutePosition;
        this._handleTextSelected(shape, { x, y });
      }

      if (!shape) {
        // 清理包围盒
        if (this._renderedShapeBox.size) {
          this._clearAllBoundingBox();
          isNeedRender = true;
        }

        isNeedRender && this.render();
      }
    }

    this._triggerShapeFocusOrBlur(shape, event, isCapture);
  }

  /** 是否触发焦点事件 */
  private _triggerShapeFocusOrBlur(shape: Shape | null, event: MouseEvent, isCapture?: boolean): void {
    // 处理焦点事件
    if (shape !== this._focusedShape) {
      // 触发失焦事件
      if (this._focusedShape) {
        this._focusedShape.blur(event, isCapture);
      }

      // 触发获得焦点事件
      if (shape) {
        shape.focus(event, isCapture);
      }

      if(!isCapture) {
        this._focusedShape = shape;
      }
    }
  }

  /** 处理 shape focus 事件 */
  private _handleShapeFocus(shape: Shape, event?: MouseEvent, isCapture?: boolean): void {
    if(!isCapture) {
      if(shape instanceof Text){
        const { x, y } = event ? this.getCanvasPosition(event.clientX, event.clientY) : shape.absolutePosition;
        this._handleTextSelected(shape, { x, y });
      }

      if(shape.isActive && !this._renderedShapeBox.has(shape)) {
        // 清除已经渲染边框
        this._clearAllBoundingBox();

        // 绘制边框
        this._renderedShapeBox.add(shape);
        this.render();
      }
    }

    this._triggerEvent(
      shape,
      "focus",
      { shape },
      isCapture
    );
  }

  private _handleShapeBlur(shape: Shape, event?: MouseEvent, isCapture?: boolean): void {
    if(shape instanceof Text && !isCapture) {
      // 点击其他区域，结束编辑状态
      this._currentEditingText?.__stopEditing();
      this._currentEditingText = null;
      this._hiddenTextarea.blur();
      this._hiddenTextarea.value = "";

      // 清理文本选择区域
      if(this._selectingTextShape) {
        this._selectingTextShape.clearSelection();
        this._selectingTextShape = null;
      }
    }

    this._triggerEvent(
      shape,
      "blur",
      { shape },
      isCapture
    );
  }

  private _handleMouseMove(event: MouseEvent): void {
    // 如果没有正在进行文本选择，直接返回
    if (!this._selectingTextShape) return;

    // 获取鼠标位置
    const { x, y } = this.getCanvasPosition(event.clientX, event.clientY);
    // 计算相对于文本的位置
    const clickPos = this._getTextRelativePosition(
      this._selectingTextShape,
      x,
      y
    );
    const charIndex = this._selectingTextShape.getIndexFromPoint(
      clickPos.x,
      clickPos.y
    );

    // 更新选区
    this._selectingTextShape.__updateSelection(charIndex);

    // 更新文本框的选区
    const start = Math.min(
      this._selectingTextShape.selectionStart,
      this._selectingTextShape.selectionEnd
    );
    const end = Math.max(
      this._selectingTextShape.selectionStart,
      this._selectingTextShape.selectionEnd
    );
    this._hiddenTextarea.setSelectionRange(start, end);

    this.renderShape(this._selectingTextShape);
  }

  private _handleMouseUp(_event: MouseEvent): void {
    // 如果正在进行文本选择
    if (this._selectingTextShape) {
      this._selectingTextShape.__stopSelecting();

      // 更新隐藏文本框的选区
      const start = Math.min(
        this._selectingTextShape.selectionStart,
        this._selectingTextShape.selectionEnd
      );
      const end = Math.max(
        this._selectingTextShape.selectionStart,
        this._selectingTextShape.selectionEnd
      );
      this._hiddenTextarea.setSelectionRange(start, end);

      this.render();
    }
  }

  /**
   * 获取鼠标相对于文本的位置（考虑旋转和缩放）
   */
  private _getTextRelativePosition(
    textShape: Text,
    x: number,
    y: number
  ): Vector2 {
    const { x: shapeX, y: shapeY } = textShape.absolutePosition;
    const rotation = textShape.absoluteRotation;

    // 将鼠标坐标转换到相对于文本中心的坐标
    const relX = x - shapeX;
    const relY = y - shapeY;

    // 如果有旋转，需要逆向旋转坐标
    if (rotation !== 0) {
      const rotated = new Vector2(relX, relY).rotate(-rotation);
      return rotated;
    }

    return new Vector2(relX, relY);
  }

  private _handleTextInput(event: Event): void {
    if (!this._currentEditingText) return;

    const inputEvent = event as InputEvent;
    const modifiedText = inputEvent.data;
    if (modifiedText !== null) {
      // 如果有选中文本，先删除选中部分
      if (
        this._currentEditingText.selectionStart !==
        this._currentEditingText.selectionEnd
      ) {
        const start = Math.min(
          this._currentEditingText.selectionStart,
          this._currentEditingText.selectionEnd
        );
        const end = Math.max(
          this._currentEditingText.selectionStart,
          this._currentEditingText.selectionEnd
        );
        this._currentEditingText.text =
          this._currentEditingText.text.slice(0, start) +
          this._currentEditingText.text.slice(end);
        this._currentEditingText.setCursorPosition(start);
        this._currentEditingText.clearSelection();
      }
      this._currentEditingText.insertText(modifiedText);
    } else {
      // modifiedText 为 null 时，表示用户删除了文本
      const currentText = this._currentEditingText.text;
      const newText = this._hiddenTextarea.value;

      if (newText.length < currentText.length) {
        // 如果有选中文本，删除选中部分
        if (
          this._currentEditingText.selectionStart !==
          this._currentEditingText.selectionEnd
        ) {
          const start = Math.min(
            this._currentEditingText.selectionStart,
            this._currentEditingText.selectionEnd
          );
          const end = Math.max(
            this._currentEditingText.selectionStart,
            this._currentEditingText.selectionEnd
          );
          this._currentEditingText.text =
            this._currentEditingText.text.slice(0, start) +
            this._currentEditingText.text.slice(end);
          this._currentEditingText.setCursorPosition(start);
          this._currentEditingText.clearSelection();
        } else {
          // 否则按正常逻辑删除
          const deleteCount = currentText.length - newText.length;
          this._currentEditingText.deleteText(-deleteCount);
        }
      }
    }

    // 更新光标位置
    this._currentEditingText.setCursorPosition(
      this._hiddenTextarea.selectionStart
    );

    // 重新渲染
    this.render();
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    if (!this._currentEditingText) return;

    switch (event.key) {
      case WindowsEventKeys.Delete:
        if (
          this._currentEditingText.selectionStart !==
          this._currentEditingText.selectionEnd
        ) {
          // 如果有选中文本，删除选中部分
          const start = Math.min(
            this._currentEditingText.selectionStart,
            this._currentEditingText.selectionEnd
          );
          const end = Math.max(
            this._currentEditingText.selectionStart,
            this._currentEditingText.selectionEnd
          );
          this._currentEditingText.text =
            this._currentEditingText.text.slice(0, start) +
            this._currentEditingText.text.slice(end);
          this._currentEditingText.setCursorPosition(start);
          this._currentEditingText.clearSelection();
        } else if (
          this._currentEditingText.cursorPosition <
          this._currentEditingText.text.length
        ) {
          this._currentEditingText.deleteText(1);
        }
        break;
      case WindowsEventKeys.ArrowLeft:
        if (event.shiftKey) {
          // Shift+左箭头：扩展选区
          if (
            this._currentEditingText.selectionStart ===
            this._currentEditingText.selectionEnd
          ) {
            this._currentEditingText.__startSelecting(
              this._currentEditingText.cursorPosition
            );
          }
          if (this._currentEditingText.cursorPosition > 0) {
            this._currentEditingText.__updateSelection(
              this._currentEditingText.cursorPosition - 1
            );
          }
        } else {
          // 左箭头：清除选区，移动光标
          if (
            this._currentEditingText.selectionStart !==
            this._currentEditingText.selectionEnd
          ) {
            const start = Math.min(
              this._currentEditingText.selectionStart,
              this._currentEditingText.selectionEnd
            );
            this._currentEditingText.setCursorPosition(start);
            this._currentEditingText.clearSelection();
          } else if (this._currentEditingText.cursorPosition > 0) {
            this._currentEditingText.setCursorPosition(
              this._currentEditingText.cursorPosition - 1
            );
          }
        }
        break;
      case WindowsEventKeys.ArrowRight:
        if (event.shiftKey) {
          // Shift+右箭头：扩展选区
          if (
            this._currentEditingText.selectionStart ===
            this._currentEditingText.selectionEnd
          ) {
            this._currentEditingText.__startSelecting(
              this._currentEditingText.cursorPosition
            );
          }
          if (
            this._currentEditingText.cursorPosition <
            this._currentEditingText.text.length
          ) {
            this._currentEditingText.__updateSelection(
              this._currentEditingText.cursorPosition + 1
            );
          }
        } else {
          // 右箭头：清除选区，移动光标
          if (
            this._currentEditingText.selectionStart !==
            this._currentEditingText.selectionEnd
          ) {
            const end = Math.max(
              this._currentEditingText.selectionStart,
              this._currentEditingText.selectionEnd
            );
            this._currentEditingText.setCursorPosition(end);
            this._currentEditingText.clearSelection();
          } else if (
            this._currentEditingText.cursorPosition <
            this._currentEditingText.text.length
          ) {
            this._currentEditingText.setCursorPosition(
              this._currentEditingText.cursorPosition + 1
            );
          }
        }
        break;
      // 添加处理按键A的全选逻辑
      case "a":
      case "A":
        if (event.ctrlKey) {
          // Ctrl+A: 全选文本
          this._currentEditingText.setSelectionRange(
            0,
            this._currentEditingText.text.length
          );
          this._hiddenTextarea.setSelectionRange(
            0,
            this._currentEditingText.text.length
          );
          event.preventDefault(); // 阻止默认行为
        }
        break;
      default:
        return;
    }

    this.render();
  }
}
