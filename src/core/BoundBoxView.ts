import { Shape } from "./Shape/Shape";
import Text from "@/Shape/Text";
import Rectangle from "@/Shape/Rectangle";
import { Vector2 } from "@/core/Vector2";
import { Color } from "@/core/Color";
import { rotatePoint } from "@/Utils/Math";
import { CanvasCursorType } from "./Shape/types";

export const boxSize = 10;

/**
 * 包围盒视图管理类
 * 负责创建、渲染和清理形状的包围盒
 */
export class BoundBoxView {
  constructor() {}

  /**
   * 获取形状包围盒的四个角落
   * @param shape 需要获取包围盒的形状
   * @returns 角落容器
   */
  private _getShapeBoundingFourCorners(shape: Shape) {
    const box = shape.getBoundingBox();
    const { width, height, center } = box;
    const scale = shape.absoluteScale;
    const rotation = shape.absoluteRotation;

    // 创建角落矩形
    const makeCornerRect = (
      x: number,
      y: number,
      parentCenter: Vector2,
      cursor: CanvasCursorType = CanvasCursorType.Default
    ) => {
      // 旋转角落, 这里的 x,y 是基于世界(canvas)坐标来的
      const rotated = rotatePoint(
        x,
        y,
        parentCenter.x,
        parentCenter.y,
        rotation
      );
      // 如果设置了 parent，这里 x, y 要转为 parent 的坐标系，旋转后转换为 container 的 x，y
      const originX = rotated.x - parentCenter.x;
      const originY = rotated.y - parentCenter.y;
      const strokeColor =
        shape instanceof Text
          ? new Color("#ff0000").alpha((shape as Text).relativeFillColor.a)
          : new Color("#ff0000").alpha(shape.relativeStrokeColor.a);

      const rect = new Rectangle({
        x: originX,
        y: originY,
        width: boxSize,
        height: boxSize,
        cursor,
        pointerEvents: "auto",
        strokeColor,
        scale: new Vector2(
          Math.min(1.5, Math.max(0.5, scale.x)),
          Math.min(1.5, Math.max(0.5, scale.y))
        ),
      });

      return rect;
    };

    // 创建四个角落角落的容器
    function makeCornerContainer(
      x: number,
      y: number,
      width: number,
      height: number,
      cursor: CanvasCursorType = CanvasCursorType.Default
    ) {
      const strokeColor =
        shape instanceof Text
          ? new Color("#ff0000").alpha(shape.relativeFillColor.a)
          : new Color("#ff0000").alpha(shape.relativeStrokeColor.a);
      const container = new Rectangle({
        x,
        y,
        width,
        height,
        cursor,
        pointerEvents: "none",
        strokeColor,
        rotation,
      });

      return container;
    }

    const cornerContainer = makeCornerContainer(
      center.x,
      center.y,
      width + boxSize,
      height + boxSize
    );
    const containerBox = cornerContainer.getBoundingBox();
    // 定义角落的位置
    const corners = [
      {
        x: containerBox.left,
        y: containerBox.top,
        cursor: CanvasCursorType.NwseResize,
      },
      {
        x: containerBox.right,
        y: containerBox.top,
        cursor: CanvasCursorType.NeswResize,
      },
      {
        x: containerBox.right,
        y: containerBox.bottom,
        cursor: CanvasCursorType.NwseResize,
      },
      {
        x: containerBox.left,
        y: containerBox.bottom,
        cursor: CanvasCursorType.NeswResize,
      },
    ];
    corners.map((corner) => {
      const rect = makeCornerRect(
        corner.x,
        corner.y,
        containerBox.center,
        corner.cursor
      );
      cornerContainer.appendChild(rect);
      return rect;
    });
    return cornerContainer;
  }
  /**
   * 处理包围盒并返回包围盒容器
   * @param shape 需要添加包围盒的形状
   */
  makeBoundingBox(shape: Shape): Shape {
    return this._getShapeBoundingFourCorners(shape);
  }
}

export const boundBoxView = new BoundBoxView();