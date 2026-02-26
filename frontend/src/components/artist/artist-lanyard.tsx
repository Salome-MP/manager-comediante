/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RigidBodyProps,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */
interface ArtistLanyardProps {
  artistName: string;
  artistImage?: string;
  accentColor?: string;
  tagline?: string;
}

/* ═══════════════════════════════════════════
   Card Texture (512 × 768)
   ═══════════════════════════════════════════ */
const TW = 512;
const TH = 768;

function drawCardFront(
  ctx: CanvasRenderingContext2D,
  name: string,
  accent: string,
  tagline?: string,
  photo?: HTMLImageElement,
) {
  const W = TW, H = TH;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.5, '#13111f');
  bg.addColorStop(1, '#0a0914');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent glow at top
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
  glow.addColorStop(0, accent + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.4);

  // Top border line
  const lineGr = ctx.createLinearGradient(40, 0, W - 40, 0);
  lineGr.addColorStop(0, 'transparent');
  lineGr.addColorStop(0.2, accent);
  lineGr.addColorStop(0.8, accent);
  lineGr.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGr;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 50);
  ctx.lineTo(W - 40, 50);
  ctx.stroke();

  // "COMEDIANTES.COM" header
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMEDIANTES.COM', W / 2, 30);

  // "ARTISTA OFICIAL"
  ctx.fillStyle = accent;
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.fillText('ARTISTA OFICIAL', W / 2, 70);

  // Photo circle
  const photoR = 72;
  const cx = W / 2, cy = 175;

  if (photo) {
    ctx.save();
    // Ring
    ctx.beginPath();
    ctx.arc(cx, cy, photoR + 4, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clip + draw photo
    ctx.beginPath();
    ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
    ctx.clip();
    const imgA = photo.width / photo.height;
    const sz = photoR * 2;
    let dw: number, dh: number;
    if (imgA > 1) { dh = sz; dw = sz * imgA; }
    else { dw = sz; dh = sz / imgA; }
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  } else {
    // Placeholder circle
    ctx.beginPath();
    ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
    ctx.fillStyle = '#222240';
    ctx.fill();
    ctx.strokeStyle = accent + '60';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Simple silhouette
    ctx.fillStyle = '#3a3a60';
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 35, 32, 20, 0, Math.PI, 0, true);
    ctx.fill();
  }

  // Artist name
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 28;
  ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(name).width > W - 60 && fontSize > 16) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
  }
  ctx.fillText(name, W / 2, 285);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, 310);
  ctx.lineTo(W * 0.8, 310);
  ctx.stroke();

  // Tagline
  if (tagline) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'italic 13px Inter, system-ui, sans-serif';
    const maxW = W - 80;
    if (ctx.measureText(tagline).width > maxW) {
      const words = tagline.split(' ');
      let line = '';
      let y = 335;
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW) {
          ctx.fillText(line, W / 2, y);
          line = w;
          y += 18;
          if (y > 365) break;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, W / 2, y);
    } else {
      ctx.fillText(tagline, W / 2, 335);
    }
  }

  // Bottom accent bar
  const barGr = ctx.createLinearGradient(60, 0, W - 60, 0);
  barGr.addColorStop(0, 'transparent');
  barGr.addColorStop(0.3, accent);
  barGr.addColorStop(0.7, accent);
  barGr.addColorStop(1, 'transparent');
  ctx.fillStyle = barGr;
  ctx.fillRect(60, H - 50, W - 120, 2);

  // Bottom text
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.fillText('comediantes.com', W / 2, H - 25);
}

function drawCardBack(ctx: CanvasRenderingContext2D, accent: string) {
  const W = TW, H = TH;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#17142e');
  bg.addColorStop(1, '#080710');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Giant "C" watermark
  ctx.fillStyle = accent + '10';
  ctx.font = 'bold 500px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', W / 2, H * 0.4);

  // Brand
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText('COMEDIANTES.COM', W / 2, H - 40);
}

