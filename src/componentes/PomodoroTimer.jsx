import { useEffect, useState, useRef } from "react";

// Temporizador Pomodoro simple: 25 min trabajo / 5 min descanso.
// Permite ajustar duraciones antes de iniciar y hacer pausas.
export default function PomodoroTimer({ onClose, autoStart = false, task }) {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [mode, setMode] = useState("work"); // 'work' | 'break'
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);

  // Actualiza el valor total solo cuando se cambia la duración manualmente (no al pausar)
  useEffect(() => {
    if (mode === 'work' && !running) {
      setSecondsLeft(workMinutes * 60);
    }
  }, [workMinutes, mode]);
  useEffect(() => {
    if (mode === 'break' && !running) {
      setSecondsLeft(breakMinutes * 60);
    }
  }, [breakMinutes, mode]);

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
    if (mode === "work") {
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
      setRunning(true);
    } else {
      setMode("work");
      setSecondsLeft(workMinutes * 60);
      setRunning(true);
    }
  }, [secondsLeft, mode, workMinutes, breakMinutes]);

  // Iniciar automáticamente si autoStart
  useEffect(() => {
    if (autoStart) setRunning(true);
  }, [autoStart]);

  // ESC key requests close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const toggleRunning = () => {
    setRunning((r) => !r);
  };
  const resetCurrent = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft((mode === "work" ? workMinutes : breakMinutes) * 60);
  };
  // Salta a la siguiente fase y asegura que el intervalo se reinicie
  const skipMode = () => {
    const nextMode = mode === 'work' ? 'break' : 'work';
    const nextSeconds = nextMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
    // Detenemos el intervalo actual si existe
    clearInterval(intervalRef.current);
    // Actualizamos fase y tiempo
    setMode(nextMode);
    setSecondsLeft(nextSeconds);
    // Forzamos recrear intervalo: toggling running garantiza que el useEffect se ejecute
    setRunning(false);
    setTimeout(() => setRunning(true), 0);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-center">
        Temporizador Pomodoro ({mode === "work" ? "Trabajo" : "Descanso"})
      </h3>
      {task && (
        <div className="text-xs text-center text-slate-400 mb-2">Tarea: <span className="font-semibold text-slate-200">{task.name}</span></div>
      )}
      <div className="text-center text-5xl font-bold tracking-widest">
        {mm}:{ss}
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={toggleRunning}
          className={`px-4 py-2 rounded-xl text-sm font-semibold shadow bg-indigo-600 hover:bg-indigo-500 text-white`}
        >
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button
          onClick={resetCurrent}
          className="px-4 py-2 rounded-xl text-sm font-semibold shadow bg-slate-300 hover:bg-slate-200 text-slate-900"
        >
          Reiniciar
        </button>
        <button
          onClick={skipMode}
          className="px-4 py-2 rounded-xl text-sm font-semibold shadow bg-purple-600 hover:bg-purple-500 text-white"
        >
          Saltar
        </button>
      </div>
      {!running && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Trabajo (min)</label>
            <input
              type="number"
              min={1}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value) || 1)}
              className="w-full rounded-xl bg-slate-800/40 border border-slate-600 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Descanso (min)</label>
            <input
              type="number"
              min={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value) || 1)}
              className="w-full rounded-xl bg-slate-800/40 border border-slate-600 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
      )}
      <button
        onClick={onClose}
        className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white py-2 text-sm font-semibold"
      >
        Cerrar
      </button>
    </div>
  );
}
