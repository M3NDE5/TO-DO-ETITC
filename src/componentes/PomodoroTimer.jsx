import { useEffect, useState, useRef } from "react";

// Temporizador Pomodoro ampliado con:
// - Tabs Pomodoro / Short Break / Long Break (25/5/15 min por defecto)
// - Reproductor de música de concentración (focus.mp3 en public/audio)
// - Diseño fullScreen opcional (inspirado en Pomofocus)
export default function PomodoroTimer({ onClose, autoStart = false, task, fullScreen = false }) {
  const DEFAULTS = { pomodoro: 25, short: 5, long: 15 };
  const [durations, setDurations] = useState({ ...DEFAULTS });
  const [phase, setPhase] = useState("pomodoro"); // 'pomodoro' | 'short' | 'long'
  const [secondsLeft, setSecondsLeft] = useState(durations.pomodoro * 60);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Actualiza el valor total solo cuando se cambia la duración manualmente (no al pausar)
  // Actualiza segundos al cambiar duración si no está corriendo
  useEffect(() => {
    if (!running) setSecondsLeft(durations[phase] * 60);
  }, [durations, phase, running]);

  // Lógica principal del conteo
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Cambio automático de modo al llegar a cero
  useEffect(() => {
    if (secondsLeft >= 0) return;
    // Ciclo simple Pomodoro -> Short -> Pomodoro -> Long cada 4 pomodoros (opcional simple)
    // Aquí sólo alternamos a break y volvemos a pomodoro; se puede extender.
    if (phase === 'pomodoro') {
      setPhase('short');
      setSecondsLeft(durations.short * 60);
    } else {
      setPhase('pomodoro');
      setSecondsLeft(durations.pomodoro * 60);
    }
    setRunning(true);
  }, [secondsLeft, phase, durations]);

  // Iniciar automáticamente si autoStart
  useEffect(() => { if (autoStart) setRunning(true); }, [autoStart]);

  // Audio setup (carga diferida)
  useEffect(() => {
    audioRef.current = new Audio('/audio/focus.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    const onCan = () => setAudioReady(true);
    const onErr = () => setAudioReady(false);
    audioRef.current.addEventListener('canplaythrough', onCan);
    audioRef.current.addEventListener('error', onErr);
    return () => {
      audioRef.current.pause();
      audioRef.current.removeEventListener('canplaythrough', onCan);
      audioRef.current.removeEventListener('error', onErr);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // ESC key requests close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const toggleRunning = () => setRunning((r) => !r);
  const resetCurrent = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft(durations[phase] * 60);
  };
  const changePhase = (next) => {
    setPhase(next);
    setSecondsLeft(durations[next] * 60);
    setRunning(false);
  };
  const toggleAudio = () => {
    if (!audioReady || !audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => {});
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const wrapperClass = fullScreen
    ? 'w-full max-w-none flex flex-col gap-6'
    : 'w-full max-w-sm mx-auto flex flex-col gap-4';

  const phaseLabel = phase === 'pomodoro'
    ? 'Pomodoro'
    : phase === 'short'
    ? 'Descanso Corto'
    : 'Descanso Largo';

  return (
    <div className={wrapperClass}>
      <div className={`flex justify-center gap-2 ${fullScreen ? 'text-sm' : 'text-xs'} font-semibold`}> 
        {['pomodoro', 'short', 'long'].map((p) => (
          <button
            key={p}
            onClick={() => changePhase(p)}
            className={`px-3 py-1 rounded ${phase === p ? 'bg-indigo-600 text-white' : 'bg-slate-700/40 text-slate-300 hover:bg-slate-600/50'} transition`}
          >
            {p === 'pomodoro' ? 'Pomodoro' : p === 'short' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>
      <h3 className={`font-semibold text-center ${fullScreen ? 'text-2xl' : 'text-lg'}`}>Temporizador ({phaseLabel})</h3>
      {task && (
        <div className={`text-center ${fullScreen ? 'text-sm' : 'text-xs'} text-slate-400 mb-2`}>Tarea: <span className="font-semibold text-slate-200">{task.name}</span></div>
      )}
      <div className={`text-center font-bold tracking-widest ${fullScreen ? 'text-7xl md:text-8xl' : 'text-5xl'}`}>
        {mm}:{ss}
      </div>
      <div className={`flex flex-wrap gap-3 justify-center ${fullScreen ? 'mt-2' : ''}`}>
        <button
          onClick={toggleRunning}
          className="px-5 py-2 rounded-xl text-sm font-semibold shadow bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={resetCurrent}
          className="px-5 py-2 rounded-xl text-sm font-semibold shadow bg-slate-300 hover:bg-slate-200 text-slate-900"
        >
          Reiniciar
        </button>
        <button
          onClick={() => changePhase(phase === 'pomodoro' ? 'short' : 'pomodoro')}
          className="px-5 py-2 rounded-xl text-sm font-semibold shadow bg-purple-600 hover:bg-purple-500 text-white"
        >
          {phase === 'pomodoro' ? 'Break' : 'Pomodoro'}
        </button>
        <button
          onClick={toggleAudio}
          disabled={!audioReady}
          className={`px-5 py-2 rounded-xl text-sm font-semibold shadow ${audioPlaying ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700/60 hover:bg-emerald-600/70'} text-white disabled:opacity-40`}
        >
          {audioPlaying ? 'Música: On' : 'Música: Off'}
        </button>
      </div>
      {/* Duraciones editables cuando está en pausa */}
      {!running && (
        <div className={`grid ${fullScreen ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mt-4`}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Pomodoro (min)</label>
            <input
              type="number"
              min={1}
              value={durations.pomodoro}
              onChange={(e) => setDurations((d) => ({ ...d, pomodoro: Number(e.target.value) || 1 }))}
              className="w-full rounded-xl bg-slate-800/40 border border-slate-600 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Short (min)</label>
            <input
              type="number"
              min={1}
              value={durations.short}
              onChange={(e) => setDurations((d) => ({ ...d, short: Number(e.target.value) || 1 }))}
              className="w-full rounded-xl bg-slate-800/40 border border-slate-600 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 ${fullScreen ? '' : 'hidden md:flex'}">
            <label className="text-xs font-medium">Long (min)</label>
            <input
              type="number"
              min={1}
              value={durations.long}
              onChange={(e) => setDurations((d) => ({ ...d, long: Number(e.target.value) || 1 }))}
              className="w-full rounded-xl bg-slate-800/40 border border-slate-600 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      )}
      {/* Volumen música */}
      <div className="flex items-center gap-3 mt-4 justify-center">
        <label className="text-xs text-slate-400">Volumen</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-40"
        />
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white py-2 text-sm font-semibold"
      >
        Cerrar
      </button>
      {!audioReady && (
        <div className="text-center text-[11px] text-slate-500 mt-2">Sube un archivo focus.mp3 en public/audio para música.</div>
      )}
    </div>
  );
}
