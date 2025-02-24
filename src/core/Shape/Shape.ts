import { getLastSetValue } from "@Utils";
import { generateUniqueId } from "@Utils/Str";
import { Color, ColorType } from "../Color";
import { Events, CaptureEventType } from "@Events";
// TODO: 用矩阵运算代替 Vector2 运算
// import { Matrix } from "../Matrix";
import { Vector2 } from "../Vector2";
import { CanvasCursorType, IBoundingBox, ShapeColor, ShapeConstructorOptions } from "./types";
import { BoundingBox } from "./BoundingBox";

export abstract class Shape<T extends Shape<T> = any> extends Events<T> {
  // 自己本身的属性[开始]
  private _fillColor: Color;
  private _strokeColor: Color;
  private _lineWidth: number = 1;
  private _strokeOpacity: number = 1;
  private _fillOpacity: number = 1;
  private _position: Vector2 = Vector2.zero();
  private readonly _id = generateUniqueId();
  private _parent: Shape | null = null;
  private _children: Set<Shape> = new Set();
  private _zIndex = 0;
  private _childrenMap: Map<string, Shape> = new Map();
  private _emptyColor = new Color("transparent");
  private _scaleSize = Vector2.one();
  private _rotation = 0;
  private _active = false;
  private _cursor: CanvasCursorType | undefined = undefined;
  // 自己本身的属性[结束]

  // 包围盒
  protected _boundingBox: BoundingBox | null = null;
  private _isUpdateBoxSize = false;

  /** 是否需要更新 */
  private _isUpdate = false;

  // 从父节点继承来的属性
  private _absoluteStrokeOpacity: number = 1;
  private _absoluteFillOpacity: number = 1;
  private _absoluteRotation: number = 0;
  private _absoluteScaleSize: Vector2 = Vector2.one();
  private _absolutePosition: Vector2 = Vector2.zero();

  constructor(options: ShapeConstructorOptions = {}) {
    super();
    let { strokeColor, fillColor, lineWidth } = options;
    this._fillColor = fillColor ? this._getColor(fillColor) : this._emptyColor;
    this._strokeColor = strokeColor
      ? this._getColor(strokeColor)
      : this._emptyColor;
    this._lineWidth = lineWidth || 1;
    this._position = this._absolutePosition = new Vector2(
      options.x || 0,
      options.y || 0
    );
    this._zIndex = options.zIndex || 0;
    this._parent = options.parent || null;
    this._scaleSize = this._absoluteScaleSize = options.scale
      ? typeof options.scale === "number"
        ? Vector2.one().scale(options.scale)
        : options.scale
      : Vector2.one();
    this._rotation = this._absoluteRotation = options.rotation || 0;
    this._strokeOpacity = this._absoluteStrokeOpacity =
      options.strokeOpacity || 1;
    this._fillOpacity = this._absoluteFillOpacity = options.fillOpacity || 1;
    this._active = Boolean(options.active);
    this._cursor = options.cursor;
  }

  private _getColor(color: ShapeColor) {
    if (color instanceof Color) {
      return color;
    }

    return new Color((color as ColorType | `#${string}`) || "transparent");
  }

  /** 更新属性 */
  private _updateAbsoluteProps() {
    const isUpdateOpacity = this._updateAbsoluteOpacity();
    const isUpdatePosition = this._updateAbsolutePosition();
    const isUpdateRotation = this._updateAbsoluteRotation();
    const isUpdateScale = this._updateAbsoluteScale();

    if (
      isUpdateOpacity ||
      isUpdatePosition ||
      isUpdateRotation ||
      isUpdateScale
    ) {
      this._isUpdateBoxSize = true;
      this._isUpdate = true;
      this._propagateUpdate();
    }
  }

  private _updateAbsolutePosition() {
    const oldAbsolutePosition = this._absolutePosition;
    this._absolutePosition = this._parent
      ? this._parent._absolutePosition.add(this._position)
      : this._position;

    return oldAbsolutePosition !== this._absolutePosition;
  }

  private _updateAbsoluteOpacity() {
    const oldAbsoluteStrokeOpacity = this._absoluteStrokeOpacity;
    const oldAbsoluteFillOpacity = this._absoluteFillOpacity;

    this._absoluteStrokeOpacity =
      this._strokeOpacity * (this._parent?._absoluteStrokeOpacity ?? 1);
    this._absoluteFillOpacity =
      this._fillOpacity * (this._parent?._absoluteFillOpacity ?? 1);

    // 如果透明度和之前的透明度一致，不需要更新子树的透明度
    if (
      oldAbsoluteStrokeOpacity !== this._absoluteStrokeOpacity ||
      oldAbsoluteFillOpacity !== this._absoluteFillOpacity
    ) {
      return true;
    }

    return false;
  }

