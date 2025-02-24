import "./style.css";
import { Scene } from "./core/Scene.ts";
import Path from "./Shape/Path.ts";
import Circle from "./Shape/Circle.ts";
import Rectangle from "./Shape/Rectangle.ts";
import Text from "./Shape/Text.ts";

const scene = new Scene();

// 创建一个新的 Path 对象
let currentPath: Path | null = null;
let isDrawing = false;
let pressStartTime = 0;
const MIN_LINE_WIDTH = 2;
const MAX_LINE_WIDTH = 4;
// 达到最大线宽所需的按压时间（毫秒）
const MAX_PRESS_TIME = 2000;

// 获取画布元素
const canvas = scene.getCanvas();
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.classList.add("canvas");

const path3 = new Path({ strokeColor: "magenta" });
const path4 = new Path({ strokeColor: "green", x: 100, lineWidth: 5 });
const circle1 = new Circle({
  fillColor: "red",
  radius: 50,
  x: 50,
  y: 50,
  lineWidth: 2,
  strokeColor: "yellow",
  active: true,
});

const rect1 = new Rectangle({
  fillColor: "red",
  width: 50,
  height: 50,
  x: 200,
  y: 200,
  lineWidth: 2,
  strokeColor: "yellow",
  active: true,
  cursor: "pointer"
});
const text1 = new Text({
  text: "Hello, World!",
  fontSize: 20,
  fontFamily: "Arial",
  x: 50,
  y: 50,
  fillColor: "blue",
});
path3.lineTo(100, 100);
path3.lineTo(200, 200);
// path3.lineTo(100, 200);
// path3.lineTo(20, 300);

path4.lineTo(50, 90);
path4.lineTo(130, 200);
// path4.lineTo(300, 80);
// path4.lineTo(200, 300);

path3.appendChild(circle1);
circle1.appendChild(path4);

circle1.cursor = 'crosshair';

setTimeout(() => {
  // path3.rotate(90);
  path3.scale(1);
  path3.opacity(0.5);
  // path3.opacity(0.2);
  // path3.translate(100, 100);
  circle1.scale(0.8);
  // circle1.opacity(0.5);
  text1.direction = 'rtl';
  path3.strokeColor = "cyan";
  scene.render();
}, 2000);

// circle1.opacity(0.1);
circle1.translate(100, 100);
circle1.scale(2);

// console.log(111, path3, circle1, path4);

// window.shape = {
//   path3,
//   path4,
//   circle1
// }
rect1.scale(2);
rect1.opacity(0.5);

// rect1.rotate(45);
// rect1.parent = circle1;

scene.addShape(path3);
scene.addShape(text1);
scene.addShape(rect1);
// scene.addShape(circle1);

// function getLineWidth(pressTime: number): number {
//   const normalizedTime = Math.min(pressTime, MAX_PRESS_TIME) / MAX_PRESS_TIME;
//   return MIN_LINE_WIDTH + normalizedTime * (MAX_LINE_WIDTH - MIN_LINE_WIDTH);
// }

// 添加鼠标按下事件监听器
// canvas.addEventListener('mousedown', (event) => {
//   isDrawing = true;
//   pressStartTime = Date.now();
//   // 创建新的 Path 对象
//   currentPath = new Path({
//     strokeColor: 'blue',
//     lineWidth: getLineWidth(0)
//   });

//   // 移动到鼠标按下的位置
//   const rect = canvas.getBoundingClientRect();
//   const x = event.clientX - rect.left;
//   const y = event.clientY - rect.top;
//   currentPath.moveTo(x, y);

//   // 将新的 Path 添加到场景中
//   scene.addShape(currentPath);
// });

// // 添加鼠标移动事件监听器
// canvas.addEventListener('mousemove', (event) => {
//   if (currentPath && isDrawing) {
//     // 获取鼠标位置
//     const rect = canvas.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     const pressTime = Date.now() - pressStartTime;
//     const lineWidth = getLineWidth(pressTime);

//     // 添加线段到当前路径
//     currentPath.lineTo(x, y, lineWidth);

//     // 重新渲染场景
//     scene.render();
//   }
// });

// // 添加鼠标松开事件监听器
// canvas.addEventListener('mouseup', () => {
//   // 结束当前路径
//   currentPath = null;
//   isDrawing = false;
//   pressStartTime = 0;
// });

// canvas.addEventListener('mouseout', () => {
//   // 结束当前路径
//   currentPath = null;
//   isDrawing = false;
//   pressStartTime = 0;
// });
