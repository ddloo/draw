import { resetState } from "@/core/Shape/Decorators";
import { Shape } from "@/core/Shape/Shape";
import { IBoundingBox, ShapeConstructorOptions } from "@/core/Shape/types";
import { Vector2 } from "@/core/Vector2";
import { getBezierCenterPoint, rotateByDegrees } from "@/Utils/Math";

enum PathCommandType {
  /** 移动 */
  MoveTo,
  /** 直线 */
  LineTo,
  /** 贝塞尔曲线 */
  BezierCurveTo,
  /** 闭合 */
  ClosePath,
}

interface MoveToCommand { type: PathCommandType.MoveTo; point: Vector2 };
interface LineToCommand { type: PathCommandType.LineTo; point: Vector2 };
interface BezierCurveToCommand { type: PathCommandType.BezierCurveTo; control1: Vector2, control2: Vector2, end: Vector2 };
interface ClosePathCommand { type: PathCommandType.ClosePath };

type PathCommand = MoveToCommand | LineToCommand | BezierCurveToCommand | ClosePathCommand;

/**
 * 路径计算转换为矩阵运算，而不用向量运算，
 * 对于复杂路径的计算会简单很多，但也带来了内存开销（2d矩阵要存储6个值）
 */

class Path extends Shape<Path> {
  /** 原始指令 */
  private _commands: PathCommand[] = [];
  /** 路径简化度 */
  private _simplifyTolerance = 1;
  /** 中心点 */
  private _centerPoint: Vector2 | null = null;
  /** 贝塞尔曲线分段 */
  private _bezierSubdivisions = 3;
  /** 计算后的指令 */
  private _calculateCommands: PathCommand[] = [];

  constructor(options: ShapeConstructorOptions = {}) {
    super(options);
  }

  /** 移动到画布下某个坐标点 */
  @resetState({ _centerPoint: null, isUpdate: true })
  moveTo(x: number, y: number, strokeWidth?: number) {
    this._commands.push({
      type: PathCommandType.MoveTo,
      point: new Vector2(x, y),
    });

    if(strokeWidth) {
      this._setStrokeWidth(strokeWidth);
    }

    return this;
  }

  /** 画直线到画布下某个坐标点 */
  @resetState({ _centerPoint: null, isUpdate: true })
  lineTo(x: number, y: number, strokeWidth?: number) {
    this._commands.push({
      type: PathCommandType.LineTo,
      point: new Vector2(x, y),
    });

    if(strokeWidth) {
      this._setStrokeWidth(strokeWidth);
    }

    return this;
  }

  /** 画贝塞尔曲线到画布下某个坐标点 */
  @resetState({ _centerPoint: null, isUpdate: true })
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.isUpdate = true;
    this._commands.push({
      type: PathCommandType.BezierCurveTo,
      control1: new Vector2(x1, y1),
      control2: new Vector2(x2, y2),
      end: new Vector2(x, y),
    });

