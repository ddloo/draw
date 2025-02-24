import { Shape } from "./Shape/Shape";
import Canvas from "./Canvas";
import {
  BubbleEventType,
  CaptureEventType,
  EventsType,
  isOpenMouseMoveEvent,
  WindowsEventKeys,
} from "@Events/index";
import { ShapeRoot } from "./Shape/ShapeRoot";
import { boxSize, CanvasCursorType, CAPTURE_NAME } from "./Shape/types";
import { rotatePoint } from "@/Utils/Math";
import { Color } from "./Color";
import Rectangle from "@/Shape/Rectangle";
import { Vector2 } from "./Vector2";
import Text from "@/Shape/Text";
import { createTextarea } from "@/Utils/Dom";
import { debounce } from "@/Utils";

export class Scene {
  private _canvas: Canvas;
  private _shapeRoot: ShapeRoot;
  private _lastCursor: CanvasCursorType;
  private _lastHoveredShape: Shape | null = null;
  private _renderedShapeBox: Set<Shape> = new Set();
  /** 渲染的包围盒 id map */
  private _boundingBox = new Map<string, string[]>();
  /** 当前正在编辑的文本 */
  private _currentEditingText: Text | null = null;
  /** 当前正在编辑的dom文本框 */
  private _hiddenTextarea: HTMLTextAreaElement = createTextarea("");

  constructor(canvas?: Canvas) {
    (canvas && (this._canvas = canvas)) || (this._canvas = new Canvas());
    this._lastCursor = this._canvas.cursor;
    this._shapeRoot = new ShapeRoot();
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

    return id;
  }

  removeShape(id: string): void {
    this._shapeRoot.removeShape(id);
    this.render();
  }

