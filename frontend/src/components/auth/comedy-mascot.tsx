'use client';

import { useState, useRef, useEffect } from 'react';

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

/* ──────────────────────────────────────────────
   Inline SVG icons for speech bubble
   ────────────────────────────────────────────── */
function IconEyeOff({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconRefresh({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconStar({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconCursor({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8L22 12L18 16" />
      <path d="M2 12H22" />
    </svg>
  );
}

function IconEye({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconTheater({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="9" r="1.5" fill="currentColor" />
      <circle cx="16" cy="9" r="1.5" fill="currentColor" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <rect x="2" y="3" width="20" height="18" rx="4" />
    </svg>
  );
}

function IconAlertTriangle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconFlame({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <path d="M12 23c-3.87 0-7-3.13-7-7 0-2.38 1.27-4.8 2.87-6.87C9.47 7.06 11 5.1 12 2c1 3.1 2.53 5.06 4.13 7.13C17.73 11.2 19 13.62 19 16c0 3.87-3.13 7-7 7z" />
    </svg>
  );
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconPencil({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Main mascot component
   ────────────────────────────────────────────── */
export default function ComedyMascot({
  mousePos,
  expression,
}: {
  mousePos: { x: number; y: number };
  expression: Expression;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [bodyLean, setBodyLean] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Random eye blink every 3-5s
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      timeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Pupil tracking + body lean
  useEffect(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxPupil = 8;
    const factor = Math.min(distance / 250, 1);

    setPupilOffset({
      x: (dx / (distance || 1)) * maxPupil * factor,
      y: (dy / (distance || 1)) * maxPupil * factor,
    });

    setBodyLean((dx / window.innerWidth) * 6);
  }, [mousePos]);

  const isPasswordMode = expression === 'typing-password';
  const isError = expression === 'error';
  const isSuccess = expression === 'success';
  const isHoverButton = expression === 'hover-button';
  const isTypingEmail = expression === 'typing-email';
  const isTypingName = expression === 'typing-name';
  const isScared = expression === 'scared';
  const isAngry = expression === 'angry';

  // Eye scale
  const getEyeScaleY = () => {
    if (isBlinking && !isPasswordMode) return 0.05;
    if (isPasswordMode) return 0.1;
    if (isScared) return 1.4;
    if (isAngry) return 0.6;
    if (isSuccess) return 0.3;
    if (isHoverButton) return 1.2;
    if (isTypingEmail || isTypingName) return 1.1;
    return 1;
  };
  const eyeScaleY = getEyeScaleY();

  // Pupil size
  const getPupilRadius = () => {
    if (isPasswordMode) return 0;
    if (isScared) return 3.5;
    if (isAngry) return 5;
    return 6.5;
  };
  const pupilR = getPupilRadius();

  // Mouth
  const getMouth = () => {
    if (isSuccess) return { d: 'M 82,155 Q 100,178 118,155', fill: '#0C1326', showTeeth: true, showTongue: true };
    if (isAngry) return { d: 'M 85,162 Q 92,155 100,158 Q 108,155 115,162', fill: 'none', showTeeth: true, showTongue: false };
    if (isScared) return { d: 'M 92,152 Q 92,166 100,166 Q 108,166 108,152 Q 108,166 100,166 Q 92,166 92,152 Z', fill: '#0C1326', showTeeth: false, showTongue: false };
    if (isError) return { d: 'M 84,160 L 90,157 L 96,161 L 102,156 L 108,160 L 114,157', fill: 'none', showTeeth: false, showTongue: false };
    if (isHoverButton) return { d: 'M 80,152 Q 100,176 120,152', fill: '#0C1326', showTeeth: true, showTongue: false };
    if (isPasswordMode) return { d: 'M 90,156 L 110,156', fill: 'none', showTeeth: false, showTongue: false };
    if (isTypingName) return { d: 'M 85,153 Q 100,168 115,153', fill: '#0C1326', showTeeth: true, showTongue: false };
    if (isTypingEmail) return { d: 'M 94,152 Q 100,160 106,152 Q 100,164 94,152', fill: '#0C1326', showTeeth: false, showTongue: false };
    return { d: 'M 85,153 Q 100,170 115,153', fill: '#0C1326', showTeeth: true, showTongue: false };
  };
  const mouth = getMouth();

  // Eyebrow transforms
  const getEyebrowTransform = (side: 'left' | 'right') => {
    const baseX = side === 'left' ? 80 : 120;
    if (isAngry) return `rotate(${side === 'left' ? 25 : -25}, ${baseX}, 100) translate(0, 4)`;
    if (isScared) return `rotate(${side === 'left' ? -20 : 20}, ${baseX}, 100) translate(0, -8)`;
    if (isError) return `rotate(${side === 'left' ? 20 : -20}, ${baseX}, 100) translate(0, 2)`;
    if (isSuccess) return `rotate(${side === 'left' ? -15 : 15}, ${baseX}, 100) translate(0, -5)`;
    if (isHoverButton) return `rotate(${side === 'left' ? -18 : 18}, ${baseX}, 100) translate(0, -6)`;
    if (isTypingEmail || isTypingName) return `rotate(${side === 'left' ? -5 : 5}, ${baseX}, 100) translate(0, -2)`;
    return `rotate(0, ${baseX}, 100)`;
  };

  // Blush
  const getBlush = () => {
    if (isAngry) return { radius: 14, opacity: 0.7, color: '#ef4444' };
    if (isScared) return { radius: 6, opacity: 0.1, color: '#f9a8d4' };
    if (isHoverButton) return { radius: 12, opacity: 0.55, color: '#f9a8d4' };
    if (isSuccess) return { radius: 13, opacity: 0.6, color: '#f9a8d4' };
    if (isError) return { radius: 10, opacity: 0.3, color: '#f9a8d4' };
    if (isTypingName) return { radius: 10, opacity: 0.35, color: '#f9a8d4' };
    return { radius: 9, opacity: 0.15, color: '#f9a8d4' };
  };
  const blush = getBlush();

  const faceTint = isAngry ? 0.25 : 0;

  // Arms
  const getLeftArm = () => {
    if (isSuccess) return { upper: 'M 62,200 Q 40,180 35,160', forearm: 'M 35,160 Q 28,145 32,135', handX: 32, handY: 132 };
    if (isHoverButton) return { upper: 'M 62,200 Q 42,178 38,158', forearm: 'M 38,158 Q 30,142 34,130', handX: 34, handY: 127 };
    if (isPasswordMode) return { upper: 'M 62,200 Q 55,185 60,170', forearm: 'M 60,170 Q 68,155 75,120', handX: 78, handY: 115 };
    if (isTypingEmail || isTypingName) return { upper: 'M 62,200 Q 48,195 42,210', forearm: 'M 42,210 Q 38,225 40,235', handX: 40, handY: 238 };
    if (isError) return { upper: 'M 62,200 Q 45,185 40,168', forearm: 'M 40,168 Q 38,150 50,100', handX: 52, handY: 96 };
    if (isScared) return { upper: 'M 62,200 Q 52,195 50,205', forearm: 'M 50,205 Q 48,218 55,228', handX: 57, handY: 230 };
    if (isAngry) return { upper: 'M 62,200 Q 50,195 48,210', forearm: 'M 48,210 Q 55,225 68,222', handX: 70, handY: 220 };
    return { upper: 'M 62,200 Q 48,210 42,225', forearm: 'M 42,225 Q 38,238 42,248', handX: 42, handY: 250 };
  };
  const getRightArm = () => {
    if (isSuccess) return { upper: 'M 138,200 Q 160,180 165,160', forearm: 'M 165,160 Q 172,145 168,135', handX: 168, handY: 132 };
    if (isHoverButton) return { upper: 'M 138,200 Q 158,178 162,158', forearm: 'M 162,158 Q 170,142 166,130', handX: 166, handY: 127 };
    if (isPasswordMode) return { upper: 'M 138,200 Q 145,185 140,170', forearm: 'M 140,170 Q 132,155 125,120', handX: 122, handY: 115 };
    if (isTypingEmail || isTypingName) return { upper: 'M 138,200 Q 155,185 160,168', forearm: 'M 160,168 Q 168,148 162,132', handX: 160, handY: 128 };
    if (isError) return { upper: 'M 138,200 Q 152,210 158,225', forearm: 'M 158,225 Q 162,238 158,248', handX: 158, handY: 250 };
    if (isScared) return { upper: 'M 138,200 Q 148,195 150,205', forearm: 'M 150,205 Q 152,218 145,228', handX: 143, handY: 230 };
    if (isAngry) return { upper: 'M 138,200 Q 150,195 152,210', forearm: 'M 152,210 Q 145,225 132,222', handX: 130, handY: 220 };
    return { upper: 'M 138,200 Q 152,210 158,225', forearm: 'M 158,225 Q 162,238 158,248', handX: 158, handY: 250 };
  };
  const leftArm = getLeftArm();
  const rightArm = getRightArm();

  const shadowScale = isSuccess ? 0.6 : isScared ? 0.85 : 1;
  const shadowOpacity = isSuccess ? 0.15 : 0.3;

  const getWrapperClass = () => {
    if (isSuccess) return 'animate-mascot-jump';
    if (isError) return 'animate-mascot-shake';
    if (isScared) return 'animate-mascot-tremble';
    if (isAngry) return 'animate-mascot-angry-pulse';
    return 'animate-mascot-breathe';
  };

  const getWrapperKey = () => {
    if (isError || isSuccess || isScared || isAngry) return expression + Date.now();
    return 'stable';
  };

  // Speech bubble text
  const getSpeechBubble = () => {
    if (isPasswordMode) return { icon: <IconEyeOff className="inline-block text-navy-600 dark:text-navy-300" />, text: 'No miro, prometido!' };
    if (isError) return { icon: <IconRefresh className="inline-block text-amber-400" />, text: 'Intenta de nuevo!' };
    if (isSuccess) return { icon: <IconCheck className="inline-block text-green-400" />, text: 'Bienvenido!' };
    if (isHoverButton) return { icon: <IconCursor className="inline-block text-navy-600 dark:text-navy-300" />, text: 'Dale click!' };
    if (isTypingName) return { icon: <IconPencil className="inline-block text-navy-600 dark:text-navy-300" />, text: 'Mucho gusto!' };
    if (isTypingEmail) return { icon: <IconEye className="inline-block text-navy-600 dark:text-navy-300" />, text: 'Hmm...' };
    if (isScared) return { icon: <IconAlertTriangle className="inline-block text-amber-400" />, text: 'Ay, tranquilo!' };
    if (isAngry) return { icon: <IconFlame className="inline-block text-red-400" />, text: 'Ya basta!' };
    return { icon: <IconTheater className="inline-block text-navy-600 dark:text-navy-300" />, text: 'Hola!' };
  };
  const speechBubble = getSpeechBubble();

  return (
    <div className="relative flex items-center justify-center">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-navy-400/20 animate-mascot-float"
            style={{
              width: `${8 + i * 4}px`,
              height: `${8 + i * 4}px`,
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className={getWrapperClass()} key={getWrapperKey()}>
        <svg
          ref={svgRef}
          viewBox="0 0 200 340"
          className="w-64 h-auto md:w-72 lg:w-80 drop-shadow-2xl"
          style={{
            transform: `rotate(${bodyLean}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <defs>
            <radialGradient id="faceGradient" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#9EB1CF" />
              <stop offset="70%" stopColor="#3A5A8C" />
              <stop offset="100%" stopColor="#162240" />
            </radialGradient>
            <radialGradient id="faceAngry" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#e0a0f0" />
              <stop offset="70%" stopColor="#a855f6" />
              <stop offset="100%" stopColor="#9333ea" />
            </radialGradient>
            <radialGradient id="noseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <linearGradient id="hatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1B2A4A" />
              <stop offset="100%" stopColor="#0C1326" />
            </linearGradient>
            <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1B2A4A" />
              <stop offset="100%" stopColor="#111A33" />
            </linearGradient>
            <linearGradient id="pantsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0C1326" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Ground shadow */}
          <ellipse
            cx="100" cy="325"
            rx={40 * shadowScale} ry={6 * shadowScale}
            fill="#0C1326"
            style={{ opacity: shadowOpacity, transition: 'all 0.3s ease' }}
          />

          {/* Legs */}
          <rect x="76" y="268" width="18" height="30" rx="8" fill="url(#pantsGradient)" />
          <rect x="106" y="268" width="18" height="30" rx="8" fill="url(#pantsGradient)" />
          <ellipse cx="82" cy="302" rx="18" ry="8" fill="#dc2626" />
          <ellipse cx="72" cy="301" rx="6" ry="5" fill="#ef4444" />
          <ellipse cx="118" cy="302" rx="18" ry="8" fill="#dc2626" />
          <ellipse cx="128" cy="301" rx="6" ry="5" fill="#ef4444" />

          {/* Torso */}
          <path
            d="M 65,195 Q 60,220 65,260 Q 75,275 100,278 Q 125,275 135,260 Q 140,220 135,195 Q 120,185 100,183 Q 80,185 65,195 Z"
            fill="url(#shirtGradient)"
          />
          <polygon
            points="100,210 103,218 112,219 106,224 108,233 100,228 92,233 94,224 88,219 97,218"
            fill="#fbbf24" opacity="0.9"
          />

          {/* Bow tie */}
          <polygon points="85,190 100,197 100,186" fill="#fbbf24" />
          <polygon points="115,190 100,197 100,186" fill="#f59e0b" />
          <circle cx="100" cy="192" r="3.5" fill="#fbbf24" />

          {/* Left arm */}
          <g style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <path d={leftArm.upper} fill="none" stroke="#1B2A4A" strokeWidth="14" strokeLinecap="round" style={{ transition: 'd 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <path d={leftArm.forearm} fill="none" stroke="#3A5A8C" strokeWidth="12" strokeLinecap="round" style={{ transition: 'd 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <circle cx={leftArm.handX} cy={leftArm.handY} r="10" fill="#9EB1CF" style={{ transition: 'cx 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), cy 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <circle cx={leftArm.handX - 5} cy={leftArm.handY - 6} r="4" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
            <circle cx={leftArm.handX + 1} cy={leftArm.handY - 8} r="4" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
            <circle cx={leftArm.handX + 7} cy={leftArm.handY - 5} r="3.5" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
          </g>

          {/* Right arm */}
          <g
            style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            className={(isTypingEmail || isTypingName) ? 'animate-mascot-wave' : undefined}
          >
            <path d={rightArm.upper} fill="none" stroke="#1B2A4A" strokeWidth="14" strokeLinecap="round" style={{ transition: 'd 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <path d={rightArm.forearm} fill="none" stroke="#3A5A8C" strokeWidth="12" strokeLinecap="round" style={{ transition: 'd 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <circle cx={rightArm.handX} cy={rightArm.handY} r="10" fill="#9EB1CF" style={{ transition: 'cx 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), cy 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <circle cx={rightArm.handX + 5} cy={rightArm.handY - 6} r="4" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
            <circle cx={rightArm.handX - 1} cy={rightArm.handY - 8} r="4" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
            <circle cx={rightArm.handX - 7} cy={rightArm.handY - 5} r="3.5" fill="#9EB1CF" style={{ transition: 'cx 0.4s ease, cy 0.4s ease' }} />
          </g>

          {/* Hat */}
          <ellipse cx="100" cy="68" rx="52" ry="8" fill="#3b0764" opacity="0.3" />
          <path d="M 55,72 Q 58,30 100,20 Q 142,30 145,72 Z" fill="url(#hatGradient)" stroke="#162240" strokeWidth="1" />
          <ellipse cx="100" cy="72" rx="48" ry="10" fill="#111A33" />
          <rect x="55" y="67" width="90" height="6" rx="3" fill="#fbbf24" opacity="0.8" />
          <polygon points="100,35 103,43 111,44 105,49 107,57 100,53 93,57 95,49 89,44 97,43" fill="#fbbf24" opacity="0.9" />

          {/* Face */}
          <circle
            cx="100" cy="125" r="55"
            fill={isAngry ? 'url(#faceAngry)' : 'url(#faceGradient)'}
            filter="url(#softShadow)"
            style={{ transition: 'fill 0.3s ease' }}
          />
          {faceTint > 0 && (
            <circle cx="100" cy="125" r="55" fill="#ef4444" opacity={faceTint} style={{ transition: 'opacity 0.3s ease' }} />
          )}

          {/* Ears */}
          <ellipse cx="48" cy="120" rx="10" ry="14" fill="#7691BC" />
          <ellipse cx="48" cy="120" rx="6" ry="9" fill="#9EB1CF" opacity="0.5" />
          <ellipse cx="152" cy="120" rx="10" ry="14" fill="#7691BC" />
          <ellipse cx="152" cy="120" rx="6" ry="9" fill="#9EB1CF" opacity="0.5" />

          {/* Blush */}
          <circle cx="70" cy="140" r={blush.radius} fill={blush.color} style={{ opacity: blush.opacity, transition: 'all 0.4s ease' }} />
          <circle cx="130" cy="140" r={blush.radius} fill={blush.color} style={{ opacity: blush.opacity, transition: 'all 0.4s ease' }} />

          {/* Angry vein marks */}
          {isAngry && (
            <>
              <g transform="translate(140, 80)">
                <path d="M 0,0 L 5,-2 L 3,3 L 8,1 L 5,5 L 10,4" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </g>
              <g transform="translate(50, 82)">
                <path d="M 10,0 L 5,-2 L 7,3 L 2,1 L 5,5 L 0,4" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              </g>
            </>
          )}

          {/* Scared sweat drops */}
          {isScared && (
            <>
              <g className="animate-mascot-sweat">
                <path d="M 55,95 Q 53,100 55,105 Q 57,100 55,95 Z" fill="#93c5fd" opacity="0.7" />
              </g>
              <g className="animate-mascot-sweat" style={{ animationDelay: '0.4s' }}>
                <path d="M 148,100 Q 146,105 148,110 Q 150,105 148,100 Z" fill="#93c5fd" opacity="0.6" />
              </g>
            </>
          )}

          {/* Angry steam */}
          {isAngry && (
            <>
              <g className="animate-mascot-steam" style={{ transformOrigin: '45px 100px' }}>
                <circle cx="42" cy="95" r="5" fill="white" opacity="0.4" />
                <circle cx="38" cy="88" r="4" fill="white" opacity="0.3" />
              </g>
              <g className="animate-mascot-steam" style={{ animationDelay: '0.5s', transformOrigin: '155px 100px' }}>
                <circle cx="158" cy="95" r="5" fill="white" opacity="0.4" />
                <circle cx="162" cy="88" r="4" fill="white" opacity="0.3" />
              </g>
            </>
          )}

          {/* Eyes */}
          <ellipse cx="82" cy="118" rx="14" ry={14 * eyeScaleY} fill="white" style={{ transition: 'ry 0.1s ease' }} />
          <circle cx={82 + pupilOffset.x * 0.8} cy={118 + pupilOffset.y * 0.5} r={pupilR} fill="#1e1b4b" style={{ transition: 'r 0.2s ease, cx 0.15s ease-out, cy 0.15s ease-out' }} />
          <circle cx={79 + pupilOffset.x * 0.6} cy={115 + pupilOffset.y * 0.3} r={isPasswordMode ? 0 : isScared ? 1.5 : 2.5} fill="white" style={{ transition: 'r 0.2s ease' }} />

          <ellipse cx="118" cy="118" rx="14" ry={14 * eyeScaleY} fill="white" style={{ transition: 'ry 0.1s ease' }} />
          <circle cx={118 + pupilOffset.x * 0.8} cy={118 + pupilOffset.y * 0.5} r={pupilR} fill="#1e1b4b" style={{ transition: 'r 0.2s ease, cx 0.15s ease-out, cy 0.15s ease-out' }} />
          <circle cx={115 + pupilOffset.x * 0.6} cy={115 + pupilOffset.y * 0.3} r={isPasswordMode ? 0 : isScared ? 1.5 : 2.5} fill="white" style={{ transition: 'r 0.2s ease' }} />

          {/* Angry eye details */}
          {isAngry && (
            <>
              <line x1="72" y1="112" x2="82" y2="116" stroke="#0C1326" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="128" y1="112" x2="118" y2="116" stroke="#0C1326" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Eyebrows */}
          <path d="M 68,102 Q 82,94 96,102" fill="none" stroke="#0C1326" strokeWidth={isAngry ? 4.5 : 3.5} strokeLinecap="round" transform={getEyebrowTransform('left')} style={{ transition: 'transform 0.3s ease' }} />
          <path d="M 104,102 Q 118,94 132,102" fill="none" stroke="#0C1326" strokeWidth={isAngry ? 4.5 : 3.5} strokeLinecap="round" transform={getEyebrowTransform('right')} style={{ transition: 'transform 0.3s ease' }} />

          {/* Clown nose */}
          <circle cx="100" cy="133" r="8" fill="url(#noseGlow)" />
          <circle cx="97" cy="130" r="2.5" fill="white" opacity="0.4" />

          {/* Mouth */}
          <path d={mouth.d} fill={mouth.fill} stroke="#0C1326" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.3s ease' }} />
          {mouth.showTeeth && !isAngry && (
            <rect x="93" y={isSuccess ? 158 : isHoverButton ? 155 : 156} width="14" height="7" rx="1.5" fill="white" opacity="0.95" style={{ transition: 'all 0.3s ease' }} />
          )}
          {isAngry && (
            <>
              <rect x="90" y="157" width="20" height="6" rx="1" fill="white" opacity="0.95" />
              <line x1="95" y1="157" x2="95" y2="163" stroke="#0C1326" strokeWidth="0.5" />
              <line x1="100" y1="157" x2="100" y2="163" stroke="#0C1326" strokeWidth="0.5" />
              <line x1="105" y1="157" x2="105" y2="163" stroke="#0C1326" strokeWidth="0.5" />
            </>
          )}
          {mouth.showTongue && (
            <ellipse cx="100" cy="168" rx="6" ry="4" fill="#f87171" opacity="0.8" />
          )}

          {/* Password mode — hands over eyes */}
          {isPasswordMode && (
            <g style={{ transition: 'opacity 0.3s ease' }}>
              <ellipse cx="80" cy="118" rx="20" ry="16" fill="#9EB1CF" />
              <ellipse cx="72" cy="110" rx="5" ry="7" fill="#9EB1CF" />
              <ellipse cx="80" cy="107" rx="5" ry="8" fill="#9EB1CF" />
              <ellipse cx="88" cy="107" rx="5" ry="8" fill="#9EB1CF" />
              <ellipse cx="95" cy="110" rx="4.5" ry="7" fill="#9EB1CF" />
              <ellipse cx="120" cy="118" rx="20" ry="16" fill="#9EB1CF" />
              <ellipse cx="105" cy="110" rx="4.5" ry="7" fill="#9EB1CF" />
              <ellipse cx="112" cy="107" rx="5" ry="8" fill="#9EB1CF" />
              <ellipse cx="120" cy="107" rx="5" ry="8" fill="#9EB1CF" />
              <ellipse cx="128" cy="110" rx="5" ry="7" fill="#9EB1CF" />
            </g>
          )}

          {/* Success sparkles */}
          {isSuccess && (
            <g className="animate-mascot-spin-slow" style={{ transformOrigin: '100px 170px' }}>
              <g className="animate-pulse">
                <polygon points="30,85 33,78 36,85 33,92" fill="#fbbf24" />
                <polygon points="26,85 33,82 40,85 33,88" fill="#fbbf24" />
              </g>
              <g className="animate-pulse" style={{ animationDelay: '0.3s' }}>
                <polygon points="165,88 168,81 171,88 168,95" fill="#fbbf24" />
                <polygon points="161,88 168,85 175,88 168,91" fill="#fbbf24" />
              </g>
              <g className="animate-pulse" style={{ animationDelay: '0.6s' }}>
                <polygon points="22,200 25,193 28,200 25,207" fill="#7691BC" />
                <polygon points="18,200 25,197 32,200 25,203" fill="#7691BC" />
              </g>
              <g className="animate-pulse" style={{ animationDelay: '0.9s' }}>
                <polygon points="172,195 175,188 178,195 175,202" fill="#7691BC" />
                <polygon points="168,195 175,192 182,195 175,198" fill="#7691BC" />
              </g>
              <g className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                <polygon points="100,12 104,2 108,12 104,22" fill="#fbbf24" />
                <polygon points="94,12 104,8 114,12 104,16" fill="#fbbf24" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Speech bubble */}
      <div
        className="absolute -top-2 left-0 md:left-4 lg:left-8 bg-surface-card dark:bg-white/10 backdrop-blur-sm shadow-md rounded-2xl px-4 py-2 border border-border-default dark:border-white/20 shadow-lg"
        style={{ transition: 'opacity 0.3s ease' }}
      >
        <p className="text-sm font-medium text-text-secondary whitespace-nowrap flex items-center gap-1.5">
          {speechBubble.icon} {speechBubble.text}
        </p>
        <div className="absolute -bottom-2 left-8 w-4 h-4 bg-surface-card dark:bg-white/10 border-b border-r border-border-default dark:border-white/20 rotate-45" />
      </div>
    </div>
  );
}
