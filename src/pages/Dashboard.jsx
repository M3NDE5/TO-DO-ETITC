const TASKS = ["Tarea 1..", "Tarea 2..", "Tarea 3..", "Tarea 4.."];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Dashboard() {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const year = today.getFullYear();

  const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 h-full md:h-[90vh]">
        {/* Sidebar */}
        <aside className="md:w-64 bg-slate-900/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-slate-800">
          <div>
            <h1 className="text-xl font-extrabold tracking-wide mb-6">TO DO ETITC</h1>

            <section className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                Tareas pendientes
              </h2>
              <div className="space-y-2">
                <div className="h-4 rounded-full bg-emerald-400/80" />
                <div className="h-4 rounded-full bg-emerald-400/60" />
                <div className="h-4 rounded-full bg-emerald-400/40" />
              </div>
            </section>

            <section aria-label="Calendario">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Calendario
                </h2>
                <button className="text-slate-300 hover:text-white text-lg" aria-label="Abrir calendario">
                  
                </button>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 text-xs text-slate-100">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold">{monthName}</span>
                  <span className="text-[10px] text-slate-300">{year}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-300 mb-1">
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                  {calendarDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-lg"></span>
              </div>
              <div>
                <p className="font-semibold leading-tight">Diego Rodriguez</p>
                <p className="text-[10px] text-slate-400">Estudiante</p>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm">
              
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-slate-900/70 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 flex flex-col">
          <header className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-wide truncate pr-4">
              {formattedDate}
            </h2>
            <button className="w-10 h-10 rounded-full border border-slate-500 flex flex-col items-center justify-center gap-1">
              <span className="block w-5 h-[2px] bg-white rounded" />
              <span className="block w-5 h-[2px] bg-white rounded" />
              <span className="block w-5 h-[2px] bg-white rounded" />
            </button>
          </header>

          <section className="space-y-4 flex-1 overflow-auto">
            {TASKS.map((task, index) => (
              <div
                key={task}
                className="bg-slate-100 text-slate-900 rounded-2xl px-6 py-4 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      index === 0 ? "border-blue-600" : "border-slate-400"
                    }`}
                  >
                    {index === 0 && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                  <span className="text-sm font-medium">{task}</span>
                </div>

                <button className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow">
                  X
                </button>
              </div>
            ))}
          </section>

          <div className="flex justify-end mt-8">
            <button className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center text-3xl font-light shadow-lg border border-slate-300">
              +
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
export default Dashboard;
