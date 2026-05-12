// lib/canvas-renderer.ts
// Browser-side canvas rendering for stories, posts, and photo dumps.
// All output is a downloadable PNG blob.

export type EnhancementPreset = 'warm' | 'airy' | 'vivid' | 'moody' | 'natural'
export type IllustrationStyle = 'botanical' | 'geometric' | 'crescent' | 'none'

// Map photo category + emotion → best enhancement preset
export function pickPreset(category?: string, emotion?: string): EnhancementPreset {
  if (emotion === 'emotional' || category === 'ceremony') return 'warm'
  if (emotion === 'energetic' || category === 'dance')    return 'vivid'
  if (category === 'venue')                               return 'airy'
  if (category === 'couple')                              return 'warm'
  return 'natural'
}

// Pick whether a post gets an illustration (not all of them)
export function pickIllustration(index: number, category?: string, emotion?: string): IllustrationStyle {
  // ~35% of posts get illustrations
  if (index % 3 !== 0) return 'none'
  if (category === 'venue' || emotion === 'emotional') return 'botanical'
  if (category === 'ceremony') return 'crescent'
  return 'geometric'
}

// Apply CSS-filter-based enhancement to canvas
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

// Draw a soft vignette overlay
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  const grad = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.75)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// Botanical illustration — delicate bottom-left corner
function drawBotanical(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.65
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  const s = w * 0.18

  // Main stem
  ctx.beginPath()
  ctx.moveTo(s * 0.1, h - s * 0.1)
  ctx.quadraticCurveTo(s * 0.25, h - s * 0.6, s * 0.5, h - s * 1.0)
  ctx.stroke()

  // Branches
  const branches = [
    { t: 0.3, angle: -0.9, len: 0.3 },
    { t: 0.55, angle: 0.7, len: 0.25 },
    { t: 0.75, angle: -0.6, len: 0.2 },
  ]

  branches.forEach(b => {
    const bx = s * 0.1 + b.t * (s * 0.4)
    const by = h - s * 0.1 - b.t * (s * 0.9)
    const ex = bx + Math.cos(b.angle) * s * b.len
    const ey = by - Math.abs(Math.sin(b.angle)) * s * b.len

    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(ex, ey)
    ctx.stroke()

    // Flower dot at tip
    ctx.beginPath()
    ctx.arc(ex, ey, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(253,250,246,0.8)'
    ctx.fill()

    // Petal suggestion (tiny oval)
    ctx.save()
    ctx.translate(ex, ey)
    ctx.rotate(b.angle)
    ctx.beginPath()
    ctx.ellipse(0, -4, 2, 4, 0, 0, Math.PI * 2)
    ctx.globalAlpha = 0.4
    ctx.fill()
    ctx.restore()
  })

  ctx.restore()
}

// Geometric illustration — top-right Arabic-inspired 8-pointed star
function drawGeometric(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.2

  const cx = w - w * 0.1
  const cy = h * 0.08
  const r = w * 0.055

  // 8-pointed star
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 8
    const innerAngle = angle + Math.PI / 8
    const ox = cx + Math.cos(angle) * r
    const oy = cy + Math.sin(angle) * r
    const ix = cx + Math.cos(innerAngle) * r * 0.42
    const iy = cy + Math.sin(innerAngle) * r * 0.42
    if (i === 0) ctx.moveTo(ox, oy)
    else ctx.lineTo(ox, oy)
    ctx.lineTo(ix, iy)
  }
  ctx.closePath()
  ctx.stroke()

  // Outer decorative ring
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2)
  ctx.globalAlpha = 0.25
  ctx.stroke()

  ctx.restore()
}

// Crescent + star (subtle, Saudi-appropriate)
function drawCrescent(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.filter = 'none'
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.lineWidth = 1.5

  const cx = w - w * 0.08
  const cy = h - h * 0.06
  const r = w * 0.04

  // Outer circle
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Inner circle to create crescent
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.beginPath()
  ctx.arc(cx + r * 0.45, cy - r * 0.25, r * 0.75, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Small 4-pointed star nearby
  ctx.globalAlpha = 0.45
  const sx = cx - r * 1.6
  const sy = cy - r * 1.2
  const sr = r * 0.25
  ctx.strokeStyle = 'rgba(253,250,246,0.9)'
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const ia = a + Math.PI / 4
    ctx.lineTo(sx + Math.cos(a) * sr, sy + Math.sin(a) * sr)
    ctx.lineTo(sx + Math.cos(ia) * sr * 0.4, sy + Math.sin(ia) * sr * 0.4)
  }
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

// Load image from URL into an HTMLImageElement (CORS-aware)
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

// Crop + fit image to canvas (cover mode)
function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = img.naturalWidth * scale
  const sh = img.naturalHeight * scale
  const sx = (w - sw) / 2
  const sy = (h - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh)
}

