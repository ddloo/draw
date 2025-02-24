/** 生成唯一 ID */
export function generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/** 字符串第一个大写 */
export function capitalizeFirstLetter(str: string): string {
    return str.replace(/^./, match => match.toUpperCase());
}