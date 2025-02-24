import type { Shape } from "./Shape/Shape";
import { CanvasCursorType } from "./Shape/types";

interface CanvasOptions {
    width?: number;
    height?: number;
    backgroundColor?: string;
}

class Canvas {
    private _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;

    constructor(canvas?: HTMLCanvasElement, options?: CanvasOptions) {
        this._canvas = canvas || document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;

        if (options) {
            this._canvas.width = options.width || this._canvas.width;
            this._canvas.height = options.height || this._canvas.height;
            this._ctx.fillStyle = options.backgroundColor || this._ctx.fillStyle;
        }
    }

    draw(shape: Shape): void {
        shape.draw(this._ctx);
    }

    clear(): void {
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.fillStyle = this._ctx.fillStyle;
    }

    rotate(angle: number): void {
        this._ctx.rotate(angle);
    }

    rotateShape(shape: Shape, angle: number): void {
        shape.rotate(angle);
    }

    translate(x: number, y: number): void {
        this._ctx.translate(x, y);
    }

    translateShape(shape: Shape, x: number, y: number): void {
        shape.translate(x, y);
    }

    scale(x: number, y: number): void {
        this._ctx.scale(x, y);
    }

    scaleShape(shape: Shape, x: number, y: number): void {
        shape.scale(x, y);
    }

    save(): void {
        this._ctx.save();
    }

    restore(): void {
        this._ctx.restore();
    }

    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    get ctx(): CanvasRenderingContext2D {
        return this._ctx;
    }

    get width(): number {
        return this._canvas.width;
    }

    get height(): number {
        return this._canvas.height;
    }

    get classList(): DOMTokenList {
        return this._canvas.classList;
    }

    get addEventListener(): <K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLCanvasElement, ev: HTMLElementEventMap[K]) => any) => void {
        return this._canvas.addEventListener.bind(this._canvas);
    }

    getBoundingClientRect(): DOMRect {
        return this._canvas.getBoundingClientRect();
    }

    get backgroundColor(): string {
        return this._ctx.fillStyle as string;
    }

    set width(width: number) {
        this._canvas.width = width;
    }

    set height(height: number) {    
        this._canvas.height = height;
    }

    set backgroundColor(color: string) {
        this._ctx.fillStyle = color;
    }

    get cursor(): CanvasCursorType {
        return this._canvas.style.cursor as CanvasCursorType;
    }

    set cursor(cursor: CanvasCursorType) {
        this._canvas.style.cursor = cursor;
    }
}

export default Canvas;
