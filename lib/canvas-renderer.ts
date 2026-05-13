// lib/canvas-renderer.ts
export type EnhancementPreset = 'warm' | 'airy' | 'vivid' | 'moody' | 'natural'
export type IllustrationStyle = 'botanical' | 'geometric' | 'crescent' | 'none'

export function pickPreset(category?: string, emotion?: string): EnhancementPreset {
  if (emotion === 'emotional' || category === 'ceremony') return 'warm'
  if (emotion === 'energetic' || category === 'dance')    return 'vivid'
  if (category === 'venue')                               return 'airy'
  if (category === 'couple')                              return 'warm'
  return 'natural'
}

export function pickIllustration(index: number, category?: string, emotion?: string): IllustrationStyle {
  if (index % 3 !== 0) return 'none'
  if (category === 'venue' || emotion === 'emotional') return 'botanical'
  if (category === 'ceremony') return 'crescent'
  return 'geometric'
}

async function preloadFonts() {
  if (typeof document === 'undefined') return
  try {
    await Promise.all([
      document.fonts.load('300 48px "Cormorant Garamond"'),
      document.fonts.load('400 48px Amiri'),
      document.fonts.load('400 24px "DM Sans"'),
      document.fonts.load('500 24px Cairo'),
    ])
  } catch {}
}

function applyFilter(ctx: CanvasRenderingContext2D, preset: EnhancementPreset) {
  const filters: Record<EnhancementPreset, string> = {
    warm:    'brightness(1.06) contrast(1.05) saturate(1.12) sepia(0.08)',
    airy:    'brightness(1.10) contrast(0.94) saturate(0.88)',
    vivid:   'brightness(1.02) contrast(1.10) saturate(1.22)',
    moody:   'brightness(0.94) contrast(1.14) saturate(0.82)',
    natural: 'brightness(1.03) contrast(1.03) saturate(1.00)',
  }
  ctx.filter = filters[preset]
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  const grad = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.75)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function drawBotanical(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.65
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  const s = w * 0.18
  ctx.beginPath()
  ctx.moveTo(s * 0.1, h - s * 0.1)
  ctx.quadraticCurveTo(s * 0.25, h - s * 0.6, s * 0.5, h - s * 1.0)
  ctx.stroke()
  const branches = [{ t: 0.3, angle: -0.9, len: 0.3 }, { t: 0.55, angle: 0.7, len: 0.25 }, { t: 0.75, angle: -0.6, len: 0.2 }]
  branches.forEach(b => {
    const bx = s * 0.1 + b.t * (s * 0.4), by = h - s * 0.1 - b.t * (s * 0.9)
    const ex = bx + Math.cos(b.angle) * s * b.len, ey = by - Math.abs(Math.sin(b.angle)) * s * b.len
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke()
    ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(253,250,246,0.8)'; ctx.fill()
  })
  ctx.restore()
}

function drawGeometric(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.2
  const cx = w - w * 0.1, cy = h * 0.08, r = w * 0.055
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 8, ia = a + Math.PI / 8
    const ox = cx + Math.cos(a) * r, oy = cy + Math.sin(a) * r
    const ix = cx + Math.cos(ia) * r * 0.42, iy = cy + Math.sin(ia) * r * 0.42
    if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy)
    ctx.lineTo(ix, iy)
  }
  ctx.closePath(); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2)
  ctx.globalAlpha = 0.25; ctx.stroke()
  ctx.restore()
}

function drawCrescent(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.5
  const cx = w - w * 0.08, cy = h - h * 0.06, r = w * 0.04
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.beginPath(); ctx.arc(cx + r * 0.45, cy - r * 0.25, r * 0.75, 0, Math.PI * 2); ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.45
  const sx = cx - r * 1.6, sy = cy - r * 1.2, sr = r * 0.25
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2, ia = a + Math.PI / 4
    ctx.lineTo(sx + Math.cos(a) * sr, sy + Math.sin(a) * sr)
    ctx.lineTo(sx + Math.cos(ia) * sr * 0.4, sy + Math.sin(ia) * sr * 0.4)
  }
  ctx.closePath(); ctx.stroke()
  ctx.restore()
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url + (url.includes('?') ? '&_cb=' : '?_cb=') + Date.now()
  })
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale
  const sx = x + (w - sw) / 2, sy = y + (h - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word }
    else line = test
  }
  if (line) lines.push(line)
  return lines
}