/* ═══════════════════════════════════════════
   Band (3D inner component)
   ═══════════════════════════════════════════ */
interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  artistName: string;
  artistImage?: string;
  accentColor: string;
  tagline?: string;
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  artistName,
  artistImage,
  accentColor,
  tagline,
}: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: any = {
    type: 'dynamic' as RigidBodyProps['type'],
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  // Front texture
  const { frontCanvas, frontTexture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TW;
    c.height = TH;
    const ctx0 = c.getContext('2d')!;
    drawCardFront(ctx0, artistName, accentColor, tagline);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { frontCanvas: c, frontTexture: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back texture
  const backTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TW;
    c.height = TH;
    const ctx2 = c.getContext('2d')!;
    drawCardBack(ctx2, accentColor);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [accentColor]);

  // Band texture
  const bandTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 512;
    const ctx2 = c.getContext('2d')!;

    const gr = ctx2.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, accentColor);
    gr.addColorStop(0.5, accentColor + 'cc');
    gr.addColorStop(1, accentColor);
    ctx2.fillStyle = gr;
    ctx2.fillRect(0, 0, 64, 512);

    // Woven lines
    ctx2.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 512; y += 4) ctx2.fillRect(0, y, 64, 1);

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [accentColor]);

  // Load photo
  useEffect(() => {
    const ctx = frontCanvas.getContext('2d')!;
    if (artistImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawCardFront(ctx, artistName, accentColor, tagline, img);
        frontTexture.needsUpdate = true;
      };
      img.src = artistImage;
    }
  }, [artistName, artistImage, accentColor, tagline, frontCanvas, frontTexture]);

  // Card materials: [+x, -x, +y, -y, front(+z), back(-z)]
  const cardMaterials = useMemo(() => {
    const edge = new THREE.MeshPhysicalMaterial({
      color: '#1a1a2e',
      roughness: 0.3,
      metalness: 0.2,
    });
    const front = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      roughness: 0.7,
      metalness: 0.15,
    });
    const back = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      roughness: 0.8,
      metalness: 0.1,
    });
    return [edge, edge, edge, edge, front, back];
  }, [frontTexture, backTexture]);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([
      new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3(),
    ])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.05, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => { document.body.style.cursor = 'auto'; };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((r) => {
        if (!r.current.lerped) r.current.lerped = new THREE.Vector3().copy(r.current.translation());
        const cd = Math.max(0.1, Math.min(1, r.current.lerped.distanceTo(r.current.translation())));
        r.current.lerped.lerp(r.current.translation(), delta * (minSpeed + cd * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  const cardScale = 2.25;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type={'fixed' as RigidBodyProps['type']} />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? ('kinematicPosition' as RigidBodyProps['type']) : ('dynamic' as RigidBodyProps['type'])}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={cardScale}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            {/* Card body */}
            <mesh material={cardMaterials}>
              <boxGeometry args={[0.667, 1.0, 0.02]} />
            </mesh>

            {/* Metal clip arm */}
            <mesh position={[0, 0.72, 0]}>
              <boxGeometry args={[0.04, 0.44, 0.012]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.15} />
            </mesh>

            {/* Clip head */}
            <mesh position={[0, 0.96, 0]}>
              <boxGeometry args={[0.08, 0.04, 0.018]} />
              <meshStandardMaterial color="#a8a8a8" metalness={0.95} roughness={0.1} />
            </mesh>

            {/* Clip ring */}
            <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.025, 0.006, 8, 20]} />
              <meshStandardMaterial color="#b0b0b0" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[1000, 1000]}
          useMap
          map={bandTexture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
export default function ArtistLanyard({
  artistName,
  artistImage,
  accentColor = '#1B2A4A',
  tagline,
}: ArtistLanyardProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Canvas
        camera={{ position: [0, 0, 13], fov: 25 }}
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics
          gravity={[0, -40, 0]}
          timeStep={1 / 60}
        >
          <Band
            artistName={artistName}
            artistImage={artistImage}
            accentColor={accentColor}
            tagline={tagline}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