    return this;
  }

  /** 关闭路径 */
  @resetState({ isUpdate: true })
  closePath() {
    this._commands.push({
      type: PathCommandType.ClosePath,
    });

    return this;
  }

  private _setStrokeWidth(width: number) {
    this.lineWidth = width;
    this.isUpdate = true;
  }

  /** 简化路径，返回简化后的指令 */
  private _simplifyPath(commands: PathCommand[]): PathCommand[] {
    const simplifiedCommands: PathCommand[] = [];
    let prevPoint: Vector2 | null = null;

    for(const command of commands) {
      if(command.type === PathCommandType.MoveTo || command.type === PathCommandType.LineTo) {
        // 如果前一个和当前点的距离大于阈值，则添加进绘制路径
        if(!prevPoint || command.point.distanceTo(prevPoint) > this._simplifyTolerance){
          simplifiedCommands.push(command);
          prevPoint = command.point;
        }
      } else {
        simplifiedCommands.push(command);
      }
    }

    return simplifiedCommands;
  }

  /** 没有经过 translate 的中心点 */
  private get _originCenterPoint(): Vector2 {
    // 如果没有更新路径，直接返回
    if (this._centerPoint) {
      return this._centerPoint;
    }

    let points: Vector2[] = [];
    const commands = this._commands;

    if(commands.length === 0) {
      return this.position;
    }

    for (const command of commands) {
      switch (command.type) {
        case PathCommandType.LineTo:
        case PathCommandType.MoveTo:
          points.push(command.point);
          break;
        case PathCommandType.BezierCurveTo:
          // 使用 getBezierCenterPoint 获取贝塞尔曲线的中心点
          const centerPoint = getBezierCenterPoint(
            command.control1.x, command.control1.y,
            command.control2.x, command.control2.y,
            command.end.x, command.end.y
          );
          points.push(new Vector2(centerPoint.x, centerPoint.y));
          break;
      }
    }

    // 如果没有点，返回原点
    if (points.length === 0) {
      return this.position;
    }

    // 计算所有点的平均值作为中心点
    const sum = points.reduce((acc, point) => acc.add(point), new Vector2(0, 0));
    this._centerPoint = sum.scale(1 / points.length);

    // 返回中心点
    return this._centerPoint;
  }

  /** 中心点 */
  get centerPoint(): Vector2 {
      return this._originCenterPoint.add(this.position);
  }

  /** 缩放点 */
  private _scalePoint(point: Vector2, center: Vector2, sx: number, sy: number): Vector2 {
    const dp = point.subtract(center);
    return new Vector2(center.x + dp.x * sx, center.y + dp.y * sy);
  }

  /** 旋转点 */
  private _rotatePoint(point: Vector2, center: Vector2, cosAngle: number, sinAngle: number): Vector2 
  private _rotatePoint(point: Vector2, center: Vector2, angle: number): Vector2 
  private _rotatePoint(point: Vector2, center: Vector2, cosAngle: number, sinAngle?: number): Vector2 {
    let cos: number, sin: number;

    if(typeof sinAngle === 'number') {
      cos = cosAngle;
      sin = sinAngle;
    } else {
      cos = Math.cos(cosAngle);
      sin = Math.sin(cosAngle);
    }

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return new Vector2(
      center.x + dx * cos - dy * sin,
      center.y + dx * sin + dy * cos
    )
  }

  /** 将原始点转换为绘制点 */
  private _transformPoint(point: Vector2, scale?: Vector2) {
    let centerPoint = this._originCenterPoint;
    // 缩放
    let transformedPoint = this._scalePoint(point, centerPoint, scale?.x || this.absoluteScale.x, scale?.y || this.absoluteScale.y);
    // 旋转
    transformedPoint = this._rotatePoint(transformedPoint, centerPoint, this.absoluteRotation);
    // 平移
    return transformedPoint.add(new Vector2(this.absolutePosition?.x || 0, this.absolutePosition?.y || 0));
  }

  private _transformCommand(command: PathCommand): PathCommand {
    switch (command.type) {
      case PathCommandType.MoveTo:
      case PathCommandType.LineTo:
        return {
          ...command,
          point: this._transformPoint(command.point)
        }
      case PathCommandType.BezierCurveTo:
        return {
          ...command,
          control1: this._transformPoint(command.control1),
          control2: this._transformPoint(command.control2),
          end: this._transformPoint(command.end),
        }
      default:
        return command;
    }
  }

  private _updateCalculateCommands() {
    if(!this.isUpdate) return;

    this._calculateCommands = this._commands.map(command => this._transformCommand(command));
    this._calculateCommands = this._simplifyPath(this._calculateCommands);

    this.isUpdate = false;
  }

  draw(context: CanvasRenderingContext2D): void {
    this._updateCalculateCommands();

    context.save();
    context.beginPath();

    const normalizedCommands = this._calculateCommands;

    // 处理绘制指令
    for(const command of normalizedCommands) {
      switch (command.type) {
        case PathCommandType.MoveTo:
          context.moveTo(command.point.x, command.point.y);
          break;
        case PathCommandType.LineTo:
          context.lineTo(command.point.x, command.point.y);
          break;
        case PathCommandType.BezierCurveTo:
          context.bezierCurveTo(
            command.control1.x, command.control1.y,
            command.control2.x, command.control2.y,
            command.end.x, command.end.y
          );
          break;
        case PathCommandType.ClosePath:
          context.closePath();
          break;
      }
    }

    if (this.relativeFillColor.a > 0) {
      context.fillStyle = this.relativeFillColor.toHex();
      context.fill();
    }

    if (this.lineWidth > 0) {
      context.strokeStyle = this.relativeStrokeColor.toHex();
      context.lineWidth = this.lineWidth * Math.min(this.absoluteScale.x, this.absoluteScale.y);
      context.stroke();
    }

    context.restore();
  }

  @resetState({ _centerPoint: null })
  protected onTranslate(dx: number, dy: number): void {
    this.position = new Vector2(dx, dy);
    
  }

  protected onScale(percentage: number): void;
  protected onScale(scaleX: number, scaleY: number): void;
  @resetState({ _centerPoint: null })
  protected onScale(scaleX: number, scaleY?: number): void {
    let sx: number, sy: number;

    if(scaleY == undefined) {
      // 如果只有一个参数，那么等比缩放
      sx = sy = scaleX;
    } else {
      // 如果有两个参数，那么分别缩放
      sx = scaleX;
      sy = scaleY;
    }

    this.scaleSize = new Vector2(sx, sy);
  }
  
  @resetState({ _centerPoint: null })
  protected onRotate(radio: number): void {
    const angle = rotateByDegrees(radio);
    this.rotation = angle;
  }

  protected calculateBoundingBox(): IBoundingBox | null {
    if(this._calculateCommands.length === 0) {
      this._boundingBox = null;
      return null;
    }

    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = -Number.MAX_SAFE_INTEGER;
    let maxY = -Number.MAX_SAFE_INTEGER;

    for(const command of this._calculateCommands) {
      switch (command.type) {
        case PathCommandType.MoveTo:
        case PathCommandType.LineTo: {
          minX = Math.min(minX, command.point.x);
          minY = Math.min(minY, command.point.y);
          maxX = Math.max(maxX, command.point.x);
          maxY = Math.max(maxY, command.point.y);
          break;
        }
        case PathCommandType.BezierCurveTo: {
          const control1 = command.control1;
          const control2 = command.control2;
          const end = command.end;
          minX = Math.min(minX, control1.x, control2.x, end.x);
          minY = Math.min(minY, control1.y, control2.y, end.y);
          maxX = Math.max(maxX, control1.x, control2.x, end.x);
          maxY = Math.max(maxY, control1.y, control2.y, end.y);
          break;
        }
        // closePath 不影响边界框
      }
    }

    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY
    };
  }

  /**
   * 判断点是否在线内
   * @param x 点的 x 坐标
   * @param y 点的 y 坐标
   * @param tolerance 误差，默认为 1
   * @returns {boolean}
   */
  override isPointInShape(x: number, y: number, tolerance: number = 1): boolean {
    const point = new Vector2(x, y);
    let lastPoint: Vector2 | null = null;

    for (const command of this._calculateCommands) {
      switch (command.type) {
        case PathCommandType.LineTo:
        case PathCommandType.MoveTo:
          if (lastPoint) {
            if (this._isPointOnLine(point, lastPoint, command.point, tolerance)) {
              return true;
            }
          }
          lastPoint = command.point;
          break;
        case PathCommandType.BezierCurveTo:
          if (lastPoint) {
            // 对贝塞尔曲线进行近似检查
            for (let i = 1; i <= this._bezierSubdivisions; i++) {
              const t = i / this._bezierSubdivisions;
              const currentPoint = Vector2.subdivideBezier(lastPoint, command.control1, command.control2, command.end, t);
              if (this._isPointOnLine(point, lastPoint, currentPoint, tolerance)) {
                return true;
              }
              lastPoint = currentPoint;
            }
          }
          lastPoint = command.end;
          break;
      }
    }

    return false;
  }

  /** 判断一个点是否在一条线上
   * @param tolerance 宽度误差
   */
  private _isPointOnLine(point: Vector2, lineStart: Vector2, lineEnd: Vector2, tolerance = 1): boolean {
    const lineVec = lineEnd.subtract(lineStart);
    const pointVec = point.subtract(lineStart);
    const lineLengthSq = lineVec.lengthSquared();
    // 初中问题：如果线段的端点为 A,B; A 为起点,B 为终点,C 为第三个点
    // 需要证明：这三点必须共线（也就是同一条属于直线）
    // 共线的特性就是:无法形成一个平行四边形，由于平行四边形是由两个边形成，可以理解为AB, AP这两个线段就是平行四边形的边
    // 如果AB * AP = 0，说明AB/AP组成的平行四边形面积为 0，表示AB和AP都是平行的，也就是共线，也就是向量叉积为0
    // 利用向量叉积，计算点到直线的投影
    const projection = pointVec.dot(lineVec) / lineLengthSq;

    if (projection < 0 || projection > 1) {
      return false;
    }

    // 还需要证明点属于直线的范围内
    const projectedPoint = lineStart.add(lineVec.scale(Math.max(0, Math.min(1, projection))));
    const distance = point.distanceTo(projectedPoint);

    // 需要考虑线宽
    // 判断点是否在误差范围内
    const realLineWidth = this.lineWidth * Math.min(this.absoluteScale.x, this.absoluteScale.y);
    return distance <= Math.abs(realLineWidth / 2 + tolerance);
  }
}

export default Path;