import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Rocket,
  Building2,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TenYearsLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame: () => void;
  speakText?: (text: string) => void;
  playSound?: (type: any) => void;
}

interface TimelineScene {
  year: string;
  title: string;
  subtitle: string;
  desc: string;
  stats: { label: string; value: string }[];
  highlight: string;
}

const TIMELINE_SCENES: TimelineScene[] = [
  {
    year: 'YEAR 2028 • 2 YEARS LATER',
    title: 'Earth Rejuvenation & Clean Energy Grid',
    subtitle: 'Martian Discoveries Transform the Home World',
    desc: 'The geothermal and quantum mineral samples collected by your rover sparked an unprecedented energy revolution on Earth. Fusion arrays powered by Martian isotopes replaced all fossil infrastructure, healing Earth’s biosphere and enabling global super-cities to thrive.',
    stats: [
      { label: 'Earth Clean Energy', value: '100%' },
      { label: 'Global Population', value: '8.4 Billion' },
      { label: 'Orbital Skyports', value: '12 Active' },
    ],
    highlight: 'Earth entered a golden age of peace, clean water, and boundless scientific prosperity.',
  },
  {
    year: 'YEAR 2031 • 5 YEARS LATER',
    title: 'The Great Interplanetary Migration',
    subtitle: 'Ares Cycler Fleets Bridge Earth and Mars',
    desc: 'Massive ion-propelled cycler ships began non-stop transit between Earth orbit and Mars. Over 250,000 scientists, engineers, agronomists, and families embarked on the 4-month journey, carrying Earth’s heritage to the red planet.',
    stats: [
      { label: 'Annual Migrants', value: '65,000+' },
      { label: 'Cycler Starships', value: '18 in Transit' },
      { label: 'Orbital Elevators', value: '4 Operating' },
    ],
    highlight: 'The night sky on Earth now twinkled with outward-bound colonization convoys.',
  },
  {
    year: 'YEAR 2034 • 8 YEARS LATER',
    title: 'The Domed Metropolises of Mars',
    subtitle: 'Lush Biospheres Under Martian Skies',
    desc: 'The settlement zones and ice aquifers you mapped in Cerberus and Olympus Mons blossomed into vibrant geodesic cities. Within pressurized biomes, green forests, flowing waterways, schools, and vertical farms flourished under Martian sunsets.',
    stats: [
      { label: 'Mars Population', value: '420,000' },
      { label: 'Biodome Cities', value: '7 Major Hubs' },
      { label: 'Crop Self-Sufficiency', value: '98.5%' },
    ],
    highlight: 'The first generation of children born under Martian gravity took their first steps.',
  },
  {
    year: 'YEAR 2036 • 10 YEARS LATER',
    title: 'A United Multi-Planetary Humanity',
    subtitle: 'Humanity Permanently Populating Earth & Mars',
    desc: 'Exactly ten years after your solitary rover completed its final survey at the Olympus Mons summit, humanity stands triumphant as a two-planet species. In the central rotunda of Ares Prime City, your rover is enshrined in solid titanium—a permanent monument to the courage that bridged two worlds.',
    stats: [
      { label: 'Total Civilization', value: '8.9 Billion Humans' },
      { label: 'Planets Inhabited', value: 'Earth & Mars' },
      { label: 'Pioneer Rover', value: 'Honored Legend' },
    ],
    highlight: 'Two worlds, one united destiny: Earth as our cradle, Mars as our second home.',
  },
];