// ── STORY (1080 × 1920) ──
export async function renderStory(
  photoUrl: string,
  captionEn: string,
  captionAr: string,
  lang: 'en' | 'ar',
  preset: EnhancementPreset
): Promise<Blob> {
  await preloadFonts()
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = await loadImage(photoUrl)

  applyFilter(ctx, preset)
  drawImageCover(ctx, img, 0, 0, W, H)
  ctx.filter = 'none'
  drawVignette(ctx, W, H)

  const grad = ctx.createLinearGradient(0, H * 0.55, 0, H)
  grad.addColorStop(0, 'rgba(13,27,42,0)')
  grad.addColorStop(1, 'rgba(13,27,42,0.85)')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

  const caption = lang === 'ar' ? captionAr : captionEn
  const fontSize = Math.round(W * 0.062)
  ctx.font = lang === 'ar'
    ? `400 ${fontSize}px Amiri, serif`
    : `300 ${fontSize}px "Cormorant Garamond", Georgia, serif`
  ctx.fillStyle = '#FDFAF6'
  ctx.textAlign = 'center'
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14

  const lines = wrapText(ctx, caption, W * 0.78)
  const lineH = fontSize * 1.4
  let y = H * 0.81 - (lines.length * lineH) / 2
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lineH }

  // Gold divider
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(196,145,74,0.7)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W * 0.38, H * 0.77); ctx.lineTo(W * 0.62, H * 0.77); ctx.stroke()

  // Watermark
  ctx.fillStyle = 'rgba(253,250,246,0.5)'
  ctx.font = `400 ${Math.round(W * 0.022)}px "DM Sans", Arial, sans-serif`
  ctx.textAlign = 'center'; ctx.direction = 'ltr'
  ctx.fillText('Munasaba · مناسبة', W / 2, H * 0.965)

  return new Promise(r => canvas.toBlob(b => r(b!), 'image/png', 0.95))
}

// ── POST (1080 × 1080) ──
export async function renderPost(
  photoUrl: string,
  illustrationStyle: IllustrationStyle,
  preset: EnhancementPreset
): Promise<Blob> {
  await preloadFonts()
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = await loadImage(photoUrl)

  applyFilter(ctx, preset)
  drawImageCover(ctx, img, 0, 0, W, H)
  ctx.filter = 'none'
  drawVignette(ctx, W, H)

  if (illustrationStyle === 'botanical') drawBotanical(ctx, W, H)
  else if (illustrationStyle === 'geometric') drawGeometric(ctx, W, H)
  else if (illustrationStyle === 'crescent') drawCrescent(ctx, W, H)

  ctx.fillStyle = 'rgba(253,250,246,0.45)'
  ctx.font = `400 ${Math.round(W * 0.02)}px "DM Sans", Arial, sans-serif`
  ctx.textAlign = 'right'; ctx.direction = 'ltr'
  ctx.fillText('Munasaba', W * 0.97, H * 0.97)

  return new Promise(r => canvas.toBlob(b => r(b!), 'image/png', 0.95))
}

