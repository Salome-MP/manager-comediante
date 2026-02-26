'use client';

import { useRef, useEffect, useState } from 'react';
import {
  EyeOff, Eye, Sparkles, AlertTriangle,
  Check, Shield, LogIn, Zap, Skull,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
export type Expression =
  | 'idle'
  | 'typing-email'
  | 'typing-password'
  | 'hover-button'
  | 'error'
  | 'success'
  | 'scared'
  | 'angry';

interface Props {
  mousePos: { x: number; y: number };
  expression: Expression;
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

// Distance thresholds for fear behaviors
const FEAR_RADIUS = 130;   // Start trembling
const FLEE_RADIUS = 90;    // Start fleeing
const HIT_RADIUS = 55;     // Click hit detection

/* ═══════════════════════════════════════════════════
   Shape Definitions
   ═══════════════════════════════════════════════════ */
type ShapeType = 'square' | 'circle' | 'rect' | 'triangle';

interface ShapeDef {
  id: number; type: ShapeType;
  col: string; col2: string;
  hx: number; hy: number; w: number; h: number; rot0: number;
  exX: number; exY: number; eR: number;
  blinkInt: number;
}

const DEFS: ShapeDef[] = [
  { id: 0, type: 'square',   col: '#1B2A4A', col2: '#0C1326', hx: 100, hy: 128, w: 100, h: 100, rot0: -0.15, exX: 20, exY: -5,  eR: 13, blinkInt: 170 },
  { id: 1, type: 'circle',   col: '#f97316', col2: '#c2410c', hx: 80,  hy: 268, w: 95,  h: 95,  rot0: 0,     exX: 22, exY: 4,   eR: 14, blinkInt: 230 },
  { id: 2, type: 'rect',     col: '#312e81', col2: '#1e1b4b', hx: 198, hy: 224, w: 58,  h: 115, rot0: 0,     exX: 10, exY: -16, eR: 9,  blinkInt: 340 },
  { id: 3, type: 'triangle', col: '#eab308', col2: '#a16207', hx: 248, hy: 258, w: 92,  h: 84,  rot0: 0.1,   exX: 14, exY: 8,   eR: 10, blinkInt: 70  },
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
  // Login-specific: hurt from click
  hurt: number;       // 0..1, decays over time
  hurtVx: number;     // impulse direction
  hurtVy: number;
  cursorFear: number; // proximity-based fear (0..1)
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
    hurt: 0, hurtVx: 0, hurtVy: 0, cursorFear: 0,
  };
}

/* ═══════════════════════════════════════════════════
   Particle System
   ═══════════════════════════════════════════════════ */
type ParticleShape = 'star' | 'diamond' | 'ring' | 'spark' | 'bolt' | 'impact';

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
    case 'impact': {
      // Impact lines radiating out
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Hit Messages (shown when shapes are clicked)
   ═══════════════════════════════════════════════════ */
const HIT_MSGS = [
  'Auch!', 'Ay!', 'Por que?!', 'No!', 'Duele!',
  'Oye!', 'Malo!', 'Auxilio!', 'Basta!',
];

/* ═══════════════════════════════════════════════════
   Animation State
   ═══════════════════════════════════════════════════ */
interface AnimState {
  shapes: ShapeState[];
  particles: Particle[];
  globalT: number;
  hitMsg: string;
  hitMsgOpacity: number;
  hitMsgX: number;
  hitMsgY: number;
}

function createAnimState(): AnimState {
  return {
    shapes: DEFS.map(createShapeState),
    particles: [],
    globalT: 0,
    hitMsg: '',
    hitMsgOpacity: 0,
    hitMsgX: CW / 2,
    hitMsgY: CH / 2,
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
    case 'typing-password':
      shapes.forEach(s => { s.shy = 0.88; });
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
        s.joy = 1; s.hurt = 0;
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
      shapes.forEach(s => { s.fear = 0.9; s.sqy.kick(-0.2); });
      break;
    case 'angry':
      shapes.forEach(s => { s.fear = 0.7; s.vx += (Math.random() - 0.5) * 8; });
      break;
    default: break;
  }
}

/* ═══════════════════════════════════════════════════
   Handle Mouse Click (Hit Detection)
   ═══════════════════════════════════════════════════ */
function handleHit(st: AnimState, mx: number, my: number) {
  let hitAny = false;

  DEFS.forEach((d, i) => {
    const s = st.shapes[i];
    const dd = Math.hypot(mx - s.px, my - s.py);

    if (dd < HIT_RADIUS) {
      hitAny = true;
      // Strong hurt
      s.hurt = 1;
      const nx = (s.px - mx) / (dd || 1);
      const ny = (s.py - my) / (dd || 1);
      const force = 18 + Math.random() * 8;
      s.vx += nx * force;
      s.vy += ny * force;
      s.hurtVx = nx;
      s.hurtVy = ny;
      s.sqy.kick(-0.55);
      s.sqx.kick(0.4);
      s.rot.kick((Math.random() - 0.5) * 0.8);
      s.surp = 1;

      // Impact particles at hit point
      const impCols = ['#ff4444', '#ff8800', '#ffcc00', '#ffffff'];
      for (let j = 0; j < 10; j++) {
        const a = (Math.PI * 2 * j) / 10 + Math.random() * 0.3;
        const sp = 3 + Math.random() * 5;
        st.particles.push({
          x: mx, y: my,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
          life: 1,
          shape: j % 3 === 0 ? 'impact' : j % 3 === 1 ? 'spark' : 'bolt',
          sz: 4 + Math.random() * 8,
          col: impCols[j % impCols.length],
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.4,
        });
      }
    } else if (dd < HIT_RADIUS * 2.5) {
      // Nearby shapes also get scared and flee
      const nx = (s.px - mx) / (dd || 1);
      const ny = (s.py - my) / (dd || 1);
      s.vx += nx * 8;
      s.vy += ny * 8;
      s.fear = Math.max(s.fear, 0.7);
      s.sqy.kick(-0.15);
    }
  });

  if (hitAny) {
    st.hitMsg = HIT_MSGS[Math.floor(Math.random() * HIT_MSGS.length)];
    st.hitMsgOpacity = 1;
    st.hitMsgX = mx;
    st.hitMsgY = my - 20;
  }
}

/* ═══════════════════════════════════════════════════
   Physics Update (called every frame)
   ═══════════════════════════════════════════════════ */
function update(
  st: AnimState, mx: number, my: number,
  expression: Expression,
) {
  st.globalT += 0.016;
  const isShy = expression === 'typing-password';
  const onCanvas = mx > -30 && mx < CW + 30 && my > -30 && my < CH + 30;

  // Decay hit message
  st.hitMsgOpacity = lerp(st.hitMsgOpacity, 0, 0.025);
  st.hitMsgY -= 0.5; // float up

  DEFS.forEach((d, i) => {
    const s = st.shapes[i];
    s.t += 0.016 + i * 0.004;

    // Mouse proximity fear + flee
    const dd = Math.hypot(mx - s.px, my - s.py);
    const nx = (s.px - mx) / (dd || 1); // direction AWAY from mouse
    const ny = (s.py - my) / (dd || 1);

    if (onCanvas && dd < FEAR_RADIUS) {
      // Proximity-based fear (closer = more fear)
      const fearAmount = 1 - (dd / FEAR_RADIUS);
      s.cursorFear = lerp(s.cursorFear, fearAmount, 0.12);

      if (dd < FLEE_RADIUS) {
        // Active fleeing
        const fleeForce = (1 - dd / FLEE_RADIUS) * 2.5;
        s.vx += nx * fleeForce;
        s.vy += ny * fleeForce;
      }
    } else {
      s.cursorFear = lerp(s.cursorFear, 0, 0.05);
    }

    // Trembling from cursor fear
    if (s.cursorFear > 0.1) {
      const tremble = s.cursorFear * 0.8;
      s.px += Math.sin(s.t * 35 + i * 2) * tremble;
      s.py += Math.cos(s.t * 30 + i * 3) * tremble * 0.7;
    }

    // Hurt decay
    s.hurt = lerp(s.hurt, 0, 0.02);

    // Spring to home (weaker when hurt, so they fly further)
    const homeK = s.hurt > 0.3 ? 0.03 : 0.09;
    s.vx += (d.hx - s.px) * homeK;
    s.vy += (d.hy - s.py) * homeK;
    s.vx *= 0.83; s.vy *= 0.83;
    s.px += s.vx; s.py += s.vy;
    s.px = clamp(s.px, d.w * 0.5, CW - d.w * 0.5);
    s.py = clamp(s.py, d.h * 0.5 + 8, CH - d.h * 0.5 - 8);

    // Decay emotions
    s.joy  = lerp(s.joy,  0, 0.011);
    s.fear = lerp(s.fear, Math.max(0, s.cursorFear * 0.5), 0.03);
    s.surp = lerp(s.surp, 0, 0.02);
    s.shy  = lerp(s.shy, isShy ? 0.88 : 0, 0.08);

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
    if (s.fear > 0.3 || s.cursorFear > 0.3) {
      const f = Math.max(s.fear, s.cursorFear);
      tSx = lerp(tSx, 0.85, f * 0.5);
      tSy = lerp(tSy, 1.22, f * 0.5);
    }
    // Hurt squash
    if (s.hurt > 0.2) {
      tSx = lerp(tSx, 1.4, s.hurt * 0.6);
      tSy = lerp(tSy, 0.6, s.hurt * 0.6);
    }
    s.sqx.to(tSx); s.sqy.to(tSy);

    // Rotation - more violent when hurt or scared
    let tRot = d.rot0 + s.vx * 0.022;
    if (s.cursorFear > 0.2) tRot += Math.sin(s.t * 20) * s.cursorFear * 0.06;
    if (s.hurt > 0.2) tRot += Math.sin(s.t * 25) * s.hurt * 0.15;
    s.rot.to(tRot);

    // Pupil tracking - look away from cursor when scared
    const upP = (pu: PupilState, ox: number) => {
      const ex = s.px + ox, ey = s.py + d.exY;
      const edx = mx - ex, edy = my - ey;
      const ea = Math.atan2(edy, edx);
      const ed = clamp(Math.hypot(edx, edy), 0, 90) / 90;
      const mp = d.eR * 0.46;
      let tpx = Math.cos(ea) * ed * mp;
      let tpy = Math.sin(ea) * ed * mp;

      // Look AWAY from cursor when scared
      if (s.cursorFear > 0.3) {
        tpx = lerp(tpx, -tpx * 0.8, s.cursorFear);
        tpy = lerp(tpy, -tpy * 0.8, s.cursorFear);
      }
      if (s.shy > 0.3) { tpx *= (1 - s.shy * 0.8); tpy = lerp(tpy, mp * 0.5, s.shy * 0.8); }
      // When hurt, pupils go to random positions (dazed)
      if (s.hurt > 0.4) {
        tpx = Math.sin(s.t * 12) * mp * s.hurt;
        tpy = Math.cos(s.t * 15) * mp * s.hurt;
      }

      pu.vx += (tpx - pu.x) * 0.12; pu.vy += (tpy - pu.y) * 0.12;
      pu.vx *= 0.72; pu.vy *= 0.72;
      pu.x += pu.vx; pu.y += pu.vy;
    };
    upP(s.pL, -d.exX); upP(s.pR, d.exX);

    // Mouth
    let ts = 0.5, to = 0;
    if (s.joy > 0.1) { ts = lerp(ts, 1, s.joy); to = lerp(to, 0.55, s.joy); }
    if (s.fear > 0.1 || s.cursorFear > 0.1) {
      const f = Math.max(s.fear, s.cursorFear);
      ts = lerp(ts, -0.2, f); // Frown when scared
      to = lerp(to, 0.6, f);  // Open mouth in fear
    }
    if (s.shy > 0.1) ts = lerp(ts, 0.2, s.shy);
    if (s.surp > 0.1) { ts = 0; to = lerp(to, 1, s.surp); }
    if (isShy) ts = lerp(ts, 0.2, 0.7);
    // Hurt: wavy frown
    if (s.hurt > 0.3) {
      ts = lerp(ts, -0.5, s.hurt);
      to = lerp(to, 0.8, s.hurt);
    }
    s.mSmile.to(ts); s.mOpen.to(to);

    // Eyebrow
    let tb = 0;
    if (s.fear > 0.1 || s.cursorFear > 0.2) tb = lerp(tb, -0.7, Math.max(s.fear, s.cursorFear));
    if (s.surp > 0.1) tb = lerp(tb, 0.9, s.surp);
    if (s.joy > 0.1) tb = lerp(tb, 0.3, s.joy);
    if (isShy) tb = lerp(tb, -0.28, 0.6);
    if (s.hurt > 0.2) tb = lerp(tb, -0.9, s.hurt);
    s.brow.to(tb);

    // Blush
    s.blush.to(Math.max(s.joy * 0.55, s.shy * 0.9, s.hurt * 0.4));

    // Eye openness
    let tOpen = 1;
    if (s.shy > 0.1) tOpen = lerp(tOpen, 0.02, s.shy);
    if (s.fear > 0.1 || s.cursorFear > 0.2) tOpen = lerp(tOpen, 1.55, Math.max(s.fear, s.cursorFear)); // Wide eyes when scared
    if (s.joy > 0.1) tOpen = lerp(tOpen, 0.7, s.joy);
    if (s.hurt > 0.5) tOpen = lerp(tOpen, 0.15, s.hurt); // Squint when hurt

    // Blinking
    s.blinkT++;
    if (!s.blinking && s.blinkT > d.blinkInt + Math.random() * 130 && s.hurt < 0.3) {
      s.blinking = true; s.blinkT = 0; s.blinkV = 1;
    }
    if (s.blinking) { s.blinkV -= 0.25; if (s.blinkV < -0.8) { s.blinking = false; s.blinkV = 1; } }
    s.eyeOpen.to(clamp(tOpen * Math.max(0, s.blinkV), 0, 1.65));
  });

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
   Draw X-Eyes (when hurt)
   ═══════════════════════════════════════════════════ */
function drawXEye(ctx: CanvasRenderingContext2D, ex: number, ey: number, R: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = R * 0.22;
  ctx.lineCap = 'round';
  const s = R * 0.55;
  ctx.beginPath();
  ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey + s);
  ctx.moveTo(ex + s, ey - s); ctx.lineTo(ex - s, ey + s);
  ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Draw Sweat Drop (when scared by cursor)
   ═══════════════════════════════════════════════════ */
function drawSweat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  if (opacity < 0.05) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = 'rgba(120, 180, 255, 0.7)';
  ctx.beginPath();
  // Teardrop shape
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.7, y, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.7, y, x, y - size);
  ctx.fill();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Draw Hit Message (floating text on canvas)
   ═══════════════════════════════════════════════════ */
function drawHitMsg(ctx: CanvasRenderingContext2D, st: AnimState) {
  if (st.hitMsgOpacity < 0.02) return;

  ctx.save();
  ctx.globalAlpha = st.hitMsgOpacity;
  ctx.font = 'bold 16px "Inter Variable", Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeText(st.hitMsg, st.hitMsgX, st.hitMsgY);

  // Fill
  ctx.fillStyle = '#ff4444';
  ctx.fillText(st.hitMsg, st.hitMsgX, st.hitMsgY);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   Canvas Drawing
   ═══════════════════════════════════════════════════ */
function drawEye(
  ctx: CanvasRenderingContext2D, d: ShapeDef, s: ShapeState,
  ex: number, ey: number, R: number, pu: PupilState,
) {
  // If hurt enough, draw X-eyes
  if (s.hurt > 0.5) {
    drawXEye(ctx, ex, ey, R);
    return;
  }

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

  // Pupil - smaller when scared (dilated = wide, but tiny pupil = fear)
  const pupilScale = s.cursorFear > 0.3 ? lerp(1, 0.65, s.cursorFear) : 1;

  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(ppx, ppy, pr * pupilScale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fill();

  // Iris ring
  ctx.beginPath(); ctx.arc(ppx, ppy, pr * 0.5 * pupilScale, 0, Math.PI * 2);
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
    // Flash red when hurt
    if (s.hurt > 0.3) {
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20 * s.hurt;
    } else {
      ctx.shadowColor = d.col;
      ctx.shadowBlur = 16;
    }
    const gr = ctx.createLinearGradient(-d.w * 0.5, -d.h * 0.5, d.w * 0.4, d.h * 0.4);
    if (s.hurt > 0.3) {
      // Flash red overlay when hurt
      const hurtCol = `rgba(255, ${Math.floor(100 - s.hurt * 60)}, ${Math.floor(100 - s.hurt * 60)}, ${s.hurt * 0.4})`;
      gr.addColorStop(0, hurtCol);
      gr.addColorStop(0.5, d.col);
      gr.addColorStop(1, d.col2);
    } else {
      gr.addColorStop(0, d.col);
      gr.addColorStop(1, d.col2);
    }
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
      ctx.fillStyle = s.hurt > 0.3 ? '#ff6666' : '#ff99bb';
      ctx.beginPath();
      ctx.ellipse(-spX * 0.88, spY + eR * 1.35, eR * 1.08, eR * 0.48, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(spX * 0.88, spY + eR * 1.35, eR * 1.08, eR * 0.48, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sweat drops when cursor is near
    if (s.cursorFear > 0.25) {
      const sweatBob = Math.sin(s.t * 4) * 2;
      drawSweat(ctx, spX + eR * 1.3, spY - eR * 0.5 + sweatBob, 4 + s.cursorFear * 3, s.cursorFear * 0.8);
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

    if (s.hurt > 0.4) {
      // Wavy zigzag mouth when hurt
      ctx.beginPath();
      const mw = eR * 1.2;
      const segs = 6;
      for (let j = 0; j <= segs; j++) {
        const lx = -mw + (j / segs) * mw * 2;
        const ly = my2 + Math.sin(j * 2 + s.t * 8) * eR * 0.3 * s.hurt;
        if (j === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    } else if (op > 0.08) {
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

  // Hit message
  drawHitMsg(ctx, st);
}

/* ═══════════════════════════════════════════════════
   Speech Bubble Content (Lucide icons)
   ═══════════════════════════════════════════════════ */
function getBubbleContent(expr: Expression) {
  const ic = 'w-4 h-4 shrink-0';
  switch (expr) {
    case 'typing-password': return { icon: <EyeOff className={`${ic} text-navy-600 dark:text-navy-300`} />,       text: 'No miramos! Prometido...' };
    case 'typing-email':    return { icon: <Eye className={`${ic} text-navy-600 dark:text-navy-300`} />,           text: 'Hmm, dejame ver...' };
    case 'hover-button':    return { icon: <Zap className={`${ic} text-navy-600 dark:text-navy-300`} />,           text: 'Vamos, entra!' };
    case 'error':           return { icon: <AlertTriangle className={`${ic} text-amber-400`} />,  text: 'Intenta de nuevo!' };
    case 'success':         return { icon: <Check className={`${ic} text-green-400`} />,          text: 'Bienvenido!' };
    case 'scared':          return { icon: <Shield className={`${ic} text-amber-400`} />,         text: 'Ay, tranquilo...' };
    case 'angry':           return { icon: <Skull className={`${ic} text-red-400`} />,            text: 'Ya basta!' };
    default:                return { icon: <LogIn className={`${ic} text-navy-600 dark:text-navy-300`} />,         text: 'Bienvenido de vuelta!' };
  }
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function ShapesLogin({ mousePos, expression }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AnimState>(createAnimState());
  const mouseRef = useRef(mousePos);
  const exprRef = useRef(expression);
  const prevExprRef = useRef(expression);

  // Speech bubble
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Update refs without re-renders
  useEffect(() => { mouseRef.current = mousePos; }, [mousePos]);

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

  // Handle canvas click for hit detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CW / rect.width);
    const my = (e.clientY - rect.top) * (CH / rect.height);
    handleHit(stateRef.current, mx, my);
  };

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

      update(stateRef.current, mx, my, exprRef.current);
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

      {/* Canvas - clickable for hit */}
      <canvas
        ref={canvasRef}
        className="relative z-10 w-full max-w-[320px] h-auto cursor-pointer"
        style={{ aspectRatio: `${CW} / ${CH}` }}
        onMouseDown={handleCanvasClick}
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
          No nos hagas daño
        </span>
        <Sparkles className="w-4 h-4 text-navy-400/60" />
      </div>
    </div>
  );
}
