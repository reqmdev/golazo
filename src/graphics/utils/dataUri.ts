export function bufferToDataUri(buffer: Buffer, mime = 'image/png'): string {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}