export const TenYearsLaterModal: React.FC<TenYearsLaterModalProps> = ({
  isOpen,
  onClose,
  onRestartGame,
  speakText,
  playSound,
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [voiceOn, setVoiceOn] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-progress through the 4 scenes over time
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSceneIdx((sc) => {
            const next = (sc + 1) % TIMELINE_SCENES.length;
            if (next === 0) {
              setIsPlaying(false); // Stop at end of loop
            }
            return next;
          });
          return 0;
        }
        return prev + 1.25; // ~8 seconds per scene
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  // Voice narration when scene changes
  useEffect(() => {
    if (!isOpen || !voiceOn || !speakText) return;
    const scene = TIMELINE_SCENES[currentSceneIdx];
    speakText(`${scene.title}. ${scene.highlight}`);
  }, [currentSceneIdx, isOpen, voiceOn, speakText]);

  // Canvas Animation: Rotating Earth & Mars, shuttles, starfield, glowing cities
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Starfield particles
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        r: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.2 + 0.05,
      });
    }

    // Ships cruising between planets
    const ships: { x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[] }[] = [];
    for (let s = 0; s < 6; s++) {
      ships.push({
        x: 160 + Math.random() * 450,
        y: 120 + Math.random() * 200,
        vx: 0.8 + Math.random() * 0.8,
        vy: (Math.random() - 0.5) * 0.4,
        trail: [],
      });
    }

    const render = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;

      // Deep space background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#040814');
      grad.addColorStop(0.5, '#0a1026');
      grad.addColorStop(1, '#1a0d18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Render stars
      stars.forEach((st) => {
        st.x = (st.x + st.speed) % w;
        const twinkle = Math.sin(time * 3 + st.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // LEFT: EARTH (Thriving Blue & Green marble with orbital ring and city lights)
      const earthX = w * 0.22;
      const earthY = h * 0.52;
      const earthR = 68;

      // Earth atmosphere glow
      const earthAtm = ctx.createRadialGradient(earthX, earthY, earthR * 0.8, earthX, earthY, earthR * 1.35);
      earthAtm.addColorStop(0, 'rgba(64, 196, 255, 0.45)');
      earthAtm.addColorStop(0.6, 'rgba(33, 150, 243, 0.2)');
      earthAtm.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = earthAtm;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthR * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      const earthBody = ctx.createRadialGradient(earthX - 20, earthY - 20, 10, earthX, earthY, earthR);
      earthBody.addColorStop(0, '#64B5F6');
      earthBody.addColorStop(0.5, '#1E88E5');
      earthBody.addColorStop(0.85, '#0D47A1');
      earthBody.addColorStop(1, '#021B3A');
      ctx.fillStyle = earthBody;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
      ctx.fill();

      // Continents & Green biosphere swirls
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#2ECC71';
      for (let c = 0; c < 5; c++) {
        const cx = earthX - 45 + ((c * 35 + time * 6) % 150) - 30;
        const cy = earthY - 35 + (c * 18);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 14, (c * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // City light clusters on night side (Golden dots of billions of humans)
      ctx.fillStyle = '#F1C40F';
      for (let l = 0; l < 25; l++) {
        const lx = earthX + 10 + Math.sin(l * 1.5 + time) * 35;
        const ly = earthY - 40 + l * 3.5;
        ctx.fillRect(lx, ly, 1.8, 1.8);
      }
      ctx.restore();

      // Orbital Rings around Earth
      ctx.strokeStyle = 'rgba(77, 208, 225, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(earthX, earthY, earthR * 1.55, earthR * 0.35, -0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Label under Earth
      ctx.fillStyle = '#81D4FA';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EARTH • REJUVENATED', earthX, earthY + earthR + 25);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('8.4B Citizens • Global Fusion Grid', earthX, earthY + earthR + 40);

      // RIGHT: MARS (Terraforming with green geo-domes & settlement lights)
      const marsX = w * 0.78;
      const marsY = h * 0.48;
      const marsR = 56;

      // Mars atmosphere glow
      const marsAtm = ctx.createRadialGradient(marsX, marsY, marsR * 0.8, marsX, marsY, marsR * 1.35);
      marsAtm.addColorStop(0, 'rgba(255, 112, 67, 0.4)');
      marsAtm.addColorStop(0.6, 'rgba(230, 81, 0, 0.15)');
      marsAtm.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = marsAtm;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsR * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Mars body
      const marsBody = ctx.createRadialGradient(marsX - 18, marsY - 18, 8, marsX, marsY, marsR);
      marsBody.addColorStop(0, '#FF8A65');
      marsBody.addColorStop(0.6, '#D84315');
      marsBody.addColorStop(0.9, '#BF360C');
      marsBody.addColorStop(1, '#3E100C');
      ctx.fillStyle = marsBody;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2);
      ctx.fill();

      // Mars surface features & Domes
      ctx.save();
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2);
      ctx.clip();

      // Craters & Dark Basalt Maria
      ctx.fillStyle = '#5A160E';
      ctx.beginPath();
      ctx.arc(marsX - 12, marsY + 8, 18, 0, Math.PI * 2);
      ctx.arc(marsX + 20, marsY - 12, 14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Geo-Dome Cities on Mars (Cyan & Emerald)
      const domeLocations = [
        { x: marsX - 15, y: marsY - 10, name: 'Olympus City' },
        { x: marsX + 10, y: marsY + 12, name: 'Cerberus Hub' },
        { x: marsX - 5, y: marsY + 22, name: 'Elysium Spire' },
      ];

      domeLocations.forEach((d) => {
        ctx.fillStyle = 'rgba(77, 208, 225, 0.85)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.restore();

      // Label under Mars
      ctx.fillStyle = '#FFAB91';
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MARS • COLONIZED', marsX, marsY + marsR + 25);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('420K Settlers • 7 Biodome Cities', marsX, marsY + marsR + 40);

      // CENTER: Interplanetary Cycler Bridge & Ion Starships
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(earthX + earthR, earthY);
      ctx.quadraticCurveTo(w * 0.5, h * 0.3, marsX - marsR, marsY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update and render starships
      ships.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x > marsX - 40) {
          s.x = earthX + 40;
          s.y = earthY + (Math.random() - 0.5) * 40;
          s.trail = [];
        }

        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 15) s.trail.shift();

        // Ion engine blue trail
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        s.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Ship body
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Human population silhouette in foreground looking up at the two worlds
      ctx.fillStyle = 'rgba(8, 15, 30, 0.92)';
      ctx.fillRect(0, h - 45, w, 45);
      ctx.strokeStyle = 'rgba(77, 208, 225, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - 45);
      ctx.lineTo(w, h - 45);
      ctx.stroke();

      // Silhouettes of humans (parents and children) looking up
      ctx.fillStyle = '#4DD0E1';
      for (let p = 0; p < 8; p++) {
        const px = w * 0.42 + p * 16;
        const py = h - 22;
        // head
        ctx.beginPath();
        ctx.arc(px, py - 10, p % 2 === 0 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillRect(px - 2, py - 6, 4, 16);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ARES CYCLER STARSHIP CONVOYS • CONTINUOUS PASSENGER TRANSIT', w * 0.5, h - 12);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentScene = TIMELINE_SCENES[currentSceneIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-6 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-4xl w-full glass-panel rounded-3xl p-6 md:p-8 border-2 border-[#4DD0E1] text-white shadow-2xl space-y-6 relative overflow-hidden bg-[#070D1B]/95 my-auto">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2ECC71] via-[#4DD0E1] to-[#E67E22]" />

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#4DD0E1]/20 border border-[#4DD0E1] flex items-center justify-center text-[#4DD0E1]">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded bg-[#4DD0E1]/20 text-[#4DD0E1] border border-[#4DD0E1]/40">
                  SPECIAL EPILOGUE
                </span>
                <span className="text-xs text-white/50 font-orbitron">MISSION LOG 2026 - 2036</span>
              </div>
              <h1 className="font-orbitron font-black text-xl md:text-2xl text-white tracking-wider">
                10 YEARS LATER: A NEW DAWN
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVoiceOn(!voiceOn)}
              className="p-2 rounded-xl border border-white/20 hover:bg-white/10 text-white/80 transition-all cursor-pointer"
              title={voiceOn ? 'Mute voiceover' : 'Enable voiceover'}
            >
              {voiceOn ? <Volume2 className="w-4 h-4 text-[#2ECC71]" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-xl border border-[#4DD0E1]/40 bg-[#4DD0E1]/20 text-[#4DD0E1] font-orbitron font-bold text-xs flex items-center space-x-1.5 hover:bg-[#4DD0E1]/30 transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'opacity-50' : ''}`} />
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
          </div>
        </div>

        {/* Cinematic Canvas Animation: Earth, Mars & Shuttles */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#4DD0E1]/30 shadow-2xl bg-black">
          <canvas
            ref={canvasRef}
            width={800}
            height={360}
            className="w-full h-56 md:h-72 object-cover block"
          />

          {/* Overlay Tag */}
          <div className="absolute top-3 left-3 bg-[#080F1E]/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[10px] font-orbitron text-[#4DD0E1] flex items-center space-x-1.5">
            <Sparkles className="w-3 h-3 text-[#F1C40F] animate-spin" />
            <span>INTERPLANETARY POPULATION SIMULATION • 2036</span>
          </div>

          {/* Scene Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#4DD0E1] to-[#2ECC71] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scene Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TIMELINE_SCENES.map((scene, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSceneIdx(idx);
                setProgress(0);
                if (playSound) playSound('click');
              }}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                currentSceneIdx === idx
                  ? 'border-[#4DD0E1] bg-[#4DD0E1]/15 text-white shadow-lg'
                  : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <div className="text-[9px] font-orbitron font-bold text-[#4DD0E1]">{scene.year}</div>
              <div className="text-xs font-bold truncate mt-0.5">{scene.title}</div>
            </button>
          ))}
        </div>

        {/* Active Scene Narrative Card */}
        <div className="glass-panel p-5 rounded-2xl border border-[#4DD0E1]/30 space-y-3 bg-[#050A14]/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-orbitron font-bold text-[#2ECC71] uppercase tracking-wider">
                {currentScene.year}
              </span>
              <h2 className="text-lg md:text-xl font-orbitron font-black text-white">
                {currentScene.title}
              </h2>
              <div className="text-xs text-[#4DD0E1] font-semibold">{currentScene.subtitle}</div>
            </div>
          </div>

          <p className="text-xs md:text-sm text-[#F4F7FA]/80 leading-relaxed font-sans">
            {currentScene.desc}
          </p>

          <div className="bg-[#4DD0E1]/10 border border-[#4DD0E1]/30 p-3 rounded-xl text-xs text-[#E1F5FE] italic">
            "{currentScene.highlight}"
          </div>

          {/* Metric Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {currentScene.stats.map((stat, i) => (
              <div key={i} className="bg-black/50 p-2.5 rounded-xl border border-white/10 text-center">
                <div className="text-[10px] text-white/60 font-sans">{stat.label}</div>
                <div className="text-sm md:text-base font-orbitron font-black text-[#2ECC71]">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              setCurrentSceneIdx(0);
              setProgress(0);
              setIsPlaying(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-orbitron font-bold border border-white/20 hover:bg-white/10 text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REPLAY TIMELINE</span>
          </button>

          <div className="flex w-full sm:w-auto items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-orbitron font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              FREE ROAM MARS
            </button>

            <button
              onClick={onRestartGame}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-orbitron font-bold bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black hover:opacity-90 transition-all flex items-center justify-center space-x-1.5 shadow-xl cursor-pointer"
            >
              <span>NEW EXPEDITION</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