  private _updateAbsoluteRotation() {
    const oldAbsoluteRotation = this._absoluteRotation;
    this._absoluteRotation =
      this._rotation + (this._parent?._absoluteRotation ?? 0);

    return oldAbsoluteRotation !== this._absoluteRotation;
  }

  private _updateAbsoluteScale() {
    const oldAbsoluteScaleSize = this._absoluteScaleSize;
    this._absoluteScaleSize = this._parent
      ? this._parent._absoluteScaleSize.scale(this._scaleSize)
      : this._scaleSize;

    return oldAbsoluteScaleSize !== this._absoluteScaleSize;
  }

  /** 更新子树属性 */
  private _propagateUpdate() {
    for (const child of this._children) {
      child._updateAbsoluteProps();
    }
  }

  /** 绘制 */
  abstract draw(context: CanvasRenderingContext2D): void;
  /** 缩放 */
  protected abstract onScale(percentage: number): void;
  protected abstract onScale(x: number, y?: number): void;
  /** 移动 */
  protected abstract onTranslate(dx: number, dy: number): void;
  /** 旋转 */
  protected abstract onRotate(angle: number): void;
  /** 计算包围盒 */
  protected abstract calculateBoundingBox(
    ctx?: CanvasRenderingContext2D
  ): IBoundingBox | null;

  /** 获取包围盒 */
  getBoundingBox(ctx?: CanvasRenderingContext2D) {
    if (!this._boundingBox || this._isUpdateBoxSize) {
      const box = this.calculateBoundingBox(ctx);

      if (box) {
        this._boundingBox = new BoundingBox(box);
      }

      this._isUpdateBoxSize = false;
    }

    return this._boundingBox!;
  }

  /** 点是否在图形内 */
  isPointInShape(x: number, y: number, ..._restArgs: any): boolean {
    // 下面的代码为通用判断，如果有特殊处理，请在子类中重写
    const box = this.getBoundingBox();

    if (this.absoluteRotation !== 0) {
      const center = new Vector2(
        (box.left + box.right) / 2,
        (box.top + box.bottom) / 2
      );
      const rotatedPoint = new Vector2(x - center.x, y - center.y).rotate(
        -this.absoluteRotation
      );
      
      x = rotatedPoint.x + center.x;
      y = rotatedPoint.y + center.y;
    }

    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }

  /** 旋转角度 */
  rotate(angle: number) {
    this.onRotate(angle);
    this._updateAbsoluteProps();
  }

  /** 移动 */
  translate(dx: number, dy: number) {
    this.onTranslate(dx, dy);
    this._updateAbsoluteProps();
  }

  /** 缩放 */
  scale(x: number, y?: number) {
    this.onScale(x, y);
    this._updateAbsoluteProps();
  }

  /** 设置透明度 */
  readonly opacity = (opacity: number) => {
    const clampedOpacity = Math.min(1, Math.max(0, opacity));
    this._fillOpacity = clampedOpacity;
    this._strokeOpacity = clampedOpacity;
    this._updateAbsoluteProps();
  };

  /** 最终要渲染的边框颜色 */
  get relativeStrokeColor(): Color {
    return new Color(
      this._strokeColor.r,
      this._strokeColor.g,
      this._strokeColor.b,
      this._strokeColor.a * this._absoluteStrokeOpacity
    );
  }

  /** 最终要渲染的填充颜色 */
  get relativeFillColor(): Color {
    return new Color(
      this._fillColor.r,
      this._fillColor.g,
      this._fillColor.b,
      this._fillColor.a * this._absoluteFillOpacity
    );
  }

  protected getLatestZIndex(set?: Set<Shape>): number {
    return getLastSetValue(set)?.zIndex || 0;
  }

  protected setUpdateFlagRecursively(): void {
    this.isUpdate = true;
    for (const child of this.children) {
      child.setUpdateFlagRecursively();
    }
  }

  /** 添加子节点，子节点的定位/样式将会跟随父节点 */
  appendChild(node: Shape) {
    node.parent = this;
    return node.id;
  }

  /** 删除子节点 */
  removeChild(id: string) {
    this.traverseTree((node) => {
      if (node.id === id) {
        node.parent = null;
        node._children.delete(node);
        node._childrenMap.delete(id);
        return false;
      }
    }, true);
  }

  /** 获取子节点 */
  getChild(id: string) {
    let findChild: Shape | undefined = undefined;
    this.traverseTree((node) => {
      if (node.id === id) {
        findChild = node;
        return false;
      }
    }, true);

    return findChild;
  }