// ── STORY RENDERER (1080 × 1920) ──
export async function renderStory(
  photoUrl: string,
  captionEn: string,
  captionAr: string,
  lang: 'en' | 'ar',
  preset: EnhancementPreset
): Promise<Blob> {
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const img = await loadImage(photoUrl)

  // Enhanced photo
  applyFilter(ctx, preset)
  drawImageCover(ctx, img, W, H)
  ctx.filter = 'none'

  // Vignette
  drawVignette(ctx, W, H)

  // Bottom gradient for caption area
  const captionGrad = ctx.createLinearGradient(0, H * 0.55, 0, H)
  captionGrad.addColorStop(0, 'rgba(13,27,42,0)')
  captionGrad.addColorStop(1, 'rgba(13,27,42,0.82)')
  ctx.fillStyle = captionGrad
  ctx.fillRect(0, 0, W, H)

  // Caption text
  const caption = lang === 'ar' ? captionAr : captionEn
  ctx.fillStyle = '#FDFAF6'
  ctx.textAlign = lang === 'ar' ? 'right' : 'center'
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'

  // Caption — use two font attempts (browser fonts)
  const fontSize = Math.round(W * 0.068)
  ctx.font = `300 ${fontSize}px "Cormorant Garamond", "Georgia", serif`
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 12

  // Word wrap
  const maxW = W * 0.82
  const words = caption.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  const lineH = fontSize * 1.35
  const totalH = lines.length * lineH
  let y = H * 0.82 - totalH / 2

  const cx = lang === 'ar' ? W * 0.9 : W / 2
  for (const l of lines) {
    ctx.fillText(l, cx, y)
    y += lineH
  }

  // Subtle caption line above
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(196,145,74,0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W * 0.35, H * 0.78)
  ctx.lineTo(W * 0.65, H * 0.78)
  ctx.stroke()

  // Brand watermark
  ctx.fillStyle = 'rgba(253,250,246,0.55)'
  ctx.font = `400 ${Math.round(W * 0.022)}px "DM Sans", "Arial", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('Munasaba · مناسبة', W / 2, H * 0.96)

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.95))
}

// ── POST RENDERER (1080 × 1080) ──
export async function renderPost(
  photoUrl: string,
  illustrationStyle: IllustrationStyle,
  preset: EnhancementPreset
): Promise<Blob> {
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const img = await loadImage(photoUrl)

  // Enhanced photo
  applyFilter(ctx, preset)
  drawImageCover(ctx, img, W, H)
  ctx.filter = 'none'

  // Light vignette
  drawVignette(ctx, W, H)

  // Illustration
  if (illustrationStyle === 'botanical') drawBotanical(ctx, W, H)
  else if (illustrationStyle === 'geometric') drawGeometric(ctx, W, H)
  else if (illustrationStyle === 'crescent') drawCrescent(ctx, W, H)

  // Subtle brand mark bottom-right
  ctx.fillStyle = 'rgba(253,250,246,0.50)'
  ctx.font = `400 ${Math.round(W * 0.02)}px "DM Sans", "Arial", sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('Munasaba', W * 0.97, H * 0.97)

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.95))
}

