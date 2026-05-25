import React, { useEffect, useRef, useState } from 'react';
import { Boid, Predator, Vector2D } from './BoidSimulation';
import { PresetConfig, NamedBird } from '../types';

interface Feather {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 1 down to 0
  decay: number;
  rotation: number;
  rotSpeed: number;
}

interface MurmurationCanvasProps {
  config: PresetConfig;
  mouseMode: 'attract' | 'repel' | 'none';
  showAura: boolean;
  namedBirds: NamedBird[];
  battleRoyaleActive: boolean;
  onBattleRoyaleWinner?: (winnerName: string) => void;
  onRemainingNamedBirdsCount?: (count: number) => void;
}

export const MurmurationCanvas: React.FC<MurmurationCanvasProps> = ({
  config,
  mouseMode,
  showAura,
  namedBirds,
  battleRoyaleActive,
  onBattleRoyaleWinner,
  onRemainingNamedBirdsCount
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Maintain physics properties in refs for 60fps rendering speed
  const boidsRef = useRef<Boid[]>([]);
  const predatorRef = useRef<Predator | null>(null);
  const mousePosRef = useRef<Vector2D | null>(null);
  const configRef = useRef<PresetConfig>(config);
  const mouseModeRef = useRef<'attract' | 'repel' | 'none'>(mouseMode);
  
  // Custom interactive refs
  const namedBirdsRef = useRef<NamedBird[]>(namedBirds);
  const battleRoyaleActiveRef = useRef<boolean>(battleRoyaleActive);
  const feathersRef = useRef<Feather[]>([]);
  const winnerDeclaredRef = useRef<boolean>(false);

  // Shockwave clicks
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; speed: number; opacity: number }[]>([]);

  // Helper to re-map names onto a subset of the active boids list
  const remapNames = (boids: Boid[], list: NamedBird[]) => {
    // Clear previous designations
    boids.forEach(b => {
      b.customName = null;
      b.customColor = null;
    });
    // Overlay new names
    list.forEach((nb, idx) => {
      if (boids[idx]) {
        boids[idx].customName = nb.name;
        boids[idx].customColor = nb.color;
      }
    });
  };

  // Synchronize incoming state props to references
  useEffect(() => {
    configRef.current = config;
    mouseModeRef.current = mouseMode;
    namedBirdsRef.current = namedBirds;
    battleRoyaleActiveRef.current = battleRoyaleActive;

    if (!battleRoyaleActive) {
      winnerDeclaredRef.current = false;
    }

    const currentCount = boidsRef.current.length;
    const targetCount = config.boidCount;

    if (canvasRef.current) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      if (currentCount < targetCount) {
        for (let i = currentCount; i < targetCount; i++) {
          const rx = width * 0.15 + Math.random() * (width * 0.7);
          const ry = height * 0.15 + Math.random() * (height * 0.7);
          boidsRef.current.push(new Boid(rx, ry, i));
        }
      } else if (currentCount > targetCount) {
        boidsRef.current.splice(targetCount);
      }
    }

    // Always re-apply names
    remapNames(boidsRef.current, namedBirds);
  }, [config, mouseMode, namedBirds, battleRoyaleActive]);

  // Handle canvas container resizing observers
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;

        // Initialize boids
        if (boidsRef.current.length === 0) {
          boidsRef.current = [];
          for (let i = 0; i < configRef.current.boidCount; i++) {
            const rx = width * 0.15 + Math.random() * (width * 0.7);
            const ry = height * 0.15 + Math.random() * (height * 0.7);
            boidsRef.current.push(new Boid(rx, ry, i));
          }
          remapNames(boidsRef.current, namedBirdsRef.current);
        }

        if (configRef.current.hasPredator && !predatorRef.current) {
          predatorRef.current = new Predator(width / 2, height / 3);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Spawn feather explosion helper
  const spawnFeathers = (x: number, y: number, color: string) => {
    const featherCount = 7 + Math.floor(Math.random() * 6);
    for (let i = 0; i < featherCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.2;
      feathersRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.3, // slight gravity drop
        color,
        size: 2.5 + Math.random() * 3.5,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: -0.05 + Math.random() * 0.1
      });
    }
  };

  // Primary requestAnimationFrame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const fpsLimit = 60;
    const interval = 1000 / fpsLimit;
    let then = lastTime;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      const elapsed = now - then;

      if (elapsed < interval) {
        return;
      }
      then = now - (elapsed % interval);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const activeConfig = configRef.current;
      const activeMouseMode = mouseModeRef.current;
      const isBRAActive = battleRoyaleActiveRef.current;

      let boids = boidsRef.current;

      // Realtime Collision Elimination in Battle Royale mode
      if (isBRAActive && boids.length > 1) {
        const killRadius = 14; 
        const toEliminate = new Set<number>();

        // Check pairs for clashing
        for (let i = 0; i < boids.length; i++) {
          const b1 = boids[i];
          if (toEliminate.has(b1.id)) continue;

          for (let j = i + 1; j < boids.length; j++) {
            const b2 = boids[j];
            if (toEliminate.has(b2.id)) continue;

            const d = b1.position.dist(b2.position);
            if (d < killRadius) {
              // Duel! Determine who survives.
              // Rule: Named birds have a huge advantage (92% win) against unnamed ones.
              // Two named birds or two unnamed birds have a 50/50 chance.
              let itemToKill: Boid;
              const hasB1Name = b1.customName !== null;
              const hasB2Name = b2.customName !== null;

              if (hasB1Name && !hasB2Name) {
                itemToKill = Math.random() < 0.92 ? b2 : b1;
              } else if (hasB2Name && !hasB1Name) {
                itemToKill = Math.random() < 0.92 ? b1 : b2;
              } else {
                itemToKill = Math.random() < 0.5 ? b1 : b2;
              }

              toEliminate.add(itemToKill.id);

              // Blast beautiful colored feathers
              spawnFeathers(
                itemToKill.position.x, 
                itemToKill.position.y, 
                itemToKill.customColor || activeConfig.boidColor
              );
            }
          }
        }

        if (toEliminate.size > 0) {
          boidsRef.current = boids.filter(b => !toEliminate.has(b.id));
          boids = boidsRef.current;
        }

        // Count surviving named birds
        const remainingNamed = boids.filter(b => b.customName !== null);
        if (onRemainingNamedBirdsCount) {
          onRemainingNamedBirdsCount(remainingNamed.length);
        }

        // Check if we have a winner
        if (remainingNamed.length === 1 && !winnerDeclaredRef.current && namedBirdsRef.current.length > 1) {
          winnerDeclaredRef.current = true;
          if (onBattleRoyaleWinner && remainingNamed[0].customName) {
            onBattleRoyaleWinner(remainingNamed[0].customName);
          }
        }
      }

      // Draw background sky gradient (Foggy Baker Street Style grey-whites)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, activeConfig.bgColorStart);
      skyGrad.addColorStop(1, activeConfig.bgColorEnd);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Vignette Overlay
      const vignetteGrad = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.35,
        width / 2, height / 2, Math.max(width, height) * 0.95
      );
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);

      // Draft/sketch borders gridlines
      ctx.strokeStyle = 'rgba(58, 46, 36, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 90;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Shockwaves
      shockwavesRef.current = shockwavesRef.current.filter(wave => {
        wave.radius += wave.speed;
        wave.opacity -= 0.015;

        if (wave.opacity > 0 && wave.radius < wave.maxRadius) {
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(164, 142, 113, ${wave.opacity})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Apply panic push force
          const waveCenter = new Vector2D(wave.x, wave.y);
          boids.forEach(b => {
            const d = b.position.dist(waveCenter);
            if (d < wave.radius && d > wave.radius - 40) {
              const push = b.position.copy().sub(waveCenter).normalize();
              push.mult(activeConfig.maxSpeed * 2.8 * wave.opacity);
              b.applyForce(push);
            }
          });
          return true;
        }
        return false;
      });

      // Update and Draw Floating feathers particles
      feathersRef.current = feathersRef.current.filter(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.97; // smooth friction
        f.vy *= 0.97;
        f.rotation += f.rotSpeed;
        f.life -= f.decay;

        if (f.life > 0) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);
          ctx.fillStyle = f.color;
          ctx.globalAlpha = f.life;

          // Draw minimalist feather particle leaf silhouette
          ctx.beginPath();
          ctx.ellipse(0, 0, f.size * 1.5, f.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
          return true;
        }
        return false;
      });
      ctx.globalAlpha = 1.0; // Reset alpha

      const mousePos = mousePosRef.current;

      // Draw active trails behind starlings
      const trailLenMultiplier = activeConfig.trailLength;
      boids.forEach(b => {
        if (b.history.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(b.history[0].x, b.history[0].y);
        for (let i = 1; i < b.history.length; i++) {
          ctx.lineTo(b.history[i].x, b.history[i].y);
        }
        ctx.strokeStyle = `${b.customColor || activeConfig.boidColor}26`; // Soft transparency
        ctx.lineWidth = 0.85;
        ctx.stroke();
      });

      // Update and Draw individual birds
      boids.forEach(b => {
        b.runFlockRules(boids, activeConfig, width, height, mousePos, activeMouseMode, null);
        const maxHistory = Math.round(trailLenMultiplier * 15);
        b.update(activeConfig, maxHistory);

        // Render individual bird layout
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        const heading = Math.atan2(b.velocity.y, b.velocity.x);
        ctx.rotate(heading);

        const side = b.customName ? 8.5 : 6.5; // Named birds are slightly larger for importance visualization
        const wingFlap = Math.sin(b.flapPhase) * 6;

        ctx.strokeStyle = b.customColor || activeConfig.boidColor;
        ctx.lineWidth = 1.0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';

        // Feather sketch outline
        ctx.beginPath();
        ctx.moveTo(side, 0);
        ctx.lineTo(-side, -side / 2 + wingFlap * 0.4);
        ctx.lineTo(-side * 0.4, 0);
        ctx.lineTo(-side, side / 2 - wingFlap * 0.4);
        ctx.closePath();
        
        if (b.customColor) {
          ctx.fillStyle = b.customColor;
          ctx.fill();
        } else {
          ctx.stroke();
        }

        ctx.restore();

        // If named bird, draw hovering name text badge above
        if (b.customName) {
          ctx.save();
          
          // Draw a tiny pointer indicator line to the bird
          ctx.strokeStyle = b.customColor || '#d8ab6c';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.position.x, b.position.y - 12);
          ctx.lineTo(b.position.x, b.position.y - 22);
          ctx.stroke();

          // Render high contrast background banner block for text compliance
          const txt = b.customName;
          ctx.font = 'bold 10px "JetBrains Mono", Courier, monospace';
          const txtWidth = ctx.measureText(txt).width;
          const bgW = txtWidth + 14;
          const bgH = 17;
          const bgX = b.position.x - bgW / 2;
          const bgY = b.position.y - 39;

          ctx.fillStyle = '#1a1411';
          ctx.strokeStyle = b.customColor || '#d8ab6c';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bgX, bgY, bgW, bgH, 3);
          ctx.fill();
          ctx.stroke();

          // Render name text in gold/boid color
          ctx.fillStyle = b.customColor || '#f3e6cf';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(txt, b.position.x, b.position.y - 30);

          ctx.restore();
        }
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showAura, onBattleRoyaleWinner, onRemainingNamedBirdsCount]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = new Vector2D(x, y);
  };

  const handleMouseLeave = () => {
    mousePosRef.current = null;
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    shockwavesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: 260,
      speed: 6.0,
      opacity: 1.0
    });
  };

  return (
    <div id="simulation-viewport" ref={containerRef} className="relative w-full h-full cursor-default overflow-hidden select-none">
      <canvas
        id="murmuration-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseClick}
        className="block w-full h-full"
      />
    </div>
  );
};
