import { GIFEncoder, quantize, applyPalette } from 'gifenc';

const selfLocations = [[116, -8], [109, 3], [130, -10]];
const targetLocations = [[2, 177], [12, 172], [6, 158]];
const canvas = (w, h = w) => Object.assign(document.createElement('canvas'), { width: w, height: h });

export async function decode(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export async function loadAvatar(qq) {
  // QQ does not send CORS headers. Public image proxies make the response
  // readable by Canvas without deploying a backend or exposing credentials.
  const source = `q.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
  const urls = ['wsrv.nl', 'images.weserv.nl'].map(host =>
    `https://${host}/?url=${encodeURIComponent(source)}&w=256&h=256&fit=cover&output=png`);
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12000), referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('头像请求失败');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/') || blob.size > 8 * 1024 * 1024) throw new Error('头像格式错误');
      return await decode(blob);
    } catch { /* Try the alternate host. */ }
  }
  throw new Error('QQ 头像暂时读取失败，请重试，或点击下方「上传头像」后生成。');
}

function head(image, size, angle) {
  const clipped = canvas(size);
  const ctx = clipped.getContext('2d');
  const edge = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const w = image.naturalWidth || image.width, h = image.naturalHeight || image.height;
  ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(image, (w - edge) / 2, (h - edge) / 2, edge, edge, 0, 0, size, size);
  const rotated = canvas(size), r = rotated.getContext('2d');
  r.translate(size / 2, size / 2); r.rotate(-angle * Math.PI / 180);
  r.drawImage(clipped, -size / 2, -size / 2);
  return rotated;
}

let templates;
export async function renderMeme(first, second) {
  templates ??= Promise.all([0, 1, 2].map(async i => {
    const response = await fetch(`/assets/do/${i}.png`);
    if (!response.ok) throw new Error('模板加载失败，请刷新页面重试');
    return decode(await response.blob());
  })).catch(error => { templates = undefined; throw error; });
  const backgrounds = await templates;
  const self = head(first, 122, 15), target = head(second, 112, 90);
  const gif = GIFEncoder();
  for (let i = 0; i < 3; i++) {
    const frame = canvas(backgrounds[i].naturalWidth, backgrounds[i].naturalHeight);
    const ctx = frame.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, frame.width, frame.height);
    ctx.drawImage(backgrounds[i], 0, 0);
    ctx.drawImage(target, ...targetLocations[i]);
    ctx.drawImage(self, ...selfLocations[i]);
    const { data } = ctx.getImageData(0, 0, frame.width, frame.height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), frame.width, frame.height, { palette, delay: 50, repeat: 0 });
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

export function sampleAvatar(letter, background, foreground) {
  const c = canvas(256), ctx = c.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = foreground; ctx.font = 'bold 136px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, 128, 140);
  return c;
}
