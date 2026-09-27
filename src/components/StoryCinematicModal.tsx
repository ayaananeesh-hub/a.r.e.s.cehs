import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Subtitles,
  Maximize2,
  Minimize2,
  Rocket,
  Layers,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { SoundType } from '../hooks/useSoundEffects';

interface StoryChapter {
  id: number;
  startTime: number;
  endTime: number;
  title: string;
  tagline: string;
  speaker: string;
  text: string;
  color: string;
  soundCue: SoundType;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    startTime: 0,
    endTime: 10,
    title: 'THE RED FRONTIER: EARTH DEPARTURE',
    tagline: 'Cape Canaveral • Deep Space Cruise Phase',
    speaker: 'MISSION FLIGHT DIRECTOR - HOUSTON',
    text: "Earth's resources are depleting. Humanity unites under Project Ares, setting our sights upon Mars as our civilization's next home.",
    color: '#4DD0E1',
    soundCue: 'whoosh',
  },
  {
    id: 2,
    startTime: 10,
    endTime: 20,
    title: 'ORBITAL INSERTION & CAPSULE SEPARATION',
    tagline: 'Jezero Crater Vector • 400 km Mars Orbit',
    speaker: 'DEEP SPACE NETWORK - PASADENA',
    text: 'Interplanetary cruise stage separates over the northern hemisphere. The Ares Explorer entry capsule aligns its ablative heat shield.',
    color: '#E67E22',
    soundCue: 'ping',
  },
  {
    id: 3,
    startTime: 20,
    endTime: 30,
    title: 'SEVEN MINUTES OF TERROR: HYPERSONIC ENTRY',
    tagline: 'Atmospheric Interface • Mach 22 Thermal Shockwave',
    speaker: 'EDL TELEMETRY DISPATCH',
    text: 'Aeroshell slams into the thin Martian CO₂ atmosphere at Mach 22. Ionization plasma envelope reaches 2,100°C as friction decelerates the craft.',
    color: '#FF5722',
    soundCue: 'boom',
  },
  {
    id: 4,
    startTime: 30,
    endTime: 40,
    title: 'SUPERSONIC PARACHUTE & SKY-CRANE BRAKING',
    tagline: 'Disk-Gap-Band Canopy • Hydrazine Retro-Thrust',
    speaker: 'ENTRY GUIDANCE COMPUTER',
    text: 'Supersonic parachute deployed at 10 kilometers altitude. Heat shield jettisoned, and Sky-Crane hydrazine thrusters ignite for terminal descent.',
    color: '#FF9800',
    soundCue: 'thruster',
  },
  {
    id: 5,
    startTime: 40,
    endTime: 50,
    title: 'BASALT CANYON TOUCHDOWN',
    tagline: 'Tether Lowering • Rocker-Bogie Surface Contact',
    speaker: 'ARES CHIEF CONTROLLER',
    text: 'Touchdown confirmed in Basalt Canyon! Umbilical bridles severed, dust settled, and rover suspension locked nominal. Ares Explorer is alive on Mars.',
    color: '#2ECC71',
    soundCue: 'touchdown',
  },
  {
    id: 6,
    startTime: 50,
    endTime: 60,
    title: 'THE SUMMIT OF OLYMPUS MONS',
    tagline: 'Primary Scientific Objective • 21 km Caldera',
    speaker: 'ARES ROVER AI CORE',
    text: 'All scientific instruments online. Our ultimate directive: survey ancient riverbeds, conquer lava chasms, and conquer the summit of Olympus Mons.',
    color: '#9B59B6',
    soundCue: 'ping',
  },
];

const TOTAL_VIDEO_DURATION = 60; // 60 seconds total

interface StoryCinematicModalProps {
  isOpen: boolean;
  onFinish: () => void;
  onSceneChange?: (sceneText: string) => void;
  playSound?: (type: SoundType) => void;
  speakText?: (text: string) => void;
  audioEnabled?: boolean;
}

