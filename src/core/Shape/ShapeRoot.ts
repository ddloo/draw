/** 树形结构来管理图形 */

import { generateUniqueId } from "@Utils/Str";
import { Events, EventsType } from "@Events";
import { Shape } from "./Shape";
import { CAPTURE_NAME, ROOT_ID } from "./types";

type Root = { children: Shape[]; id: string };
type EventArray = { target: Shape; handler: Events["triggerEvent"] }[];

export class ShapeRoot {
  private _root: Root = { children: [], id: ROOT_ID };
  private _nodeMap = new Map<string, Shape>();

  constructor() {}

  /** 添加图形 */
  addShape(shape: Shape, parentId = ROOT_ID): string {
    const shapeId = generateUniqueId();

    // 获取父节点
    const parentNode = this._nodeMap.get(parentId)?.parent ?? this._root;

    if (parentNode === this._root) {
      parentNode.children.push(shape);
      parentNode.children.sort((a, b) => a.zIndex - b.zIndex);
    } else {
      (parentNode as Shape).appendChild(shape);
    }

    this._nodeMap.set(shapeId, shape);

    return shapeId;
  }

  /** 
   * 删除图形
   * @description 递归删除子节点
   * @param id 要删除的图形 id
   * @param isFirstDeep 是否直遍历第一层
   */
  removeShape(id: string, isFirstDeep = false): void {
    for (let i = 0; i < this._root.children.length; i++) {
      const shape = this._root.children[i];
      if (shape.id === id) {
        this._root.children.splice(i, 1);
        this._nodeMap.delete(id);
      } else if (!isFirstDeep) {
        shape.removeChild(id);
      }
    }
  }

  /** 访问树 */
  traverseTree(callback: (node: Shape) => any, isIgnored = false): void {
    for (const shape of this._root.children) {
      shape.traverseTree(callback, isIgnored);
    }
  }

  /** 获取图形 */
  getShape(id: string): Shape | undefined {
    if(this._nodeMap.has(id)) return this._nodeMap.get(id);

    try {
      this.traverseTree((node) => {
        if(node.id === id) {
          throw node;
        }
      }, true);
    } catch (error) {
      if (error instanceof Shape) {
        return error;
      }
    }
  }

  /** 从坐标点获取最上层的图形 */
  findShapeFromPoint(x: number, y: number): Shape | null {
    // 要获取优先级最高的节点，也就是要从树的最右节点开始遍历
    // 遍历顺序为 右节点->左节点->父节点，这里要模拟树的遍历

    // 栈(用来存储节点)，null 标识当前节点的子节点已经遍历完成
    const stack: (Shape | Root | null)[] = [this._root];
    while (stack.length) {
      let node = stack.pop();
      if (node === this._root) {
        stack.push(...this._root.children);
      } else if (node instanceof Shape) {
        // 如果节点有子节点，意味着要继续往下遍历
        // 这里要 push 节点，确保后续能访问到节点
        stack.push(node);
        // 传入 null，标识节点已经子节点已经遍历完了
        stack.push(null);
        stack.push(...node.children);
      } else if (node === null) {
        // null 标识节点已经子节点已经遍历完了
        // 这时候获取节点
        node = stack.pop() as Shape;
        // 误差在 5 像素
        if (node.isPointInShape(x, y, 5)) {
          return node;
        }
      }
    }

    return null;
  }

  /** 获取事件 */
  getToggleEvents(
    shape: Shape,
    eventname: EventsType
  ): { bubble: EventArray; capture: EventArray } {
    const bubbleEvents: EventArray = [];
    const captureEvents: EventArray = [];
    const bubbleName = eventname;
    const captureName = `${CAPTURE_NAME}${eventname}` as EventsType;
    let currNode: Shape | null = shape;

    while (currNode) {
      if (currNode.eventMap.has(bubbleName)) {
        bubbleEvents.push({
          target: currNode,
          handler: currNode.triggerEvent!,
        });
      }

      if (currNode.eventMap.has(captureName)) {
        captureEvents.unshift({
          target: currNode,
          handler: currNode.triggerEvent!,
        });
      }

      currNode = currNode.parent;
    }

    return {
      bubble: bubbleEvents,
      capture: captureEvents,
    };
  }
}