// ── PHOTO DUMP COLLAGE (1080 × 1350) ──
export async function renderPhotoDump(
  photoUrls: string[],
  captionEn: string,
  captionAr: string,
  lang: 'en' | 'ar',
  preset: EnhancementPreset
): Promise<Blob> {
  const W = 1080
  // Caption bar at bottom
  const CAPTION_H = 160
  const GRID_H = 1350 - CAPTION_H
  const H = GRID_H + CAPTION_H

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Cream background
  ctx.fillStyle = '#F5EDD9'
  ctx.fillRect(0, 0, W, H)

  // Load all images (up to 9)
  const urls = photoUrls.slice(0, 9)
  const imgs = await Promise.all(urls.map(loadImage))

  // Grid layout: varies by count
  const layouts: Record<number, { x: number; y: number; w: number; h: number }[]> = {
    1: [{ x: 0, y: 0, w: W, h: GRID_H }],
    2: [{ x: 0, y: 0, w: W/2-2, h: GRID_H }, { x: W/2+2, y: 0, w: W/2-2, h: GRID_H }],
    3: [
      { x: 0, y: 0, w: W*2/3-2, h: GRID_H },
      { x: W*2/3+2, y: 0, w: W/3-2, h: GRID_H/2-2 },
      { x: W*2/3+2, y: GRID_H/2+2, w: W/3-2, h: GRID_H/2-2 },
    ],
    4: [
      { x: 0, y: 0, w: W/2-2, h: GRID_H/2-2 },
      { x: W/2+2, y: 0, w: W/2-2, h: GRID_H/2-2 },
      { x: 0, y: GRID_H/2+2, w: W/2-2, h: GRID_H/2-2 },
      { x: W/2+2, y: GRID_H/2+2, w: W/2-2, h: GRID_H/2-2 },
    ],
    6: [
      { x: 0, y: 0, w: W/3-2, h: GRID_H/2-2 }, { x: W/3+2, y: 0, w: W/3-2, h: GRID_H/2-2 }, { x: W*2/3+2, y: 0, w: W/3-2, h: GRID_H/2-2 },
      { x: 0, y: GRID_H/2+2, w: W/3-2, h: GRID_H/2-2 }, { x: W/3+2, y: GRID_H/2+2, w: W/3-2, h: GRID_H/2-2 }, { x: W*2/3+2, y: GRID_H/2+2, w: W/3-2, h: GRID_H/2-2 },
    ],
    9: Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) * (W/3 + 1), y: Math.floor(i / 3) * (GRID_H/3 + 1),
      w: W/3 - 2, h: GRID_H/3 - 2,
    })),
  }

  const count = urls.length
  const nearest = [1,2,3,4,6,9].reduce((a, b) => Math.abs(b - count) < Math.abs(a - count) ? b : a)
  const cells = layouts[nearest] ?? layouts[4]

  // Draw each photo in its cell with enhancement
  imgs.forEach((img, i) => {
    const cell = cells[i]
    if (!cell) return

    ctx.save()
    // Round corners clip per cell
    const r = 8
    ctx.beginPath()
    ctx.moveTo(cell.x + r, cell.y)
    ctx.lineTo(cell.x + cell.w - r, cell.y)
    ctx.quadraticCurveTo(cell.x + cell.w, cell.y, cell.x + cell.w, cell.y + r)
    ctx.lineTo(cell.x + cell.w, cell.y + cell.h - r)
    ctx.quadraticCurveTo(cell.x + cell.w, cell.y + cell.h, cell.x + cell.w - r, cell.y + cell.h)
    ctx.lineTo(cell.x + r, cell.y + cell.h)
    ctx.quadraticCurveTo(cell.x, cell.y + cell.h, cell.x, cell.y + cell.h - r)
    ctx.lineTo(cell.x, cell.y + r)
    ctx.quadraticCurveTo(cell.x, cell.y, cell.x + r, cell.y)
    ctx.closePath()
    ctx.clip()

    applyFilter(ctx, preset)
    // Cover within cell
    const scale = Math.max(cell.w / img.naturalWidth, cell.h / img.naturalHeight)
    const sw = img.naturalWidth * scale
    const sh = img.naturalHeight * scale
    const sx = cell.x + (cell.w - sw) / 2
    const sy = cell.y + (cell.h - sh) / 2
    ctx.drawImage(img, sx, sy, sw, sh)
    ctx.filter = 'none'
    ctx.restore()
  })

  // Caption bar
  const barY = GRID_H
  ctx.fillStyle = '#F5EDD9'
  ctx.fillRect(0, barY, W, CAPTION_H)

  // Gold accent line
  ctx.strokeStyle = '#C4914A'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W * 0.08, barY + 20)
  ctx.lineTo(W * 0.92, barY + 20)
  ctx.stroke()

  // Caption text
  const caption = lang === 'ar' ? captionAr : captionEn
  ctx.fillStyle = '#0D1B2A'
  ctx.textAlign = 'center'
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  const capFontSize = Math.round(W * 0.038)
  ctx.font = `300 ${capFontSize}px "Cormorant Garamond", "Georgia", serif`
  ctx.fillText(caption, W / 2, barY + 80)

  // Munasaba watermark
  ctx.fillStyle = 'rgba(142,122,103,0.5)'
  ctx.font = `400 ${Math.round(W * 0.018)}px "DM Sans", "Arial", sans-serif`
  ctx.fillText('Munasaba · مناسبة', W / 2, barY + 125)

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 0.95))
}

// Trigger browser download of a blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
