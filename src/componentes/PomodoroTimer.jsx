import { useEffect, useState, useRef } from "react";

// Temporizador Pomodoro simple: 25 min trabajo / 5 min descanso.
// Permite ajustar duraciones antes de iniciar y hacer pausas.
export default function PomodoroTimer({ onClose }) {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [mode, setMode] = useState("work"); // 'work' | 'break'
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Actualiza segundos si se cambia la duración inicial y no está corriendo
  useEffect(() => {
    if (!running && mode === "work") setSecondsLeft(workMinutes * 60);
  }, [workMinutes, running, mode]);
  useEffect(() => {
    if (!running && mode === "break") setSecondsLeft(breakMinutes * 60);
  }, [breakMinutes, running, mode]);

  // Lógica principal del conteo
  useEffect(() => {
    if (!running) return;
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
    } else {
      setMode("work");
      setSecondsLeft(workMinutes * 60);
    }
  }, [secondsLeft, mode, workMinutes, breakMinutes]);

  const toggleRunning = () => setRunning((r) => !r);
  const resetCurrent = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft((mode === "work" ? workMinutes : breakMinutes) * 60);
  };
  const skipMode = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (mode === "work") {
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode("work");
      setSecondsLeft(workMinutes * 60);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-center">
        Temporizador Pomodoro ({mode === "work" ? "Trabajo" : "Descanso"})
      </h3>
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
