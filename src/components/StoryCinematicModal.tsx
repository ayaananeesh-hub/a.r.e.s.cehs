import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { storyScenes } from '../data/gameData';

interface StoryCinematicModalProps {
  isOpen: boolean;
  onFinish: () => void;
  onSceneChange: (sceneText: string) => void;
}

export const StoryCinematicModal: React.FC<StoryCinematicModalProps> = ({
  isOpen,
  onFinish,
  onSceneChange,
}) => {
  const [currentScene, setCurrentScene] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scene = storyScenes[currentScene - 1];

  useEffect(() => {
    if (!isOpen) return;
    onSceneChange(scene.text);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 280;

    let animId: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        20,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 1.5
      );
      grad.addColorStop(0, '#101B2E');
      grad.addColorStop(1, '#050A14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant twinkling stars
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 87) % canvas.width);
        const sy = ((i * 53) % canvas.height);
        const alpha = 0.3 + 0.7 * Math.sin(t * 0.05 + i);
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1.0;

      // Central planetary / thematic body
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 - 15;
      const radius = 50 + currentScene * 4 + Math.sin(t * 0.03) * 3;

      // Glow halo
      const halo = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.5);
      halo.addColorStop(0, scene.color);
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Planet sphere
      const planetGrad = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      planetGrad.addColorStop(0, '#FFFFFF');
      planetGrad.addColorStop(0.3, scene.color);
      planetGrad.addColorStop(1, '#080F1E');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric ring
      ctx.strokeStyle = scene.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + radius * 0.2, radius * 1.6, radius * 0.45, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Title overlay on canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(scene.title, centerX, canvas.height - 25);

      t += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, currentScene, onSceneChange, scene]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentScene < storyScenes.length) {
      setCurrentScene((p) => p + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentScene > 1) {
      setCurrentScene((p) => p - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080F1E] p-4 backdrop-blur-md">
      <div className="max-w-4xl w-full h-full max-h-[620px] glass-panel rounded-2xl p-6 flex flex-col justify-between border-2 border-[#4DD0E1] relative overflow-hidden shadow-2xl">
        {/* Animated Canvas */}
        <div className="relative w-full h-64 md:h-80 bg-[#080F1E] rounded-xl overflow-hidden border border-[#4DD0E1]/40">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-3 left-3 bg-[#080F1E]/90 px-3 py-1 rounded-full text-xs font-orbitron font-bold text-[#4DD0E1] border border-[#4DD0E1]/40 shadow">
            SCENE {currentScene} / {storyScenes.length}
          </div>
        </div>

        {/* Narration Box */}
        <div className="glass-panel rounded-xl p-4 my-2 text-left border-l-4 border-l-[#E67E22] min-h-[90px] flex items-center shadow">
          <p className="text-sm md:text-base font-medium text-white leading-relaxed">
            {scene.text}
          </p>
        </div>

        {/* Nav Controls */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={onFinish}
            className="glass-panel glass-panel-interactive px-4 py-2 rounded-xl text-xs font-orbitron font-bold text-[#F4F7FA]/70 flex items-center space-x-1 hover:text-white"
          >
            <span>SKIP CINEMATIC</span>
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handlePrev}
              disabled={currentScene === 1}
              className={`glass-panel px-4 py-2 rounded-xl text-xs font-orbitron font-bold flex items-center space-x-1 ${
                currentScene === 1
                  ? 'opacity-40 cursor-not-allowed text-white/40'
                  : 'glass-panel-interactive text-[#4DD0E1] cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREV</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-xl text-xs font-orbitron font-bold text-black bg-[#4DD0E1] hover:bg-[#2ECC71] transition-all flex items-center space-x-1 cursor-pointer shadow-lg"
            >
              <span>{currentScene === storyScenes.length ? 'COMMENCE EXPEDITION' : 'NEXT SCENE'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