  /** 遍历所有节点
   * @param isIgnored 是否忽略当前节点，默认为 false
   */
  traverseTree(callback: (node: Shape) => any, isIgnored = false): boolean {
    let isDeep = true;
    // 首先调用回调函数处理当前节点
    !isIgnored && (isDeep = callback(this));

    if (isDeep === false) {
      return false;
    }

    // 然后递归遍历所有子节点
    for (const child of this._children) {
      const childDeep = child.traverseTree(callback);

      // 如果子节点的遍历被中断，则中断整个遍历
      if (childDeep === false) {
        return false;
      }
    }

    return true;
  }

  /** 描边颜色 */
  get strokeColor(): Color {
    return this._strokeColor;
  }

  /** 描边颜色 */
  set strokeColor(color: ShapeColor) {
    this._strokeColor = this._getColor(color);
  }

  /** 填充颜色 */
  get fillColor(): Color {
    return this._fillColor;
  }

  /** 填充颜色 */
  set fillColor(color: ShapeColor) {
    this._fillColor = this._getColor(color);
  }

  /** 线宽 */
  get lineWidth(): number {
    return this._lineWidth;
  }

  /** 线宽 */
  set lineWidth(width: number) {
    this._lineWidth = width;
  }

  /** 描边透明度 */
  get strokeOpacity(): number {
    return this._strokeOpacity;
  }

  /** 描边透明度 */
  set strokeOpacity(alpha: number) {
    if (this._strokeOpacity !== alpha) {
      // 确保 alpha 值在 0 到 1 之间
      this._strokeOpacity = Math.max(0, Math.min(1, alpha));
      this._updateAbsoluteProps();
    }
  }

  /** 填充透明度 */
  get fillOpacity(): number {
    return this._fillOpacity;
  }

  /** 填充透明度 */
  set fillOpacity(alpha: number) {
    if (this._fillOpacity !== alpha) {
      // 确保 alpha 值在 0 到 1 之间
      this._fillOpacity = Math.max(0, Math.min(1, alpha));
      this._updateAbsoluteProps();
    }
  }

  /** node id */
  get id() {
    return this._id;
  }

  /** 父节点 */
  get parent() {
    return this._parent;
  }

  /** 设置父节点 */
  set parent(parent: Shape | null) {
    if (this._parent !== parent) {
      this._parent?.removeChild(this.id);
      parent?._children.add(this);
      parent?._childrenMap.set(this.id, this);
      this._parent = parent;
      const zIndex = this.getLatestZIndex(parent?.children) + 1;
      this.zIndex = zIndex;
      this._updateAbsoluteProps();
    }
  }

  /** 子节点 */
  get children() {
    return this._children;
  }

  /** z-index */
  get zIndex() {
    return this._zIndex;
  }

  /** 设置 z-index */
  set zIndex(zIndex: number) {
    this._zIndex = zIndex;
    if (this._parent) {
      // 排序(由于 set 是集合，没有 sort，这里暂时转为数组再排序)
      this._parent._children = new Set(
        [...this._parent.children].sort((a, b) => a.zIndex - b.zIndex)
      );
    }
  }

  /** 相对于父节点的位置 */
  get position(): Vector2 {
    return this._position;
  }

  /** 设置相对于父节点的位置 */
  set position(pos: Vector2) {
    this._position = pos;
    this._updateAbsoluteProps();
  }

  /** 缩放比例 */
  get scaleSize() {
    return this._scaleSize;
  }

  /** 设置缩放比例 */
  set scaleSize(size: Vector2 | number | [number, number]) {
    if (typeof size === "number") size = Vector2.one().scale(size);
    if (Array.isArray(size)) size = new Vector2(size[0], size[1]);
    this._scaleSize = size;
    this._updateAbsoluteProps();
  }

  /** 旋转角度 */
  get rotation() {
    return this._rotation;
  }

  /** 设置旋转角度 */
  set rotation(rotation: number) {
    this._rotation = rotation;
    this._updateAbsoluteProps();
  }

  /** 绝对位置 */
  get absolutePosition() {
    return this._absolutePosition;
  }

  /** 绝对缩放比例 */
  get absoluteScale() {
    return this._absoluteScaleSize;
  }

  /** 绝对旋转角度 */
  get absoluteRotation() {
    return this._absoluteRotation;
  }

  protected get isUpdate() {
    return this._isUpdate;
  }

  protected set isUpdate(isUpdate: boolean) {
    this._isUpdate = isUpdate;
  }

  /** 是否更新 */
  public get __isUpdate() {
    return this._isUpdate;
  }

  get isActive() {
    return this._active;
  }

  set isActive(active: boolean) {
    this._active = active;
  }

  get cursor() {
    return this._cursor;
  }

  set cursor(cursor: CanvasCursorType | undefined) {
    this._cursor = cursor;
  }

  /** 是否更新 box size */
  protected get isUpdateBoxSize() {
    return this._isUpdateBoxSize;
  }

  protected set isUpdateBoxSize(isUpdateBoxSize: boolean) {
    this._isUpdateBoxSize = isUpdateBoxSize;
  }
}
