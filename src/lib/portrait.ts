const FILTER_W = 320;
const FILTER_H = 240;

/**
 * Capture the current webcam frame and apply a pencil-sketch filter:
 * grayscale → invert+blur → color-dodge blend = sketch look.
 * Returns a dataURL (JPEG) of the sketch image, or null on failure.
 */
export function capturePortraitFilter(videoEl: HTMLVideoElement): string | null {
  if (!videoEl || videoEl.readyState < 2) return null;

  // 1. Draw mirrored frame
  const src = document.createElement('canvas');
  src.width = FILTER_W;
  src.height = FILTER_H;
  const sctx = src.getContext('2d', { willReadFrequently: true });
  if (!sctx) return null;
  sctx.translate(FILTER_W, 0);
  sctx.scale(-1, 1);
  sctx.drawImage(videoEl, 0, 0, FILTER_W, FILTER_H);
  sctx.setTransform(1, 0, 0, 1, 0, 0);

  // 2. Grayscale
  const gd = sctx.getImageData(0, 0, FILTER_W, FILTER_H);
  for (let i = 0; i < gd.data.length; i += 4) {
    const v = gd.data[i] * 0.299 + gd.data[i + 1] * 0.587 + gd.data[i + 2] * 0.114;
    gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v;
  }
  sctx.putImageData(gd, 0, 0);

  // 3. Inverted + blurred copy
  const inv = document.createElement('canvas');
  inv.width = FILTER_W;
  inv.height = FILTER_H;
  const ictx = inv.getContext('2d', { willReadFrequently: true });
  if (!ictx) return null;
  ictx.filter = 'invert(1) blur(7px)';
  ictx.drawImage(src, 0, 0);
  ictx.filter = 'none';

  const grayData = sctx.getImageData(0, 0, FILTER_W, FILTER_H).data;
  const blurData = ictx.getImageData(0, 0, FILTER_W, FILTER_H).data;

  // 4. Color-dodge blend: sketch = gray / (1 − blur/255)
  const out = new Uint8ClampedArray(FILTER_W * FILTER_H * 4);
  for (let i = 0; i < FILTER_W * FILTER_H; i++) {
    const g = grayData[i * 4];
    const b = blurData[i * 4];
    const v = b >= 255 ? 255 : Math.min(255, Math.round((g * 255) / (255 - b)));
    out[i * 4]     = v;
    out[i * 4 + 1] = v;
    out[i * 4 + 2] = v;
    out[i * 4 + 3] = 240;
  }

  const result = document.createElement('canvas');
  result.width = FILTER_W;
  result.height = FILTER_H;
  result.getContext('2d')!.putImageData(new ImageData(out, FILTER_W, FILTER_H), 0, 0);
  return result.toDataURL('image/jpeg', 0.9);
}
