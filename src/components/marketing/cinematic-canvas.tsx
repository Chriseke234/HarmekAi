"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

/**
 * Restrained atmospheric signal-network canvas for the HARMEK AI cinematic hero.
 * Renders floating turquoise light particles and delicate interconnected signal lines.
 * Automatically disables motion when the user prefers reduced motion.
 */
export function CinematicSignalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const isMobile = width < 768;
    const count = isMobile ? 18 : 42;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.18,
      radius: Math.random() * 1.6 + 0.7,
      alpha: Math.random() * 0.45 + 0.2,
    }));

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Subtle interconnected signal lines near the central luminous portal
      const maxDist = isMobile ? 95 : 135;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.16;
            ctx.strokeStyle = `rgba(103, 232, 249, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Luminous node particle
        ctx.fillStyle = `rgba(165, 243, 252, ${p.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReduced) {
        animId = window.requestAnimationFrame(drawFrame);
      }
    }

    drawFrame();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      if (prefersReduced) drawFrame();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
    />
  );
}
