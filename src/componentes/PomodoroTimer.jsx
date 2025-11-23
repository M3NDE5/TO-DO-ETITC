import { useEffect, useState, useRef } from "react";

// Componente Pomodoro Timer con duraciones externas.
// Las duraciones se pasan por props (pomodoro, short, long en minutos) y se guardan en Firestore fuera.
export default function PomodoroTimer({
  onClose,
  autoStart = false,
  task,
  fullScreen = false,
  durations = { pomodoro: 25, short: 5, long: 15 },
}) {
  const [phase, setPhase] = useState("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(durations.pomodoro * 60);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Ajuste de segundos si cambian duraciones o fase y no se está corriendo.
  useEffect(() => {
    if (!running) {
      setSecondsLeft((prev) => {
        const target = durations[phase] * 60;
        return prev > target ? target : prev;
      });
    }
  }, [durations, phase, running]);

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

  useEffect(() => {
    if (secondsLeft >= 0) return;
    if (phase === "pomodoro") {
      setPhase("short");
      setSecondsLeft(durations.short * 60);
    } else {
      setPhase("pomodoro");
      setSecondsLeft(durations.pomodoro * 60);
    }
    setRunning(true);
  }, [secondsLeft, phase, durations]);

  useEffect(() => {
    if (autoStart) setRunning(true);
  }, [autoStart]);

  useEffect(() => {
    audioRef.current = new Audio("/audio/focus.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    const onCan = () => setAudioReady(true);
    const onErr = () => setAudioReady(false);
    audioRef.current.addEventListener("canplaythrough", onCan);
    audioRef.current.addEventListener("error", onErr);
    return () => {
      audioRef.current.pause();
      audioRef.current.removeEventListener("canplaythrough", onCan);
      audioRef.current.removeEventListener("error", onErr);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

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

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const wrapperClass = fullScreen
    ? "w-full max-w-none flex flex-col gap-6"
    : "w-full max-w-sm mx-auto flex flex-col gap-5";
  const phaseLabel =
    phase === "pomodoro"
      ? "Pomodoro"
      : phase === "short"
      ? "Descanso Corto"
      : "Descanso Largo";

  return (
    <div className={wrapperClass}>
      <div
        className={`flex justify-center gap-3 ${fullScreen ? "text-sm" : "text-xs"} font-semibold flex-wrap`}
      >
        {["pomodoro", "short", "long"].map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => changePhase(p)}
            aria-pressed={phase === p}
            className={`px-4 py-2 min-w-[92px] rounded-lg touch-manipulation cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-[.97] transition
            ${phase === p ? "bg-indigo-600 text-white shadow-inner" : "bg-slate-700/40 text-slate-300 hover:bg-slate-600/50"}`}
            style={{ touchAction: "manipulation" }}
          >
            {p === "pomodoro" ? "Pomodoro" : p === "short" ? "Short Break" : "Long Break"}
          </button>
        ))}
      </div>
      <h3 className={`font-semibold text-center ${fullScreen ? "text-2xl" : "text-lg"}`}>
        Temporizador ({phaseLabel})
      </h3>
      {task && (
        <div
          className={`text-center ${fullScreen ? "text-sm" : "text-xs"} text-slate-400 mb-2`}
        >
          Tarea: <span className="font-semibold text-slate-200">{task.name}</span>
        </div>
      )}
      <div
        className={`text-center font-bold tracking-widest ${fullScreen ? "text-7xl md:text-8xl" : "text-5xl"}`}
      >
        {mm}:{ss}
      </div>
      <div className={`flex flex-wrap gap-3 justify-center ${fullScreen ? "mt-2" : "mt-1"}`}>
        <button
          type="button"
          onClick={toggleRunning}
          className="px-6 py-2 rounded-xl text-sm font-semibold shadow bg-indigo-600 hover:bg-indigo-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-[.97]"
          style={{ touchAction: "manipulation" }}
        >
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button
          type="button"
          onClick={resetCurrent}
          className="px-6 py-2 rounded-xl text-sm font-semibold shadow bg-slate-300 hover:bg-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-[.97]"
          style={{ touchAction: "manipulation" }}
        >
          Reiniciar
        </button>
        <button
          type="button"
            onClick={() => changePhase(phase === "pomodoro" ? "short" : "pomodoro")}
          className="px-6 py-2 rounded-xl text-sm font-semibold shadow bg-purple-600 hover:bg-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-[.97]"
          style={{ touchAction: "manipulation" }}
        >
          {phase === "pomodoro" ? "Break" : "Pomodoro"}
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          disabled={!audioReady}
          className={`px-6 py-2 rounded-xl text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[.97]
          ${audioPlaying ? "bg-emerald-600 hover:bg-emerald-500" : "bg-emerald-700/60 hover:bg-emerald-600/70"} text-white disabled:opacity-40`}
          style={{ touchAction: "manipulation" }}
        >
          {audioPlaying ? "Música: On" : "Música: Off"}
        </button>
      </div>
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
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-[.97]"
        style={{ touchAction: "manipulation" }}
      >
        Cerrar
      </button>
      {!audioReady && (
        <div className="text-center text-[11px] text-slate-500 mt-2">
          Sube un archivo focus.mp3 en public/audio para música.
        </div>
      )}
    </div>
  );
}
