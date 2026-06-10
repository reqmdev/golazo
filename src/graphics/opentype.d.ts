declare module 'opentype.js' {
  export interface Font {
    getAdvanceWidth(text: string, fontSize: number): number;
  }

  export function loadSync(path: string): Font;
  export function parse(buffer: Buffer): Font;
}