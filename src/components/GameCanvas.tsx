import React, { useRef, useEffect } from 'react';
import { LevelConfig, RoverState, SkinItem, WheelItem, LightItem, TrailItem } from '../types';

interface Particle {
  x: number;
  y: number;
  life: number;
  size: number;
  type: string;
}

interface RadarWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface GameCanvasProps {
  currentLevel: LevelConfig;
  rover: RoverState;
  skin: SkinItem;
  wheel: WheelItem;
  light: LightItem;
  trail: TrailItem;
  radarPulseTrigger: number;
  inLavaHazard?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentLevel,
  rover,
  skin,
  wheel,
  light,
  trail,
  radarPulseTrigger,
  inLavaHazard = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const radarWavesRef = useRef<RadarWave[]>([]);

  // Trigger radar ripple effect
  useEffect(() => {
    if (radarPulseTrigger > 0) {
      radarWavesRef.current.push({
        x: rover.x,
        y: rover.y,
        radius: 10,
        maxRadius: 280,
        alpha: 1.0,
      });
    }
  }, [radarPulseTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Translate camera centered on rover
      ctx.translate(canvas.width / 2 - rover.x, canvas.height / 2 - rover.y);

      // 1. Draw Biome Background
      ctx.fillStyle = currentLevel.bg;
      ctx.fillRect(0, 0, currentLevel.mapWidth, currentLevel.mapHeight);

      // Biome Terrain Decorators
      if (currentLevel.biome === 'basalt') {
        // Craters & rock formations
        ctx.fillStyle = 'rgba(8, 15, 30, 0.4)';
        ctx.beginPath();
        ctx.arc(900, 900, 180, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E67E22';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(450, 1200, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D35400';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(1700, 700, 220, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9E2A1B';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (currentLevel.biome === 'dunes') {
        // Dune ridges and wind ripples
        ctx.strokeStyle = 'rgba(230, 126, 34, 0.35)';
        ctx.lineWidth = 3;
        for (let i = 0; i < currentLevel.mapWidth; i += 120) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.bezierCurveTo(i + 80, 600, i - 60, 1400, i + 150, currentLevel.mapHeight);
          ctx.stroke();
        }
      } else if (currentLevel.biome === 'ice') {
        // Polar glacier vs volcanic caldera split
        ctx.fillStyle = 'rgba(77, 208, 225, 0.28)';
        ctx.fillRect(0, 0, currentLevel.mapWidth, 1500);

        ctx.fillStyle = 'rgba(255, 87, 34, 0.35)';
        ctx.fillRect(0, 1500, currentLevel.mapWidth, 1700);

        // Ice fissures
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, 300);
        ctx.lineTo(800, 700);
        ctx.lineTo(1300, 600);
        ctx.stroke();
      } else if (currentLevel.biome === 'summit') {
        // High-altitude starry sky & caldera terraces
        const now = Date.now() * 0.001;
        // Twinkling stars in thin upper Martian atmosphere
        ctx.fillStyle = '#FFFFFF';
        for (let s = 0; s < 120; s++) {
          const sx = (s * 311) % currentLevel.mapWidth;
          const sy = (s * 197) % currentLevel.mapHeight;
          const alpha = 0.4 + 0.5 * Math.sin(now + s);
          ctx.globalAlpha = alpha;
          ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.globalAlpha = 1.0;

        // Distant Earth in the night sky at (700, 500)
        ctx.fillStyle = '#1E88E5';
        ctx.beginPath();
        ctx.arc(700, 500, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(702, 498, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(77, 208, 225, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(700, 500, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Caldera elevation stepped contours
        ctx.strokeStyle = 'rgba(126, 87, 194, 0.4)';
        ctx.lineWidth = 3;
        for (let r = 500; r < 2800; r += 400) {
          ctx.beginPath();
          ctx.arc(1800, 1800, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Landing runway beacon lights
        ctx.fillStyle = '#00E5FF';
        for (let i = 400; i < 2600; i += 180) {
          ctx.beginPath();
          ctx.arc(i, 450, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- MOLTEN LAVA ZONES ---
      if (currentLevel.lavaZones && currentLevel.lavaZones.length > 0) {
        const time = Date.now() * 0.002;
        currentLevel.lavaZones.forEach((lz) => {
          // Deep molten base
          const grad = ctx.createRadialGradient(
            lz.x + lz.width / 2,
            lz.y + lz.height / 2,
            100,
            lz.x + lz.width / 2,
            lz.y + lz.height / 2,
            lz.width / 1.4
          );
          grad.addColorStop(0, '#FFD54F');
          grad.addColorStop(0.25, '#FF6D00');
          grad.addColorStop(0.65, '#DD2C00');
          grad.addColorStop(1, '#3E0900');

          ctx.fillStyle = grad;
          ctx.fillRect(lz.x, lz.y, lz.width, lz.height);

          // Molten magma crust cracks & veins
          ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
          ctx.lineWidth = 4;
          for (let v = 0; v < 12; v++) {
            const vy = lz.y + 150 + v * 160;
            ctx.beginPath();
            ctx.moveTo(lz.x + 20, vy + Math.sin(time + v) * 25);
            ctx.bezierCurveTo(
              lz.x + lz.width * 0.33,
              vy + Math.cos(time + v * 0.7) * 45,
              lz.x + lz.width * 0.66,
              vy - Math.sin(time + v * 0.5) * 45,
              lz.x + lz.width - 20,
              vy + Math.cos(time + v) * 25
            );
            ctx.stroke();
          }

          // Animated boiling magma bubbles
          for (let b = 0; b < 16; b++) {
            const bx = lz.x + ((b * 437 + 100) % (lz.width - 160)) + 80;
            const by = lz.y + ((b * 319 + 120) % (lz.height - 160)) + 80;
            const bPhase = (time * 1.5 + b * 0.8) % (Math.PI * 2);
            const bRad = 6 + Math.abs(Math.sin(bPhase)) * 14;

            ctx.fillStyle = 'rgba(255, 171, 0, 0.75)';
            ctx.beginPath();
            ctx.arc(bx, by, bRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFE082';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }

      // --- SAFE BASALT BRIDGES & PATHS ---
      if (currentLevel.lavaPaths && currentLevel.lavaPaths.length > 0) {
        currentLevel.lavaPaths.forEach((p) => {
          if (p.type === 'segment' && p.x1 !== undefined && p.y1 !== undefined && p.x2 !== undefined && p.y2 !== undefined) {
            const w = p.width || 110;
            const dx = p.x2 - p.x1;
            const dy = p.y2 - p.y1;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;

              // 1. Under-bridge shadow & volcanic rock foundation
              ctx.strokeStyle = '#0B0F15';
              ctx.lineWidth = w + 14;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(p.x1, p.y1);
              ctx.lineTo(p.x2, p.y2);
              ctx.stroke();

              // 2. Solid basalt stone roadway
              ctx.strokeStyle = '#1F2937';
              ctx.lineWidth = w;
              ctx.beginPath();
              ctx.moveTo(p.x1, p.y1);
              ctx.lineTo(p.x2, p.y2);
              ctx.stroke();

              // 3. Center paving lane
              ctx.strokeStyle = '#374151';
              ctx.lineWidth = w * 0.65;
              ctx.beginPath();
              ctx.moveTo(p.x1, p.y1);
              ctx.lineTo(p.x2, p.y2);
              ctx.stroke();

              // 4. Center lane dashed reflector
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
              ctx.lineWidth = 2;
              ctx.setLineDash([12, 14]);
              ctx.beginPath();
              ctx.moveTo(p.x1, p.y1);
              ctx.lineTo(p.x2, p.y2);
              ctx.stroke();
              ctx.setLineDash([]);

              // 5. Elevated safety guide beacons along both edges
              const halfW = w / 2 - 6;
              const step = 60;
              const count = Math.floor(len / step);
              for (let i = 0; i <= count; i++) {
                const px = p.x1 + (dx / len) * (i * step);
                const py = p.y1 + (dy / len) * (i * step);

                // Left edge beacon
                const lx = px + nx * halfW;
                const ly = py + ny * halfW;
                ctx.fillStyle = '#00E5FF';
                ctx.beginPath();
                ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Right edge beacon
                const rx = px - nx * halfW;
                const ry = py - ny * halfW;
                ctx.fillStyle = '#00E5FF';
                ctx.beginPath();
                ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else if (p.type === 'island' && p.cx !== undefined && p.cy !== undefined && p.radius !== undefined) {
            // Island foundation
            ctx.fillStyle = '#0B0F15';
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.radius + 8, 0, Math.PI * 2);
            ctx.fill();

            // Island basalt deck
            ctx.fillStyle = '#1F2937';
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#4B5563';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Inner hexagonal / circular paving slab
            ctx.fillStyle = '#374151';
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.radius * 0.72, 0, Math.PI * 2);
            ctx.fill();

            // Circular perimeter guide lights
            const numLights = 12;
            ctx.fillStyle = '#2ECC71';
            for (let l = 0; l < numLights; l++) {
              const ang = (l * Math.PI * 2) / numLights;
              const lx = p.cx + Math.cos(ang) * (p.radius - 8);
              const ly = p.cy + Math.sin(ang) * (p.radius - 8);
              ctx.beginPath();
              ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      }

      // Map boundary boundary fence
      ctx.strokeStyle = 'rgba(255, 87, 34, 0.6)';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, currentLevel.mapWidth - 20, currentLevel.mapHeight - 20);

      // 2. Trail Particles
      if (Math.abs(rover.speed) > 0.4 && trail.id !== 'none') {
        particlesRef.current.push({
          x: rover.x - Math.cos(rover.angle) * 16 + (Math.random() - 0.5) * 8,
          y: rover.y - Math.sin(rover.angle) * 16 + (Math.random() - 0.5) * 8,
          life: 1.0,
          size: Math.random() * 4 + 2,
          type: trail.id,
        });
      }

      // Lava hazard sparks & heat smoke
      if (inLavaHazard) {
        particlesRef.current.push({
          x: rover.x + (Math.random() - 0.5) * 32,
          y: rover.y + (Math.random() - 0.5) * 32,
          life: 1.0,
          size: Math.random() * 5 + 3,
          type: 'lava_spark',
        });
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= p.type === 'lava_spark' ? 0.05 : 0.035;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        if (p.type === 'lava_spark') {
          ctx.fillStyle = `rgba(255, ${Math.floor(p.life * 180 + 50)}, 0, ${p.life * 0.9})`;
        } else if (p.type === 'cyber') {
          ctx.fillStyle = `rgba(0, 229, 255, ${p.life * 0.75})`;
        } else {
          ctx.fillStyle = `rgba(230, 126, 34, ${p.life * 0.45})`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Radar Waves
      for (let i = radarWavesRef.current.length - 1; i >= 0; i--) {
        const rw = radarWavesRef.current[i];
        rw.radius += 5;
        rw.alpha = Math.max(0, 1 - rw.radius / rw.maxRadius);

        if (rw.alpha <= 0) {
          radarWavesRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(77, 208, 225, ${rw.alpha * 0.8})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rw.x, rw.y, rw.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Targets & Workshop Outposts
      currentLevel.targets.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);

        if (t.type === 'station') {
          // Workshop Base
          ctx.fillStyle = '#FF5722';
          ctx.fillRect(-22, -22, 44, 44);
          ctx.fillStyle = '#080F1E';
          ctx.fillRect(-12, -12, 24, 24);
          ctx.fillStyle = '#4DD0E1';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (t.type === 'sample') {
          // Mineral sample deposit
          ctx.fillStyle = t.collected ? 'rgba(46, 204, 113, 0.5)' : '#E67E22';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = t.collected ? '#2ECC71' : '#F1C40F';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (t.type === 'relay') {
          // Antenna relay station
          ctx.fillStyle = '#4DD0E1';
          ctx.fillRect(-18, -18, 36, 36);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(-18, -18, 36, 36);
        } else if (t.type === 'ice') {
          // Subsurface permafrost ice
          ctx.fillStyle = t.scanned ? '#2ECC71' : '#4DD0E1';
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
        } else if (t.type === 'settlement') {
          // Future human settlement site / Geodesic Colony Dome
          ctx.fillStyle = t.marked ? 'rgba(46, 204, 113, 0.45)' : 'rgba(155, 89, 182, 0.45)';
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = t.marked ? '#2ECC71' : '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Dome hexagonal structural struts
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.lineTo(20, 0);
          ctx.moveTo(0, -20);
          ctx.lineTo(0, 20);
          ctx.moveTo(-14, -14);
          ctx.lineTo(14, 14);
          ctx.moveTo(-14, 14);
          ctx.lineTo(14, -14);
          ctx.stroke();
        }

        // Radar proximity beacon circle
        ctx.strokeStyle = 'rgba(230, 126, 34, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.stroke();

        // Label above target
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(t.name, 0, -42);

        ctx.restore();
      });

      // 5. Rover Rendering
      if (inLavaHazard) {
        // Critical thermal overheat aura underneath the rover
        ctx.save();
        ctx.fillStyle = 'rgba(255, 61, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(rover.x, rover.y, 48 + Math.sin(Date.now() * 0.015) * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF3D00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(rover.x, rover.y);
      ctx.rotate(rover.angle);

      // Headlight Beam
      ctx.fillStyle = light.color;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(170, -55);
      ctx.lineTo(170, 55);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Chassis Body
      ctx.fillStyle = skin.color;
      ctx.fillRect(-24, -16, 48, 32);
      ctx.strokeStyle = '#080F1E';
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -16, 48, 32);

      // Rocker-Bogie Suspension Wheels (6 wheels)
      ctx.fillStyle = wheel.color;
      const wheelPositions = [
        { x: -18, y: -22 },
        { x: 0, y: -22 },
        { x: 18, y: -22 },
        { x: -18, y: 17 },
        { x: 0, y: 17 },
        { x: 18, y: 17 },
      ];
      wheelPositions.forEach((w) => {
        ctx.fillRect(w.x, w.y, 11, 6);
        ctx.fillStyle = wheel.rimColor;
        ctx.fillRect(w.x + 3, w.y + 1.5, 5, 3);
        ctx.fillStyle = wheel.color;
      });

      // Solar Panel Rows
      ctx.fillStyle = '#080F1E';
      ctx.fillRect(-20, -12, 40, 9);
      ctx.fillRect(-20, 3, 40, 9);

      // Solar dust overlay
      if (rover.dust > 5) {
        ctx.fillStyle = `rgba(158, 42, 27, ${Math.min(0.9, rover.dust / 110)})`;
        ctx.fillRect(-20, -12, 40, 9);
        ctx.fillRect(-20, 3, 40, 9);
      }

      // Camera Mast / Sensor Head
      ctx.fillStyle = light.color;
      ctx.beginPath();
      ctx.arc(16, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Antenna
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-24, -12);
      ctx.stroke();

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [currentLevel, rover, skin, wheel, light, trail]);

  return (
    <canvas
      ref={canvasRef}
      id="gameCanvas"
      className="absolute inset-0 z-0 block w-full h-full"
    />
  );
};