// ── PHOTO DUMP (1080 × 1350) ──
export async function renderPhotoDump(
  photoUrls: string[],
  captionEn: string,
  captionAr: string,
  lang: 'en' | 'ar',
  preset: EnhancementPreset
): Promise<Blob> {
  await preloadFonts()
  const W = 1080, CAPTION_H = 170, GRID_H = 1180, H = GRID_H + CAPTION_H
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#F5EDD9'; ctx.fillRect(0, 0, W, H)

  const urls = photoUrls.slice(0, 9)
  const imgs = await Promise.all(urls.map(loadImage))

  type Cell = { x: number; y: number; w: number; h: number }
  const g = 4 // gap
  const layouts: Record<number, Cell[]> = {
    1: [{ x: 0, y: 0, w: W, h: GRID_H }],
    2: [{ x: 0, y: 0, w: W/2-g, h: GRID_H }, { x: W/2+g, y: 0, w: W/2-g, h: GRID_H }],
    3: [
      { x: 0, y: 0, w: W*2/3-g, h: GRID_H },
      { x: W*2/3+g, y: 0, w: W/3-g, h: GRID_H/2-g },
      { x: W*2/3+g, y: GRID_H/2+g, w: W/3-g, h: GRID_H/2-g },
    ],
    4: [
      { x: 0, y: 0, w: W/2-g, h: GRID_H/2-g },
      { x: W/2+g, y: 0, w: W/2-g, h: GRID_H/2-g },
      { x: 0, y: GRID_H/2+g, w: W/2-g, h: GRID_H/2-g },
      { x: W/2+g, y: GRID_H/2+g, w: W/2-g, h: GRID_H/2-g },
    ],
    6: Array.from({ length: 6 }, (_, i) => ({
      x: (i % 3) * (W/3 + g/2), y: Math.floor(i/3) * (GRID_H/2 + g/2),
      w: W/3 - g, h: GRID_H/2 - g,
    })),
    9: Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * (W/3 + g/2), y: Math.floor(i/3) * (GRID_H/3 + g/2),
      w: W/3 - g, h: GRID_H/3 - g,
    })),
  }

  const n = urls.length
  const nearest = [1,2,3,4,6,9].reduce((a,b) => Math.abs(b-n) < Math.abs(a-n) ? b : a)
  const cells = layouts[nearest] ?? layouts[4]

  imgs.forEach((img, i) => {
    const cell = cells[i]; if (!cell) return
    ctx.save()
    const r = 10
    ctx.beginPath()
    ctx.moveTo(cell.x+r, cell.y); ctx.lineTo(cell.x+cell.w-r, cell.y)
    ctx.quadraticCurveTo(cell.x+cell.w, cell.y, cell.x+cell.w, cell.y+r)
    ctx.lineTo(cell.x+cell.w, cell.y+cell.h-r)
    ctx.quadraticCurveTo(cell.x+cell.w, cell.y+cell.h, cell.x+cell.w-r, cell.y+cell.h)
    ctx.lineTo(cell.x+r, cell.y+cell.h)
    ctx.quadraticCurveTo(cell.x, cell.y+cell.h, cell.x, cell.y+cell.h-r)
    ctx.lineTo(cell.x, cell.y+r)
    ctx.quadraticCurveTo(cell.x, cell.y, cell.x+r, cell.y)
    ctx.closePath(); ctx.clip()
    applyFilter(ctx, preset)
    const scale = Math.max(cell.w/img.naturalWidth, cell.h/img.naturalHeight)
    const sw = img.naturalWidth*scale, sh = img.naturalHeight*scale
    ctx.drawImage(img, cell.x+(cell.w-sw)/2, cell.y+(cell.h-sh)/2, sw, sh)
    ctx.filter = 'none'
    ctx.restore()
  })

  // Caption bar
  ctx.fillStyle = '#F5EDD9'; ctx.fillRect(0, GRID_H, W, CAPTION_H)
  ctx.strokeStyle = '#C4914A'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W*0.08, GRID_H+22); ctx.lineTo(W*0.92, GRID_H+22); ctx.stroke()

  const caption = lang === 'ar' ? captionAr : captionEn
  ctx.fillStyle = '#0D1B2A'
  ctx.textAlign = 'center'
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  const capFs = Math.round(W * 0.036)
  ctx.font = lang === 'ar'
    ? `400 ${capFs}px Amiri, serif`
    : `300 ${capFs}px "Cormorant Garamond", Georgia, serif`
  ctx.fillText(caption, W/2, GRID_H + 88)

  ctx.fillStyle = 'rgba(142,122,103,0.5)'
  ctx.font = `400 ${Math.round(W*0.018)}px "DM Sans", Arial, sans-serif`
  ctx.direction = 'ltr'
  ctx.fillText('Munasaba · مناسبة', W/2, GRID_H + 138)

  return new Promise(r => canvas.toBlob(b => r(b!), 'image/png', 0.95))
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