  render(): void {
    this._canvas.clear();

    // 渲染包围盒
    this._renderedShapeBox.forEach((shape) => {
      if(shape.__isUpdate) {
        // 清除之前渲染的包围盒
        this._clearBoundingBox(shape);
        // 更新包围盒的数据，不进行渲染，因为下面的逻辑 this._canvas.draw(node) 已经包含渲染了
        this._handleBoundingBox(shape, false);
      }
    });

    // 渲染 shape
    this._shapeRoot.traverseTree((node) => {
      if (node && node instanceof Shape) {
        this._canvas.draw(node);
      }
    });

    // 文案输入
    if(this._currentEditingText && this._currentEditingText.isEditing) {
      requestAnimationFrame(() => {
        this.render();
      })
    }
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

  private _addShapeBoundingFourCorners(shape: Shape) {
    const box = shape.getBoundingBox();
    const cornerRects: Rectangle[] = [];
    if (!box) return;

    const { left, right, top, bottom } = box;
    // 定义角落的位置
    const corners = [
      { x: left, y: top, cursor: CanvasCursorType.NwseResize },
      { x: right, y: top, cursor: CanvasCursorType.NeswResize },
      { x: right, y: bottom, cursor: CanvasCursorType.NwseResize },
      { x: left, y: bottom, cursor: CanvasCursorType.NeswResize },
    ];
    const center = {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
    };

    const scale = shape.absoluteScale;
    const rotation = shape.absoluteRotation;

    const drawRect = (x: number, y: number, cursor: CanvasCursorType = CanvasCursorType.Default) => {
      const rotated = rotatePoint(x, y, center.x, center.y, rotation);
      const rect = new Rectangle({
        x: rotated.x,
        y: rotated.y,
        width: boxSize,
        height: boxSize,
        cursor,
        strokeColor: new Color("#ff0000").alpha(shape.relativeStrokeColor.a),
        scale: new Vector2(
          Math.min(1.5, Math.max(0.5, scale.x)),
          Math.min(1.5, Math.max(0.5, scale.y))
        ),
        rotation,
      });

      this._shapeRoot.addShape(rect);
      this._boundingBox.set(shape.id, this._boundingBox.get(shape.id)?.concat(rect.id) || [rect.id]);
      cornerRects.push(rect);
    }

    // 绘制四个角落
    corners.forEach((corner) => drawRect(corner.x, corner.y, corner.cursor));

    return cornerRects;
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
   * @param isRender 是否进行渲染，默认为 true
   */
  private _handleBoundingBox(shape: Shape, isRender = true): void {
    this._addShapeBoundingFourCorners(shape);
    isRender && this.render();
    // 可能要根据不同形状，绘制不同的边框
  }

  /** 清理单个包围盒 */
  private _clearBoundingBox(shape: Shape): void {
    this._renderedShapeBox.delete(shape);
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
    event: MouseEvent,
    isCapture?: boolean
  ): void;
  private _triggerEvent(
    shape: Shape,
    eventName: keyof DocumentEventMap,
    event: MouseEvent,
    isCapture?: boolean
  ): void;
  private _triggerEvent(
    shape: Shape | ReturnType<ShapeRoot["getToggleEvents"]>,
    eventName: keyof DocumentEventMap,
    event: MouseEvent,
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

  private _handleEvent(
    domEventname: keyof DocumentEventMap,
    event: MouseEvent,
    isCapture = false
  ): void {
    // 鼠标位置映射到 canvas 坐标
    const { x, y } = this.getCanvasPosition(event.clientX, event.clientY);
    const shape = this._shapeRoot.findShapeFromPoint(x, y);

    if (domEventname === "mousemove" && isCapture) {
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

    if (domEventname === "click" && isCapture) {
      this._handleClick(event, shape);
    }

    if (!shape) return;

    // 鼠标移动事件触发次数高，需要对此做性能优化
    // 如果没有 shape 没有监听 mousemove 事件，直接返回
    if (!isOpenMouseMoveEvent && domEventname === "mousemove") return;

    // 如果 shape 被激活了，需要绘制边框
    if (
      shape.isActive &&
      !this._renderedShapeBox.has(shape) &&
      domEventname === "click" &&
      isCapture
    ) {
      // 清除已经渲染边框
      this._clearAllBoundingBox();
      
      // 绘制边框
      this._renderedShapeBox.add(shape);
      this._renderedShapeBox.forEach((shape) =>
        this._handleBoundingBox(shape)
      );
    }

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
    document.addEventListener("keydown", (event: KeyboardEvent) => this._handleKeyDown(event));
    this._hiddenTextarea.addEventListener("input", (event: Event) => this._handleTextInput(event));
  }

  private _handleClick = debounce((event: MouseEvent, shape?: Shape | null) => {
    if (shape instanceof Text) {
      if (this._currentEditingText !== shape) {

        // 切换到新的 Text
        if (this._currentEditingText) {
          this._currentEditingText.__stopEditing();
        }
        
        this._currentEditingText = shape;
        this._hiddenTextarea.value = shape.text;
        this._hiddenTextarea.focus();
        shape.__startEditing();
      }
      
      // 更新光标位置
      const actualPos = this.getCanvasPosition(event.clientX, event.clientY);
      this._hiddenTextarea.focus();
      this._updateTextCursorPosition(shape, actualPos);
    } else {
      // 点击非 Text 形状，结束编辑
      if (this._currentEditingText) {
        this._currentEditingText.__stopEditing();
        this._currentEditingText = null;
        this._hiddenTextarea.blur();
        this._hiddenTextarea.value = "";
      }
    }

    this.render();
  }, 16); // 100ms 防抖

  private _updateTextCursorPosition(textShape: Text, position: Vector2 | { x: number, y: number }): void {
    const clickX = position.x - textShape.absolutePosition.x;
    const clickY = position.y - textShape.absolutePosition.y;
    const newCursorPosition = textShape.getIndexFromPoint(clickX, clickY);
    textShape.setCursorPosition(newCursorPosition);
    this._hiddenTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  private _handleTextInput(event: Event): void {
    if (!this._currentEditingText) return;
    
    const inputEvent = event as InputEvent;
    const modifiedText = inputEvent.data;
    if(modifiedText !== null) {
      this._currentEditingText.insertText(modifiedText);
    } else {
      // modifiedText 为 null 时，表示用户删除了文本
      const currentText = this._currentEditingText.text;
      const newText  = this._hiddenTextarea.value;

      if(newText.length < currentText.length) {
        // 删除文本
        const deleteCount = currentText.length - newText.length;
        this._currentEditingText.deleteText(-deleteCount);
      }
    }

    // 更新光标位置
    this._currentEditingText.setCursorPosition(this._hiddenTextarea.selectionStart);

    // 重新渲染
    this.render();
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    if (!this._currentEditingText) return;

    switch (event.key) {
      case WindowsEventKeys.Delete:
        if (this._currentEditingText.cursorPosition < this._currentEditingText.text.length) {
          this._currentEditingText.deleteText(1);
        }
        break;
      case WindowsEventKeys.ArrowLeft:
        if (this._currentEditingText.cursorPosition > 0) {
          this._currentEditingText.setCursorPosition(this._currentEditingText.cursorPosition - 1);
        }
        break;
      case WindowsEventKeys.ArrowRight:
        if (this._currentEditingText.cursorPosition < this._currentEditingText.text.length) {
          this._currentEditingText.setCursorPosition(this._currentEditingText.cursorPosition + 1);
        }
        break;
      default:
        return;
    }

    this.render();
  }
}