export const StoryCinematicModal: React.FC<StoryCinematicModalProps> = ({
  isOpen,
  onFinish,
  onSceneChange,
  playSound,
  speakText,
  audioEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showChapterMenu, setShowChapterMenu] = useState<boolean>(false);

  const lastSpokenChapterRef = useRef<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Determine current active chapter
  const activeChapterIndex = Math.min(
    STORY_CHAPTERS.length - 1,
    Math.max(
      0,
      STORY_CHAPTERS.findIndex(
        (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
      ) === -1
        ? STORY_CHAPTERS.length - 1
        : STORY_CHAPTERS.findIndex(
            (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
          )
    )
  );

  const currentChapter = STORY_CHAPTERS[activeChapterIndex];

  // Ambient synth soundtrack
  const initSoundtrack = useCallback(() => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2 note

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc1.start();
      osc2.start();

      synthNodesRef.current = { osc1, osc2, gain };
    } catch {
      // audio context not allowed yet
    }
  }, []);

  const updateSoundtrack = useCallback(
    (playing: boolean, muted: boolean, chapterId: number) => {
      if (!synthNodesRef.current || !audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const gain = synthNodesRef.current.gain;
      const osc1 = synthNodesRef.current.osc1;

      if (!playing || muted || !audioEnabled) {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      } else {
        gain.gain.setTargetAtTime(0.04, ctx.currentTime, 0.1);
        // Vary root drone frequency slightly with chapter mood
        const freqs = [55, 65.4, 49, 73.4, 55, 82.4];
        const f = freqs[(chapterId - 1) % freqs.length];
        osc1.frequency.setTargetAtTime(f, ctx.currentTime, 0.5);
      }
    },
    [audioEnabled]
  );

  // Sync voice narration and sound cues on chapter transition
  useEffect(() => {
    if (!isOpen) return;

    if (activeChapterIndex !== lastSpokenChapterRef.current) {
      lastSpokenChapterRef.current = activeChapterIndex;
      const chapter = STORY_CHAPTERS[activeChapterIndex];

      if (onSceneChange) {
        onSceneChange(chapter.text);
      }

      if (isPlaying && !isAudioMuted && audioEnabled) {
        if (speakText) {
          speakText(chapter.text);
        }
        if (playSound) {
          playSound(chapter.soundCue);
        }
      }
    }
  }, [
    activeChapterIndex,
    isOpen,
    isPlaying,
    isAudioMuted,
    audioEnabled,
    onSceneChange,
    speakText,
    playSound,
  ]);

  // Handle open/close reset
  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0);
      setIsPlaying(true);
      lastSpokenChapterRef.current = -1;
      initSoundtrack();
    } else {
      setIsPlaying(false);
      if (synthNodesRef.current && audioContextRef.current) {
        synthNodesRef.current.gain.gain.setTargetAtTime(
          0,
          audioContextRef.current.currentTime,
          0.05
        );
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, initSoundtrack]);

  // Update soundtrack audio levels
  useEffect(() => {
    updateSoundtrack(isPlaying, isAudioMuted, currentChapter.id);
  }, [isPlaying, isAudioMuted, currentChapter.id, updateSoundtrack]);

  // Frame ticker for video time advancement
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    let lastTimestamp = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTime((prev) => {
        const nextTime = prev + deltaSec * playbackRate;
        if (nextTime >= TOTAL_VIDEO_DURATION) {
          setIsPlaying(false);
          return TOTAL_VIDEO_DURATION;
        }
        return nextTime;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isPlaying, playbackRate]);

  // High-Production 2D Canvas Procedural Video Renderer
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Deep cosmos background gradient
      const bgGrad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        20,
        w / 2,
        h / 2,
        Math.max(w, h)
      );
      bgGrad.addColorStop(0, '#0C1322');
      bgGrad.addColorStop(0.6, '#060B14');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant stars with subtle parallax
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 70; i++) {
        const starX = (i * 97 + currentTime * 8) % w;
        const starY = (i * 53) % h;
        const twinkle = 0.3 + 0.7 * Math.sin(frame * 0.05 + i);
        ctx.globalAlpha = Math.max(0.1, twinkle);
        ctx.fillRect(starX, starY, (i % 3 === 0 ? 2 : 1), (i % 3 === 0 ? 2 : 1));
      }
      ctx.globalAlpha = 1.0;

      // Progress within current chapter [0, 1]
      const chapterProg = Math.max(
        0,
        Math.min(
          1,
          (currentTime - currentChapter.startTime) /
            (currentChapter.endTime - currentChapter.startTime)
        )
      );

      // SCENE 1: EARTH DEPARTURE & CRUISE STAGE
      if (currentChapter.id === 1) {
        // Earth in top-left, shrinking into distance
        const earthX = w * 0.22 - chapterProg * 40;
        const earthY = h * 0.35 - chapterProg * 20;
        const earthR = Math.max(35, 75 - chapterProg * 35);

        // Atmosphere glow halo
        const halo = ctx.createRadialGradient(
          earthX,
          earthY,
          earthR * 0.8,
          earthX,
          earthY,
          earthR * 1.5
        );
        halo.addColorStop(0, 'rgba(77, 208, 225, 0.5)');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Blue Earth sphere
        const earthGrad = ctx.createRadialGradient(
          earthX - earthR * 0.3,
          earthY - earthR * 0.3,
          earthR * 0.1,
          earthX,
          earthY,
          earthR
        );
        earthGrad.addColorStop(0, '#81D4FA');
        earthGrad.addColorStop(0.4, '#1E88E5');
        earthGrad.addColorStop(0.8, '#0D47A1');
        earthGrad.addColorStop(1, '#051329');
        ctx.fillStyle = earthGrad;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
        ctx.fill();

        // Ares Interplanetary Cruise Stage (moving toward right)
        const shipX = w * 0.35 + chapterProg * (w * 0.35);
        const shipY = h * 0.52 + Math.sin(frame * 0.03) * 6;

        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(0.08);

        // Blue Ion thruster particle exhaust stream
        for (let p = 0; p < 25; p++) {
          const px = -35 - Math.random() * (40 + chapterProg * 60);
          const py = (Math.random() - 0.5) * 12;
          const pAlpha = Math.random() * 0.8;
          ctx.fillStyle = `rgba(0, 229, 255, ${pAlpha})`;
          ctx.fillRect(px, py, 4, 4);
        }

        // Spacecraft body
        ctx.fillStyle = '#E0E6ED';
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(-20, -14);
        ctx.lineTo(-25, -6);
        ctx.lineTo(-32, -6);
        ctx.lineTo(-32, 6);
        ctx.lineTo(-25, 6);
        ctx.lineTo(-20, 14);
        ctx.closePath();
        ctx.fill();

        // Solar Array Wings
        ctx.fillStyle = '#1565C0';
        ctx.strokeStyle = '#64B5F6';
        ctx.lineWidth = 1.5;
        // Top array
        ctx.fillRect(-10, -42, 20, 26);
        ctx.strokeRect(-10, -42, 20, 26);
        // Bottom array
        ctx.fillRect(-10, 16, 20, 26);
        ctx.strokeRect(-10, 16, 20, 26);

        // Accent markings
        ctx.fillStyle = '#E67E22';
        ctx.fillRect(0, -4, 12, 8);

        ctx.restore();
      }

      // SCENE 2: MARS APPROACH & ORBIT INSERTION
      else if (currentChapter.id === 2) {
        // Mars in center, growing larger
        const marsX = w * 0.58;
        const marsY = h * 0.5;
        const marsR = 85 + chapterProg * 45;

        // Orange atmospheric haze
        const haze = ctx.createRadialGradient(
          marsX,
          marsY,
          marsR * 0.85,
          marsX,
          marsY,
          marsR * 1.35
        );
        haze.addColorStop(0, 'rgba(230, 126, 34, 0.45)');
        haze.addColorStop(0.7, 'rgba(255, 87, 34, 0.15)');
        haze.addColorStop(1, 'transparent');
        ctx.fillStyle = haze;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsR * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Mars sphere
        const marsGrad = ctx.createRadialGradient(
          marsX - marsR * 0.3,
          marsY - marsR * 0.3,
          marsR * 0.1,
          marsX,
          marsY,
          marsR
        );
        marsGrad.addColorStop(0, '#FF8A65');
        marsGrad.addColorStop(0.4, '#E67E22');
        marsGrad.addColorStop(0.8, '#C0392B');
        marsGrad.addColorStop(1, '#3E100C');
        ctx.fillStyle = marsGrad;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2);
        ctx.fill();

        // Polar Ice Cap
        ctx.fillStyle = '#E1F5FE';
        ctx.beginPath();
        ctx.arc(marsX + marsR * 0.1, marsY - marsR * 0.85, marsR * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Valles Marineris canyon cut
        ctx.strokeStyle = '#7B1D11';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(marsX - marsR * 0.5, marsY + marsR * 0.05);
        ctx.bezierCurveTo(
          marsX - marsR * 0.1,
          marsY + marsR * 0.15,
          marsX + marsR * 0.2,
          marsY - marsR * 0.05,
          marsX + marsR * 0.45,
          marsY + marsR * 0.1
        );
        ctx.stroke();

        // Approaching spacecraft descending into orbit
        const capsuleX = w * 0.18 + chapterProg * (w * 0.25);
        const capsuleY = h * 0.38 + chapterProg * (h * 0.15);

        ctx.save();
        ctx.translate(capsuleX, capsuleY);
        ctx.rotate(0.35);
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-14, -12);
        ctx.lineTo(-14, 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#263238'; // Heatshield front
        ctx.fillRect(14, -10, 4, 20);
        ctx.restore();
      }

      // SCENE 3: HYPERSONIC ATMOSPHERIC ENTRY
      else if (currentChapter.id === 3) {
        // Red-orange upper atmosphere horizon at bottom
        const atmoGrad = ctx.createLinearGradient(0, h * 0.4, 0, h);
        atmoGrad.addColorStop(0, 'rgba(198, 40, 40, 0)');
        atmoGrad.addColorStop(0.5, 'rgba(230, 81, 0, 0.35)');
        atmoGrad.addColorStop(1, '#BF360C');
        ctx.fillStyle = atmoGrad;
        ctx.fillRect(0, h * 0.4, w, h * 0.6);

        // Shake camera dynamically during re-entry
        const shakeX = (Math.random() - 0.5) * 6;
        const shakeY = (Math.random() - 0.5) * 6;

        ctx.save();
        ctx.translate(w * 0.5 + shakeX, h * 0.45 + shakeY);
        ctx.rotate(-0.4);

        // Blazing Plasma Shockwave Envelope
        const plasmaGrad = ctx.createRadialGradient(25, 0, 10, 25, 0, 95);
        plasmaGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        plasmaGrad.addColorStop(0.25, 'rgba(255, 171, 0, 0.85)');
        plasmaGrad.addColorStop(0.6, 'rgba(255, 61, 0, 0.6)');
        plasmaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.arc(25, 0, 95, 0, Math.PI * 2);
        ctx.fill();

        // Flame sparks and streak particles
        for (let s = 0; s < 35; s++) {
          const sx = 20 - Math.random() * 120;
          const sy = (Math.random() - 0.5) * 60;
          ctx.fillStyle = Math.random() > 0.4 ? '#FFD54F' : '#FF5722';
          ctx.fillRect(sx, sy, 5, 2);
        }

        // Blunt Aeroshell Capsule
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-24, -22);
        ctx.lineTo(-32, 0);
        ctx.lineTo(-24, 22);
        ctx.closePath();
        ctx.fill();

        // Ablative Glowing Heat Shield
        ctx.fillStyle = '#FF3D00';
        ctx.beginPath();
        ctx.arc(18, 0, 25, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        ctx.restore();
      }

      // SCENE 4: PARACHUTE & SKY-CRANE DESCENT
      else if (currentChapter.id === 4) {
        // Red terrain surface approaching
        const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
        groundGrad.addColorStop(0, '#C0392B');
        groundGrad.addColorStop(1, '#641E16');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        // Crater silhouettes
        ctx.fillStyle = '#4A148C22';
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.75, 120, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        const descY = h * 0.25 + chapterProg * (h * 0.22);
        const descX = w * 0.5;

        // Supersonic Parachute (visible in first half)
        if (chapterProg < 0.6) {
          const chuteY = descY - 110;
          ctx.strokeStyle = '#B0BEC5';
          ctx.lineWidth = 1;
          // Suspension lines
          ctx.beginPath();
          ctx.moveTo(descX, descY - 15);
          ctx.lineTo(descX - 60, chuteY + 20);
          ctx.moveTo(descX, descY - 15);
          ctx.lineTo(descX + 60, chuteY + 20);
          ctx.moveTo(descX, descY - 15);
          ctx.lineTo(descX - 25, chuteY + 20);
          ctx.moveTo(descX, descY - 15);
          ctx.lineTo(descX + 25, chuteY + 20);
          ctx.stroke();

          // Parachute Canopy with orange & white bands
          ctx.fillStyle = '#FF5722';
          ctx.beginPath();
          ctx.arc(descX, chuteY, 65, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(descX - 25, chuteY - 65, 50, 65);
        } else {
          // Sky-Crane Retro-Rockets Ignited!
          ctx.save();
          ctx.translate(descX, descY);

          // 4 Angled Hydrazine Thruster Flame Jets
          ctx.fillStyle = '#FFC107';
          const flameH = 30 + Math.random() * 15;
          // Left thruster flame
          ctx.beginPath();
          ctx.moveTo(-25, 5);
          ctx.lineTo(-35, 5 + flameH);
          ctx.lineTo(-20, 5);
          ctx.fill();
          // Right thruster flame
          ctx.beginPath();
          ctx.moveTo(25, 5);
          ctx.lineTo(35, 5 + flameH);
          ctx.lineTo(20, 5);
          ctx.fill();

          // Sky-Crane body
          ctx.fillStyle = '#455A64';
          ctx.fillRect(-30, -10, 60, 16);

          ctx.restore();
        }

        // Descent stage / Rover suspended
        ctx.fillStyle = '#E67E22';
        ctx.fillRect(descX - 18, descY + 6, 36, 18);
      }

      // SCENE 5: TOUCHDOWN IN BASALT CANYON
      else if (currentChapter.id === 5) {
        // Red canyon floor
        ctx.fillStyle = '#872115';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);

        // Canyon cliff walls in background
        ctx.fillStyle = '#5A160E';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.6);
        ctx.lineTo(w * 0.25, h * 0.35);
        ctx.lineTo(w * 0.45, h * 0.5);
        ctx.lineTo(w * 0.75, h * 0.3);
        ctx.lineTo(w, h * 0.55);
        ctx.lineTo(w, h * 0.6);
        ctx.closePath();
        ctx.fill();

        // Billowing red dust plume on ground
        for (let d = 0; d < 30; d++) {
          const dx = w * 0.5 + (Math.random() - 0.5) * 220;
          const dy = h * 0.68 + (Math.random() - 0.5) * 35;
          const dr = 15 + Math.random() * 25;
          ctx.fillStyle = `rgba(230, 126, 34, ${0.15 + Math.random() * 0.2})`;
          ctx.beginPath();
          ctx.arc(dx, dy, dr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Mars Rover resting on ground!
        const rX = w * 0.5;
        const rY = h * 0.68;

        // Rocker-Bogie 6 wheels
        ctx.fillStyle = '#1A252C';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 2;
        const wheelOffsets = [-42, -22, -2, 18, 38];
        wheelOffsets.forEach((ox) => {
          ctx.beginPath();
          ctx.arc(rX + ox, rY + 12, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Rover Chassis Body
        ctx.fillStyle = '#ECEFF1';
        ctx.fillRect(rX - 35, rY - 14, 70, 22);

        // Gold Solar Panel on top
        ctx.fillStyle = '#F39C12';
        ctx.fillRect(rX - 38, rY - 20, 76, 5);

        // Mast Camera looking forward with lens glow
        ctx.fillStyle = '#37474F';
        ctx.fillRect(rX + 16, rY - 38, 5, 20);
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(rX + 18, rY - 38, 6, 0, Math.PI * 2);
        ctx.fill();

        // Headlight beam illuminating the canyon
        const lightGrad = ctx.createRadialGradient(
          rX + 24,
          rY - 6,
          5,
          rX + 160,
          rY + 5,
          180
        );
        lightGrad.addColorStop(0, 'rgba(77, 208, 225, 0.4)');
        lightGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(rX + 24, rY - 10);
        ctx.lineTo(rX + 240, rY - 40);
        ctx.lineTo(rX + 240, rY + 45);
        ctx.closePath();
        ctx.fill();
      }

      // SCENE 6: OLYMPUS MONS SUMMIT HORIZON
      else if (currentChapter.id === 6) {
        // Red-purple twilight Martian sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
        skyGrad.addColorStop(0, '#120422');
        skyGrad.addColorStop(0.5, '#4A154B');
        skyGrad.addColorStop(1, '#A04000');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.65);

        // Colossal peak of Olympus Mons towering in the center
        ctx.fillStyle = '#311432';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.lineTo(w * 0.15, h * 0.45);
        ctx.lineTo(w * 0.5, h * 0.15); // Summit!
        ctx.lineTo(w * 0.85, h * 0.45);
        ctx.lineTo(w, h * 0.65);
        ctx.closePath();
        ctx.fill();

        // Caldera rim highlight
        ctx.strokeStyle = '#CE93D8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.16, 50, 10, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Foreground plain
        ctx.fillStyle = '#6E2D12';
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        // Colony Dome hologram wireframe projecting upward
        ctx.strokeStyle = '#4DD0E1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.65, 85, Math.PI, 0);
        ctx.stroke();

        // Rover poised to begin mission
        const rX = w * 0.32;
        const rY = h * 0.68;
        ctx.fillStyle = '#ECEFF1';
        ctx.fillRect(rX - 25, rY - 10, 50, 16);
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(rX - 28, rY - 14, 56, 4);
        ctx.fillStyle = '#080F1E';
        [-20, 0, 20].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(rX + ox, rY + 8, 7, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // CINEMATIC VIDEO OVERLAY / HUD POST-PROCESSING
      // Top & bottom movie letterbox bars
      ctx.fillStyle = '#000000';
      const letterboxH = Math.max(14, h * 0.05);
      ctx.fillRect(0, 0, w, letterboxH);
      ctx.fillRect(0, h - letterboxH, w, letterboxH);

      // Subtle CRT TV scanlines effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let y = letterboxH; y < h - letterboxH; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }

      // Audio waveform visualizer in top right of letterbox
      const eqX = w - 120;
      const eqY = 12;
      for (let b = 0; b < 12; b++) {
        const barH = isPlaying
          ? 3 + Math.abs(Math.sin(frame * 0.15 + b * 0.8)) * 14
          : 3;
        ctx.fillStyle = '#4DD0E1';
        ctx.fillRect(eqX + b * 7, eqY + 14 - barH, 4, barH);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen, currentChapter, currentTime]);

  if (!isOpen) return null;

  // Time format helper (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(pct * TOTAL_VIDEO_DURATION);
  };

  const handleJumpChapter = (chapter: StoryChapter) => {
    setCurrentTime(chapter.startTime);
    setIsPlaying(true);
    setShowChapterMenu(false);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipRelative = (delta: number) => {
    setCurrentTime((prev) =>
      Math.max(0, Math.min(TOTAL_VIDEO_DURATION, prev + delta))
    );
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-xl">
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full max-w-5xl aspect-video max-h-[92vh] glass-panel rounded-2xl overflow-hidden border-2 border-[#4DD0E1]/60 shadow-[0_0_50px_rgba(77,208,225,0.25)] flex flex-col bg-[#050A14] select-none"
      >
        {/* TOP VIDEO TITLEBAR */}
        <div className="relative z-30 flex justify-between items-center px-4 py-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 bg-red-600/90 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              <span>REC</span>
            </div>

            <div>
              <div className="font-orbitron font-black text-xs sm:text-sm text-white flex items-center space-x-2 tracking-wide">
                <span>PROJECT ARES: EXPEDITION CHRONICLES</span>
                <span className="text-[10px] text-[#4DD0E1] border border-[#4DD0E1]/40 px-1.5 py-0.2 rounded bg-[#080F1E] font-mono hidden sm:inline">
                  4K HDR 60FPS
                </span>
              </div>
              <div className="text-[11px] font-orbitron font-semibold text-[#E67E22]">
                CHAPTER {currentChapter.id} / 6 • {currentChapter.title}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Direct Launch Button */}
            <button
              onClick={onFinish}
              className="px-3.5 py-1.5 rounded-xl font-orbitron font-black text-xs bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black hover:opacity-90 transition-all flex items-center space-x-1.5 shadow-lg shadow-teal-900/40 cursor-pointer"
            >
              <span>COMMENCE MISSION</span>
              <Rocket className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onFinish}
              className="p-1.5 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Close Video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN VIDEO CANVAS DISPLAY */}
        <div
          onClick={togglePlayPause}
          className="relative flex-1 w-full h-full overflow-hidden cursor-pointer"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Central Play/Pause Overlay Icon when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
              <div className="w-16 h-16 rounded-full bg-[#4DD0E1]/90 text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1 fill-black" />
              </div>
            </div>
          )}

          {/* CHAPTER POPUP MENU OVERLAY */}
          {showChapterMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 left-4 z-40 max-w-sm w-full glass-panel bg-black/90 p-3 rounded-xl border border-[#4DD0E1]/50 space-y-2 shadow-2xl"
            >
              <div className="flex justify-between items-center text-xs font-orbitron font-bold text-[#4DD0E1] border-b border-white/10 pb-1.5">
                <span>SCENE CHAPTERS</span>
                <button
                  onClick={() => setShowChapterMenu(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {STORY_CHAPTERS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleJumpChapter(ch)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-orbitron flex justify-between items-center transition-all ${
                      ch.id === currentChapter.id
                        ? 'bg-[#4DD0E1]/20 text-[#4DD0E1] font-bold border border-[#4DD0E1]/40'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span>
                      {ch.id}. {ch.title}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">
                      {formatTime(ch.startTime)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CINEMATIC CLOSED CAPTION / SUBTITLE BAR */}
          {showCaptions && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-black/85 border border-[#4DD0E1]/30 rounded-xl px-4 py-2.5 shadow-2xl text-center backdrop-blur-md transition-all pointer-events-auto"
            >
              <div className="text-[10px] font-orbitron font-bold text-[#4DD0E1] uppercase tracking-wider mb-0.5">
                [{currentChapter.speaker}]
              </div>
              <p className="text-xs sm:text-sm font-medium text-white leading-relaxed tracking-wide">
                "{currentChapter.text}"
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM VIDEO PLAYER CONTROLS CHROME */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col space-y-2">
          {/* Timeline Scrubber Bar */}
          <div
            onClick={handleSeek}
            className="group relative w-full h-3 flex items-center cursor-pointer py-1"
          >
            {/* Background Track */}
            <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-[#E67E22] via-[#4DD0E1] to-[#2ECC71] transition-all duration-75"
                style={{
                  width: `${(currentTime / TOTAL_VIDEO_DURATION) * 100}%`,
                }}
              />
            </div>

            {/* Chapter Notches on Timeline */}
            {STORY_CHAPTERS.map((ch) => (
              <div
                key={ch.id}
                title={`${ch.id}. ${ch.title}`}
                className="absolute top-0 bottom-0 w-0.5 bg-black/60 pointer-events-none"
                style={{
                  left: `${(ch.startTime / TOTAL_VIDEO_DURATION) * 100}%`,
                }}
              />
            ))}

            {/* Draggable Scrubber Thumb */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg border border-[#4DD0E1] scale-0 group-hover:scale-100 transition-transform -translate-x-1/2 pointer-events-none"
              style={{
                left: `${(currentTime / TOTAL_VIDEO_DURATION) * 100}%`,
              }}
            />
          </div>

          {/* Control Buttons Toolbar */}
          <div className="flex justify-between items-center text-xs font-orbitron">
            {/* Left Controls: Play/Pause, Rewind, Fast Forward, Time Display */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-xl glass-panel text-white hover:text-[#4DD0E1] border border-white/20 cursor-pointer"
                title={isPlaying ? 'Pause Video (Space)' : 'Play Video (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skipRelative(-5)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                title="Rewind 5s"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipRelative(5)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                title="Forward 5s"
              >
                <FastForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                title="Replay from Beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Time readout */}
              <div className="font-mono text-[11px] text-white/80 tracking-wider">
                <span className="text-[#4DD0E1] font-bold">
                  {formatTime(currentTime)}
                </span>{' '}
                / {formatTime(TOTAL_VIDEO_DURATION)}
              </div>
            </div>

            {/* Right Controls: Chapter Selector, Speed, Audio, Captions, Fullscreen */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              <button
                onClick={() => setShowChapterMenu(!showChapterMenu)}
                className={`px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 border cursor-pointer ${
                  showChapterMenu
                    ? 'bg-[#4DD0E1]/20 text-[#4DD0E1] border-[#4DD0E1]/60'
                    : 'glass-panel text-white/70 border-white/10 hover:text-white'
                }`}
                title="Chapters"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CHAPTERS</span>
              </button>

              <button
                onClick={cycleSpeed}
                className="px-2 py-1 rounded-lg glass-panel text-[11px] font-mono text-white/80 hover:text-white border border-white/10 cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  showCaptions
                    ? 'bg-[#4DD0E1]/20 text-[#4DD0E1] border-[#4DD0E1]/50'
                    : 'glass-panel text-white/50 border-white/10'
                }`}
                title={showCaptions ? 'Hide Subtitles' : 'Show Subtitles'}
              >
                <Subtitles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white cursor-pointer"
                title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isAudioMuted ? (
                  <VolumeX className="w-4 h-4 text-white/40" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#4DD0E1]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
