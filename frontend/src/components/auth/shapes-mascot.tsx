'use client';

import { useRef, useEffect, useState } from 'react';
import {
  EyeOff, Pencil, Eye, Sparkles, AlertTriangle,
  Check, Shield, UserPlus, ArrowRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
export type Expression =
  | 'idle'
  | 'typing-email'
  | 'typing-password'
  | 'typing-name'
  | 'hover-button'
  | 'error'
  | 'success'
  | 'scared'
  | 'angry';

interface Props {
  mousePos: { x: number; y: number };
  expression: Expression;
  passwordLength?: number;
}

/* ═══════════════════════════════════════════════════
   Spring Physics
   ═══════════════════════════════════════════════════ */
class Sp {
  v: number;
  vel = 0;
  constructor(initial: number, public k = 0.1, public d = 0.6) {
    this.v = initial;
  }
  to(target: number) {
    const f = (target - this.v) * this.k - this.vel * this.d;
    this.vel += f;
    this.v += this.vel;
    return this.v;
  }
  kick(a: number) { this.vel += a; }
}

/* ═══════════════════════════════════════════════════
   Utilities & Constants
   ═══════════════════════════════════════════════════ */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const CW = 320;
const CH = 380;

/* ═══════════════════════════════════════════════════
   Shape Definitions
   ═══════════════════════════════════════════════════ */
type Personality = 'bold' | 'chill' | 'serious' | 'nervous';
type ShapeType = 'square' | 'circle' | 'rect' | 'triangle';

interface ShapeDef {
  id: number; type: ShapeType;
  col: string; col2: string;
  hx: number; hy: number; w: number; h: number; rot0: number;
  exX: number; exY: number; eR: number;
  pers: Personality; blinkInt: number;
}

const DEFS: ShapeDef[] = [
  { id: 0, type: 'square',   col: '#1B2A4A', col2: '#0C1326', hx: 100, hy: 128, w: 100, h: 100, rot0: -0.15, exX: 20, exY: -5,  eR: 13, pers: 'bold',    blinkInt: 170 },
  { id: 1, type: 'circle',   col: '#f97316', col2: '#c2410c', hx: 80,  hy: 268, w: 95,  h: 95,  rot0: 0,     exX: 22, exY: 4,   eR: 14, pers: 'chill',   blinkInt: 230 },
  { id: 2, type: 'rect',     col: '#312e81', col2: '#1e1b4b', hx: 198, hy: 224, w: 58,  h: 115, rot0: 0,     exX: 10, exY: -16, eR: 9,  pers: 'serious', blinkInt: 340 },
  { id: 3, type: 'triangle', col: '#eab308', col2: '#a16207', hx: 248, hy: 258, w: 92,  h: 84,  rot0: 0.1,   exX: 14, exY: 8,   eR: 10, pers: 'nervous', blinkInt: 70  },
];

/* ═══════════════════════════════════════════════════
   Per-Shape Mutable State
   ═══════════════════════════════════════════════════ */
interface PupilState { x: number; y: number; vx: number; vy: number }

interface ShapeState {
  px: number; py: number; vx: number; vy: number;
  rot: Sp; sqx: Sp; sqy: Sp;
  eyeOpen: Sp; mSmile: Sp; mOpen: Sp;
  brow: Sp; blush: Sp;
  pL: PupilState; pR: PupilState;
  blinkT: number; blinkV: number; blinking: boolean;
  t: number;
  joy: number; fear: number; shy: number; surp: number;
}

function createShapeState(d: ShapeDef): ShapeState {
  return {
    px: d.hx, py: d.hy, vx: 0, vy: 0,
    rot: new Sp(d.rot0, 0.065, 0.55),
    sqx: new Sp(1, 0.15, 0.54), sqy: new Sp(1, 0.15, 0.54),
    eyeOpen: new Sp(1, 0.1, 0.55),
    mSmile: new Sp(0.5, 0.07, 0.58), mOpen: new Sp(0, 0.07, 0.58),
    brow: new Sp(0, 0.08, 0.55), blush: new Sp(0, 0.06, 0.55),
    pL: { x: 0, y: 0, vx: 0, vy: 0 },
    pR: { x: 0, y: 0, vx: 0, vy: 0 },
    blinkT: Math.random() * 220, blinkV: 1, blinking: false,
    t: Math.random() * 100,
    joy: 0, fear: 0, shy: 0, surp: 0,
  };
}

/* ═══════════════════════════════════════════════════
   Particle System
   ═══════════════════════════════════════════════════ */
type ParticleShape = 'star' | 'diamond' | 'ring' | 'spark' | 'bolt';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; shape: ParticleShape;
  sz: number; col: string; rot: number; rotV: number;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.life * p.life;
  ctx.fillStyle = p.col;
  ctx.strokeStyle = p.col;
  ctx.lineWidth = 1.5;
  const s = p.sz;

  switch (p.shape) {
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.4;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'ring': {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'spark': {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? s : s * 0.25;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'bolt': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s); ctx.lineTo(s * 0.15, -s * 0.1);
      ctx.lineTo(-s * 0.1, -s * 0.1); ctx.lineTo(s * 0.3, s);
      ctx.lineTo(-s * 0.15, s * 0.1); ctx.lineTo(s * 0.1, s * 0.1);
      ctx.closePath(); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Animation State (grouped in one object)
   ═══════════════════════════════════════════════════ */
interface AnimState {
  shapes: ShapeState[];
  particles: Particle[];
  globalT: number;
  prevPassLen: number;
  peekOpacity: number;
  peekMsg: string;
}

const PEEK_MSGS = [
  'Soy chismoso...',
  'Je je, yo si veo',
  'No me aguanto',
  'Shh... secreto',
  'Que curioso soy',
  'Estoy espiando',
];

function createAnimState(): AnimState {
  return {
    shapes: DEFS.map(createShapeState),
    particles: [],
    globalT: 0,
    prevPassLen: 0,
    peekOpacity: 0,
    peekMsg: PEEK_MSGS[0],
  };
}

/* ═══════════════════════════════════════════════════
   Trigger Reactions on Expression Change
   ═══════════════════════════════════════════════════ */
function triggerReaction(st: AnimState, expr: Expression) {
  const { shapes, particles } = st;
  const cols = ['#1B2A4A', '#f97316', '#eab308', '#7691BC', '#fbbf24', '#818cf8'];
  const types: ParticleShape[] = ['star', 'diamond', 'ring', 'spark', 'bolt'];

  switch (expr) {
    case 'typing-name':
      shapes[0].joy = 0.9; shapes[0].sqy.kick(-0.22); shapes[0].sqx.kick(0.12); shapes[0].rot.kick(0.1);
      shapes[1].joy = 0.4; shapes[3].joy = 0.5;
      break;
    case 'typing-password':
      st.peekMsg = PEEK_MSGS[Math.floor(Math.random() * PEEK_MSGS.length)];
      break;
    case 'typing-email':
      shapes[0].surp = 0.3; shapes[1].joy = 0.2; shapes[2].joy = 0.1;
      break;
    case 'hover-button':
      shapes.forEach(s => { s.joy = lerp(s.joy, 0.75, 0.5); s.sqy.kick(-0.12); });
      break;
    case 'error':
      shapes[0].surp = 0.6; shapes[0].sqy.kick(0.15);
      shapes[1].fear = 0.3; shapes[3].fear = 0.85; shapes[3].sqy.kick(-0.18);
      shapes[2].surp = 0.2;
      shapes.forEach(s => { s.vx += (Math.random() - 0.5) * 6; });
      break;
    case 'success':
      shapes.forEach((s, i) => {
        s.joy = 1;
        s.sqy.kick(-0.38 - i * 0.04);
        s.sqx.kick(0.22);
        s.vy = -12 - Math.random() * 5;
        s.vx = (Math.random() - 0.5) * 10;
        s.rot.kick((Math.random() - 0.5) * 0.4);
        for (let j = 0; j < 7; j++) {
          const a = (Math.PI * 2 * j) / 7;
          const sp = 2.5 + Math.random() * 4.5;
          particles.push({
            x: s.px, y: s.py,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
            life: 1, shape: types[j % types.length],
            sz: 5 + Math.random() * 7, col: cols[j % cols.length],
            rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.2,
          });
        }
      });
      break;
    case 'scared':
      shapes[3].fear = 0.95; shapes[3].sqy.kick(-0.2);
      shapes[0].fear = 0.3; shapes[1].fear = 0.4; shapes[2].fear = 0.2;
      break;
    case 'angry':
      shapes[0].fear = 0.5; shapes[3].fear = 0.9;
      shapes.forEach(s => { s.vx += (Math.random() - 0.5) * 8; });
      break;
    default: break;
  }
}

/* ═══════════════════════════════════════════════════
   Physics Update (called every frame)
   ═══════════════════════════════════════════════════ */
function update(
  st: AnimState, mx: number, my: number,
  expression: Expression, passLen: number,
) {
  st.globalT += 0.016;
  const isShy = expression === 'typing-password';
  const onCanvas = mx > -30 && mx < CW + 30 && my > -30 && my < CH + 30;

  // Password strength one-shot
  if (passLen >= 8 && st.prevPassLen < 8) {
    st.shapes[3].joy = 0.85; st.shapes[3].sqy.kick(-0.15);
    st.shapes[0].joy = 0.5;
  }
  st.prevPassLen = passLen;

  DEFS.forEach((d, i) => {
    const s = st.shapes[i];
    s.t += 0.016 + i * 0.004;

    // Mouse interaction
    const dd = Math.hypot(mx - s.px, my - s.py);
    const fd = Math.max(d.w, d.h) * 0.72;
    if (onCanvas && dd < fd * 1.6) {
      const nx = (mx - s.px) / (dd || 1);
      const ny = (my - s.py) / (dd || 1);
      switch (d.pers) {
        case 'bold':    s.vx += nx * 0.32; s.vy += ny * 0.28; s.joy = lerp(s.joy, 0.35, 0.06); break;
        case 'nervous': s.vx -= nx * (s.fear * 0.6 + 0.28); s.vy -= ny * (s.fear * 0.6 + 0.28); s.fear = lerp(s.fear, 0.55, 0.08); break;
        case 'chill':   s.vx += nx * 0.06; s.vy += ny * 0.05; break;
        case 'serious': s.vx += nx * 0.02; s.vy += ny * 0.02; break;
      }
    }

    // Spring to home
    s.vx += (d.hx - s.px) * 0.09;
    s.vy += (d.hy - s.py) * 0.085;
    s.vx *= 0.83; s.vy *= 0.83;
    s.px += s.vx; s.py += s.vy;
    s.px = clamp(s.px, d.w * 0.5, CW - d.w * 0.5);
    s.py = clamp(s.py, d.h * 0.5 + 8, CH - d.h * 0.5 - 8);

    // Decay emotions
    s.joy  = lerp(s.joy,  0, 0.011);
    s.fear = lerp(s.fear, 0, 0.03);
    s.surp = lerp(s.surp, 0, 0.02);
    s.shy  = lerp(s.shy, isShy ? (i === 2 ? 0.3 : 0.88) : 0, 0.08);

    // Squash & stretch
    const spd = Math.hypot(s.vx, s.vy);
    const va = Math.atan2(s.vy, s.vx);
    const str = clamp(spd * 0.055, 0, 0.55);
    let tSx = 1 + Math.abs(Math.sin(va)) * str;
    let tSy = 1 + Math.abs(Math.cos(va)) * str;
    const bob = Math.sin(s.t * (1.1 + i * 0.2)) * 0.044;
    tSx = lerp(tSx, 1 + bob, 0.3);
    tSy = lerp(tSy, 1 - bob, 0.3);
    if (s.joy > 0.1) { tSx = lerp(tSx, 1 + Math.sin(s.t * 5) * 0.14, s.joy); tSy = lerp(tSy, 1 - Math.sin(s.t * 5) * 0.14, s.joy); }
    if (s.surp > 0.1) { tSx = lerp(tSx, 0.5, s.surp * 0.85); tSy = lerp(tSy, 1.7, s.surp * 0.85); }
    if (s.fear > 0.3) { tSx = lerp(tSx, 0.85, s.fear * 0.5); tSy = lerp(tSy, 1.22, s.fear * 0.5); }
    s.sqx.to(tSx); s.sqy.to(tSy);

    // Rotation
    s.rot.to(d.rot0 + s.vx * 0.022 + (s.fear > 0.2 ? Math.sin(s.t * 15) * s.fear * 0.04 : 0));

    // Pupil tracking
    const upP = (pu: PupilState, ox: number) => {
      const ex = s.px + ox, ey = s.py + d.exY;
      const edx = mx - ex, edy = my - ey;
      const ea = Math.atan2(edy, edx);
      const ed = clamp(Math.hypot(edx, edy), 0, 90) / 90;
      const mp = d.eR * 0.46;
      let tpx = Math.cos(ea) * ed * mp;
      let tpy = Math.sin(ea) * ed * mp;
      if (s.shy > 0.3) { tpx *= (1 - s.shy * 0.8); tpy = lerp(tpy, mp * 0.5, s.shy * 0.8); }
      pu.vx += (tpx - pu.x) * 0.12; pu.vy += (tpy - pu.y) * 0.12;
      pu.vx *= 0.72; pu.vy *= 0.72;
      pu.x += pu.vx; pu.y += pu.vy;
    };
    upP(s.pL, -d.exX); upP(s.pR, d.exX);

    // Mouth
    let ts = 0.5, to = 0;
    if (s.joy > 0.1) { ts = lerp(ts, 1, s.joy); to = lerp(to, 0.55, s.joy); }
    if (s.fear > 0.1) ts = lerp(ts, 0, s.fear);
    if (s.shy > 0.1) ts = lerp(ts, 0.2, s.shy);
    if (s.surp > 0.1) { ts = 0; to = lerp(to, 1, s.surp); }
    if (isShy) ts = lerp(ts, 0.2, 0.7);
    if (d.pers === 'serious') ts = lerp(ts, 0.42, 0.5);
    s.mSmile.to(ts); s.mOpen.to(to);

    // Eyebrow
    let tb = 0;
    if (s.fear > 0.1) tb = lerp(tb, -0.6, s.fear);
    if (s.surp > 0.1) tb = lerp(tb, 0.9, s.surp);
    if (s.joy > 0.1) tb = lerp(tb, 0.3, s.joy);
    if (isShy) tb = lerp(tb, -0.28, 0.6);
    s.brow.to(tb);

    // Blush
    s.blush.to(Math.max(s.joy * 0.55, s.shy * 0.9));

    // Eye openness
    let tOpen = 1;
    if (s.shy > 0.1) tOpen = lerp(tOpen, 0.02, s.shy);
    if (s.fear > 0.1) tOpen = lerp(tOpen, 1.55, s.fear);
    if (s.joy > 0.1) tOpen = lerp(tOpen, 0.7, s.joy);
    if (d.pers === 'serious') tOpen = lerp(tOpen, 0.72, 0.55);

    // Blinking
    s.blinkT++;
    if (!s.blinking && s.blinkT > d.blinkInt + Math.random() * 130) { s.blinking = true; s.blinkT = 0; s.blinkV = 1; }
    if (s.blinking) { s.blinkV -= 0.25; if (s.blinkV < -0.8) { s.blinking = false; s.blinkV = 1; } }
    s.eyeOpen.to(clamp(tOpen * Math.max(0, s.blinkV), 0, 1.65));
  });

  // Peek bubble opacity (rect peeking during password)
  const rectShy = st.shapes[2].shy;
  const shouldPeek = rectShy > 0.15 && rectShy < 0.5;
  st.peekOpacity = lerp(st.peekOpacity, shouldPeek ? 1 : 0, 0.045);

  // Update particles
  for (let j = st.particles.length - 1; j >= 0; j--) {
    const p = st.particles[j];
    p.vy += 0.1; p.vx *= 0.97;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.rotV; p.life -= 0.018;
    if (p.life <= 0) st.particles.splice(j, 1);
  }
}

/* ═══════════════════════════════════════════════════
   Peek Bubble (drawn on canvas near the rect)
   ═══════════════════════════════════════════════════ */
function drawPeekBubble(ctx: CanvasRenderingContext2D, st: AnimState) {
  if (st.peekOpacity < 0.01) return;

  const rect = st.shapes[2];
  const d = DEFS[2];
  const text = st.peekMsg;
  const wobble = Math.sin(st.globalT * 2.5) * 1.5;

  ctx.save();
  ctx.globalAlpha = st.peekOpacity;

  // Measure text to center bubble above shape
  ctx.font = 'bold 11px "Inter Variable", Inter, system-ui, sans-serif';
  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const iconSpace = 16;
  const pad = 10;
  const bw = tw + pad * 2 + iconSpace;
  const bh = 26;

  // Position: centered above the rect, clamped to canvas
  const margin = 6;
  const bx = clamp(rect.px - bw / 2, margin, CW - bw - margin);
  const by = rect.py - d.h * 0.5 - bh - 12;
  ctx.translate(bx, by + wobble);

  // Bubble background
  ctx.fillStyle = 'rgba(30, 27, 75, 0.92)';
  ctx.beginPath();
  ctx.roundRect(0, 0, bw, bh, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Arrow pointing down
  const arrowX = bw / 2;
  ctx.fillStyle = 'rgba(30, 27, 75, 0.92)';
  ctx.beginPath();
  ctx.moveTo(arrowX - 5, bh);
  ctx.lineTo(arrowX, bh + 7);
  ctx.lineTo(arrowX + 5, bh);
  ctx.closePath();
  ctx.fill();

  // Eye icon (small peeping eye)
  const ix = pad + 2;
  const iy = bh / 2;
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ix - 5, iy);
  ctx.quadraticCurveTo(ix, iy - 4.5, ix + 5, iy);
  ctx.quadraticCurveTo(ix, iy + 4.5, ix - 5, iy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ix, iy, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(167, 139, 250, 0.9)';
  ctx.fill();

  // Text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, pad + iconSpace, bh / 2);

  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Canvas Drawing
   ═══════════════════════════════════════════════════ */
function drawEye(
  ctx: CanvasRenderingContext2D, d: ShapeDef, s: ShapeState,
  ex: number, ey: number, R: number, pu: PupilState,
) {
  const open = clamp(s.eyeOpen.v, 0, 1.65);
  const isShy = s.shy > 0.5;

  if (isShy || open < 0.05) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, R * 0.72, Math.PI, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.72)';
    ctx.lineWidth = R * 0.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  // Sclera
  ctx.beginPath();
  ctx.ellipse(ex, ey, R, R * open, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = 3;
  ctx.fill();

  // Clip to eye
  ctx.beginPath();
  ctx.ellipse(ex, ey, R, R * open, 0, 0, Math.PI * 2);
  ctx.clip();

  const ppx = ex + pu.x, ppy = ey + pu.y;
  const pr = R * 0.58;

  // Pupil
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(ppx, ppy, pr, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fill();

  // Iris ring
  ctx.beginPath(); ctx.arc(ppx, ppy, pr * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = d.col + '99'; ctx.fill();

  // Highlights
  ctx.beginPath(); ctx.arc(ppx - pr * 0.28, ppy - pr * 0.3, pr * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
  ctx.beginPath(); ctx.arc(ppx + pr * 0.22, ppy + pr * 0.18, pr * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();

  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, st: AnimState) {
  ctx.clearRect(0, 0, CW, CH);

  // Draw order: back shapes first
  const order = [1, 3, 0, 2];

  for (const i of order) {
    const d = DEFS[i], s = st.shapes[i];

    ctx.save();
    ctx.translate(s.px, s.py);
    ctx.rotate(s.rot.v);
    ctx.scale(s.sqx.v, s.sqy.v);

    /* ─── Shadow ─── */
    ctx.save();
    const flat = s.sqx.v / s.sqy.v;
    const r = Math.max(d.w, d.h) * 0.44;
    ctx.translate(0, (d.h * 0.5 + 10) / s.sqy.v);
    const gs = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    gs.addColorStop(0, 'rgba(0,0,0,0.14)');
    gs.addColorStop(1, 'transparent');
    ctx.fillStyle = gs;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * clamp(flat, 0.4, 2), r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ─── Body shape ─── */
    ctx.save();
    ctx.shadowColor = d.col;
    ctx.shadowBlur = 16;
    const gr = ctx.createLinearGradient(-d.w * 0.5, -d.h * 0.5, d.w * 0.4, d.h * 0.4);
    gr.addColorStop(0, d.col);
    gr.addColorStop(1, d.col2);
    ctx.fillStyle = gr;

    ctx.beginPath();
    switch (d.type) {
      case 'circle': {
        const pts = 14, W2 = d.w * 0.5, H2 = d.h * 0.5;
        for (let j = 0; j <= pts; j++) {
          const a = (j / pts) * Math.PI * 2;
          const wob = 1 + Math.sin(a * 3 + s.t * 1.8) * 0.022 + Math.sin(a * 2 - s.t * 2.2) * 0.015;
          const rx = W2 * wob, ry = H2 * wob;
          if (j === 0) ctx.moveTo(Math.cos(a) * rx, Math.sin(a) * ry);
          else ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
        }
        ctx.closePath();
        break;
      }
      case 'square': {
        const rr = d.w * 0.12, w2 = d.w * 0.5, h2 = d.h * 0.5;
        const wg = Math.sin(s.t * 1.2) * 0.016;
        ctx.moveTo(-w2 + rr, -h2 + wg * d.h);
        ctx.lineTo(w2 - rr, -h2 - wg * d.h);
        ctx.quadraticCurveTo(w2, -h2, w2, -h2 + rr);
        ctx.lineTo(w2 + wg * d.w, h2 - rr);
        ctx.quadraticCurveTo(w2, h2, w2 - rr, h2);
        ctx.lineTo(-w2 + rr, h2 + wg * d.h);
        ctx.quadraticCurveTo(-w2, h2, -w2, h2 - rr);
        ctx.lineTo(-w2 - wg * d.w, -h2 + rr);
        ctx.quadraticCurveTo(-w2, -h2, -w2 + rr, -h2 + wg * d.h);
        ctx.closePath();
        break;
      }
      case 'rect': {
        ctx.roundRect(-d.w * 0.5, -d.h * 0.5, d.w, d.h, d.w * 0.24);
        break;
      }
      case 'triangle': {
        const w2 = d.w * 0.5, h2 = d.h * 0.5;
        const rr = 10;
        const verts: [number, number][] = [[0, -h2], [w2, h2], [-w2, h2]];
        for (let j = 0; j < 3; j++) {
          const prev = verts[(j + 2) % 3], curr = verts[j], next = verts[(j + 1) % 3];
          const d0 = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
          const d1 = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
          const t0 = rr / d0, t1 = rr / d1;
          const p0x = curr[0] + (prev[0] - curr[0]) * t0, p0y = curr[1] + (prev[1] - curr[1]) * t0;
          const p1x = curr[0] + (next[0] - curr[0]) * t1, p1y = curr[1] + (next[1] - curr[1]) * t1;
          if (j === 0) ctx.moveTo(p0x, p0y);
          else ctx.lineTo(p0x, p0y);
          ctx.quadraticCurveTo(curr[0], curr[1], p1x, p1y);
        }
        ctx.closePath();
        break;
      }
    }
    ctx.fill();

    // Glass highlight overlay
    const sh = ctx.createLinearGradient(-d.w * 0.4, -d.h * 0.42, d.w * 0.15, d.h * 0.15);
    sh.addColorStop(0, 'rgba(255,255,255,0.26)');
    sh.addColorStop(0.65, 'rgba(255,255,255,0.04)');
    sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fill();
    ctx.restore();

    /* ─── Face ─── */
    const eR = d.eR, spX = d.exX, spY = d.exY;
    const blushV = s.blush.v, bv = s.brow.v;

    // Blush
    if (blushV > 0.02) {
      ctx.save();
      ctx.globalAlpha = blushV * 0.65;
      ctx.fillStyle = '#ff99bb';
      ctx.beginPath();
      ctx.ellipse(-spX * 0.88, spY + eR * 1.35, eR * 1.08, eR * 0.48, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(spX * 0.88, spY + eR * 1.35, eR * 1.08, eR * 0.48, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Eyebrows
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = eR * 0.16;
    ctx.lineCap = 'round';

    ctx.save();
    ctx.translate(-spX, spY - eR * 1.42);
    ctx.rotate(-bv * 0.4);
    ctx.beginPath();
    ctx.moveTo(-eR * 0.7, 0);
    ctx.quadraticCurveTo(0, -eR * 0.28 * Math.abs(bv + 0.2), eR * 0.7, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(spX, spY - eR * 1.42);
    ctx.rotate(bv * 0.4);
    ctx.beginPath();
    ctx.moveTo(-eR * 0.7, 0);
    ctx.quadraticCurveTo(0, -eR * 0.28 * Math.abs(bv + 0.2), eR * 0.7, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // Eyes
    drawEye(ctx, d, s, -spX, spY, eR, s.pL);
    drawEye(ctx, d, s, spX, spY, eR, s.pR);

    // Mouth
    const my2 = spY + eR * 2.1;
    const sm = s.mSmile.v, op = s.mOpen.v;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = eR * 0.17;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';

    if (op > 0.08) {
      const mh = op * eR * 1.55;
      ctx.beginPath();
      ctx.ellipse(0, my2 + mh * 0.5, eR * 0.6 + op * eR * 0.52, mh, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fill(); ctx.stroke();
      if (sm > 0.55) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(-eR * 0.4, my2 + eR * 0.08, eR * 0.8, eR * 0.36, eR * 0.1);
        ctx.fill();
      }
    } else {
      const cy2 = -eR * 0.36 + sm * eR * 0.84;
      ctx.beginPath();
      ctx.moveTo(-eR * 0.68, my2);
      ctx.quadraticCurveTo(0, my2 + cy2, eR * 0.68, my2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // end shape transform
  }

  // Particles
  for (const p of st.particles) drawParticle(ctx, p);

  // Peek bubble (rect being nosy during password)
  drawPeekBubble(ctx, st);
}

/* ═══════════════════════════════════════════════════
   Speech Bubble Content (Lucide icons)
   ═══════════════════════════════════════════════════ */
function getBubbleContent(expr: Expression) {
  const ic = 'w-4 h-4 shrink-0';
  switch (expr) {
    case 'typing-password': return { icon: <EyeOff className={`${ic} text-navy-600 dark:text-navy-300`} />,       text: 'No miramos! Prometido...' };
    case 'typing-email':    return { icon: <Eye className={`${ic} text-navy-600 dark:text-navy-300`} />,           text: 'Hmm, dejame ver...' };
    case 'typing-name':     return { icon: <Pencil className={`${ic} text-navy-600 dark:text-navy-300`} />,        text: 'Mucho gusto!' };
    case 'hover-button':    return { icon: <ArrowRight className={`${ic} text-navy-600 dark:text-navy-300`} />,    text: 'Vamos! Tu puedes!' };
    case 'error':           return { icon: <AlertTriangle className={`${ic} text-amber-400`} />,  text: 'Intenta de nuevo!' };
    case 'success':         return { icon: <Check className={`${ic} text-green-400`} />,          text: 'Bienvenido!' };
    case 'scared':          return { icon: <Shield className={`${ic} text-amber-400`} />,         text: 'Ay, tranquilo...' };
    case 'angry':           return { icon: <AlertTriangle className={`${ic} text-red-400`} />,    text: 'Ya basta!' };
    default:                return { icon: <UserPlus className={`${ic} text-navy-600 dark:text-navy-300`} />,      text: 'Crea tu cuenta!' };
  }
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function ShapesMascot({ mousePos, expression, passwordLength = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AnimState>(createAnimState());
  const mouseRef = useRef(mousePos);
  const exprRef = useRef(expression);
  const passLenRef = useRef(passwordLength);
  const prevExprRef = useRef(expression);

  // Speech bubble
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Update refs without re-renders
  useEffect(() => { mouseRef.current = mousePos; }, [mousePos]);
  useEffect(() => { passLenRef.current = passwordLength; }, [passwordLength]);

  // Handle expression changes -> trigger reactions + bubble
  useEffect(() => {
    exprRef.current = expression;
    if (prevExprRef.current !== expression) {
      prevExprRef.current = expression;
      triggerReaction(stateRef.current, expression);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      setBubbleVisible(true);
      (bubbleTimerRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>).current = setTimeout(() => setBubbleVisible(false), 4500);
    }
  }, [expression]);

  // Canvas setup + animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    let animId: number;
    const loop = () => {
      const container = containerRef.current;
      const rect = container?.getBoundingClientRect();
      const mx = rect ? (mouseRef.current.x - rect.left) * (CW / rect.width) : CW / 2;
      const my = rect ? (mouseRef.current.y - rect.top) * (CH / rect.height) : CH / 2;

      update(stateRef.current, mx, my, exprRef.current, passLenRef.current);
      draw(ctx, stateRef.current);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const bubble = getBubbleContent(expression);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center">
      {/* Floating background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-navy-400/15 animate-mascot-float"
            style={{
              width: `${6 + i * 3}px`,
              height: `${6 + i * 3}px`,
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 22}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${3 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="relative z-10 w-full max-w-[320px] h-auto"
        style={{ aspectRatio: `${CW} / ${CH}` }}
      />

      {/* Speech bubble */}
      <div
        className={`absolute -top-1 left-1/2 -translate-x-1/2 z-20 bg-surface-card dark:bg-white/10 backdrop-blur-md shadow-md rounded-2xl px-4 py-2.5 border border-border-default dark:border-white/20 shadow-lg transition-all duration-300 ${
          bubbleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <p className="text-sm font-semibold text-text-secondary whitespace-nowrap flex items-center gap-2">
          {bubble.icon} {bubble.text}
        </p>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-card dark:bg-white/10 border-b border-r border-border-default dark:border-white/20 rotate-45" />
      </div>

      {/* Label below */}
      <div className="relative z-10 mt-4 flex gap-3 items-center">
        <Sparkles className="w-4 h-4 text-navy-400/60" />
        <span className="text-xs font-medium text-text-ghost tracking-wider uppercase">
          Tus nuevos amigos
        </span>
        <Sparkles className="w-4 h-4 text-navy-400/60" />
      </div>
    </div>
  );
}
