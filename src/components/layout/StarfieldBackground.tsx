'use client';

import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  z: number;
  radius: number;
  alpha: number;
  drift: number;
  phase: number;
};

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let reducedMotion = reducedMotionQuery.matches;
    let lastTime = 0;

    const isMobile = () => window.innerWidth < 768;

    const getStarCount = () => {
      const density = Math.max(80, Math.min(190, Math.round((window.innerWidth * window.innerHeight) / 12500)));
      if (reducedMotion) {
        return Math.max(48, Math.round(density * 0.42));
      }

      return isMobile() ? Math.round(density * 0.58) : density;
    };

    const createStar = (nextWidth: number, nextHeight: number): Star => {
      const z = 0.25 + Math.random() * 1.05;

      return {
        x: Math.random() * nextWidth,
        y: Math.random() * nextHeight,
        z,
        radius: 0.45 + Math.random() * 1.1 * z,
        alpha: 0.2 + Math.random() * 0.75,
        drift: (Math.random() - 0.5) * 0.018,
        phase: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, reducedMotion ? 1 : 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: getStarCount() }, () => createStar(width, height));
    };

    const render = (time: number) => {
      const elapsed = Math.min(32, time - lastTime || 16);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      const hueShift = Math.sin(time * 0.00008) * 8;

      for (const star of stars) {
        const speed = reducedMotion ? 0.004 : 0.011;
        star.y += elapsed * speed * star.z;
        star.x += elapsed * star.drift * star.z;

        if (star.y > height + 24) {
          star.y = -24;
          star.x = Math.random() * width;
        }

        if (star.x < -24) {
          star.x = width + 24;
        }

        if (star.x > width + 24) {
          star.x = -24;
        }

        const twinkle = 0.72 + Math.sin(time * 0.0014 * star.z + star.phase) * 0.28;
        const alpha = Math.min(1, star.alpha * twinkle);
        const orbitX = Math.sin(time * 0.00006 + star.phase) * 8 * star.z;
        const orbitY = Math.cos(time * 0.00004 + star.phase) * 6 * star.z;

        context.beginPath();
        context.fillStyle = `hsla(${216 + hueShift}, 100%, ${78 + star.z * 10}%, ${alpha})`;
        context.arc(star.x + orbitX, star.y + orbitY, star.radius, 0, Math.PI * 2);
        context.fill();

        if (!reducedMotion && star.z > 0.95) {
          context.beginPath();
          context.fillStyle = `hsla(${258 + hueShift}, 100%, 78%, ${alpha * 0.2})`;
          context.arc(star.x + orbitX, star.y + orbitY, star.radius * 3.2, 0, Math.PI * 2);
          context.fill();
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      resize();
    };

    resize();
    animationFrameId = window.requestAnimationFrame(render);

    window.addEventListener('resize', resize);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.12),_transparent_28%),radial-gradient(circle_at_80%_12%,_rgba(139,92,246,0.12),_transparent_22%),linear-gradient(180deg,rgba(5,8,22,0.24)_0%,rgba(5,8,22,0.52)_55%,rgba(5,8,22,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.42)_0%,rgba(5,8,22,0.14)_18%,rgba(5,8,22,0.14)_82%,rgba(5,8,22,0.42)_100%)]" />
    </div>
  );
}