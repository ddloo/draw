/** 获取贝塞尔曲线的中心点(二阶) */
export function getBezierCenterPoint(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    const t = 0.5;
    // 本质上是二阶贝塞尔曲线的公式，这里 t 取 0.5 即为中心点
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * x2 + t ** 2 * x3;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * y2 + t ** 2 * y3;
    return { x, y };
}

/** 角度转弧度 */
export function rotateByDegrees(degrees: number): number {
    return degrees * Math.PI / 180;
}

/** 旋转点
 * 
 * @param x 源点的 x 坐标
 * @param y 源点的 y 坐标
 * @param centerX 中心点（源点基于中心点旋转）
 * @param centerY 中心点（源点基于中心点旋转）
 * @param rotation 旋转角度
 * @returns
 */
export function rotatePoint(x: number, y: number, centerX: number, centerY: number, rotation: number): { x: number, y: number } {
    // 通过建立极坐标系，x轴的正方向为极轴，原点为极点，记为点离极点的距离为r，角度为θ
    // 这里的 r 代表点离极点的距离（其实就是以原点为中心，半径为 r 的圆），θ 代表点在极坐标系中的角度
    // 可以得出点再极坐标系的位置为（r*cos(θ), r*sin(θ)）
    // 当我们移动该点时，假设移动 a 角度
    // 那么新点为 （r*cos(θ+a), r*sin(θ+a)）
    // 根据三角函数和角公式，可以得出
    
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    
    const translatedX = x - centerX;
    const translatedY = y - centerY;
    
    const rotatedX = translatedX * cosR - translatedY * sinR;
    const rotatedY = translatedX * sinR + translatedY * cosR;
    
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  }