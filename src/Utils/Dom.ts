/** 创建 textarea 元素 */
export function createTextarea(text: string, style?: Partial<CSSStyleDeclaration>): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    
    // 设置默认样式
    const defaultStyle: Partial<CSSStyleDeclaration> = {
        position: "absolute",
        top: "0",
        left: "0",
        width: "1px",
        height: "1px",
        border: "none",
        outline: "none",
        resize: "none",
        overflow: "hidden",
        padding: "0",
        margin: "0",
        background: "transparent",
        zIndex: "-1",
    };

    // 应用默认样式
    Object.assign(textarea.style, defaultStyle);

    // 应用传入的自定义样式
    if (style) {
        Object.assign(textarea.style, style);
    }

    // 设置文本内容
    textarea.value = text;

    // 设置其他属性
    textarea.spellcheck = false;
    textarea.autocapitalize = "off";
    textarea.autocomplete = "off";

    // 将 textarea 添加到 DOM 中
    document.body.appendChild(textarea);

    return textarea;
}