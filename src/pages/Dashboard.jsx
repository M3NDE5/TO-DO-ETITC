import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Lista simplificada de festivos de Colombia (solo fecha, sin año específico)
const CO_HOLIDAYS = [
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "07-20", // Independencia de Colombia
  "08-07", // Batalla de Boyacá
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
];

// Estado inicial solo para mostrar algo mientras carga Firestore
const INITIAL_TASKS = [];

function isColHoliday(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return CO_HOLIDAYS.includes(`${month}-${day}`);
}

function Dashboard() {
  const today = new Date();

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    date: "",
    time: "",
    priority: "media",
    status: "pendiente",
    customPriority: "",
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Cargar tareas de Firestore filtradas por sesión
  useEffect(() => {
    const q = query(
      collection(db, "tareas"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((task) => task.sessionId === sessionId);
      setTasks(loaded);
    });

    return unsubscribe;
  }, [sessionId]);

  const displayedDate = useMemo(
    () =>
      today.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [today]
  );

  const monthName = useMemo(
    () =>
      new Date(currentYear, currentMonth, 1).toLocaleDateString("es-ES", {
        month: "long",
      }),
    [currentMonth, currentYear]
  );

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [currentMonth, currentYear]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const addTask = () => {
    if (!newTask.name.trim()) return;

    const priorityValue =
      newTask.priority === "personalizada" && newTask.customPriority.trim()
        ? newTask.customPriority.trim()
        : newTask.priority;

    const taskToAdd = {
      name: newTask.name.trim(),
      date: newTask.date || "",
      time: newTask.time || "",
      priority: priorityValue,
      status: newTask.status,
      topic: newTask.topic?.trim() || "",
      sessionId,
      createdAt: new Date(),
    };

    addDoc(collection(db, "tareas"), taskToAdd);
    setNewTask({
      name: "",
      date: "",
      time: "",
      priority: "media",
      status: "pendiente",
      customPriority: "",
    });
    setShowRightPanel(false);
  };

  const deleteTask = (taskId) => {
    deleteDoc(doc(db, "tareas", taskId));
  };

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };


  // RETURN = TODO LO QUE TIENE QUE VER CON HTML
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center px-3 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 md:gap-6 h-full lg:h-[92vh]">
        {/* Sidebar */}
        <aside className="lg:w-64 bg-slate-900/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-2xl border border-slate-800">
          <div>
            <h1 className="text-xl font-extrabold tracking-wide mb-6">TO DO ETITC</h1>

            <section className="mb-4">
              <button
                type="button"
                onClick={() => setIsSidebarExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2"
              >
                <span>Tareas pendientes</span>
                <span className="material-icons text-sm">
                  {isSidebarExpanded ? "expand_less" : "expand_more"}
                </span>
              </button>
              {isSidebarExpanded && (
                <div className="space-y-2 text-[11px] text-slate-200">
                  <p>- Organiza tus actividades diarias</p>
                  <p>- Marca las tareas completadas</p>
                  <p>- Elimina lo que ya no necesites</p>
                </div>
              )}
            </section>

            <section aria-label="Calendario">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Calendario
                </h2>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="material-icons text-slate-300 hover:text-white text-xs"
                  >
                    chevron_left
                  </button>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="material-icons text-slate-300 hover:text-white text-xs"
                  >
                    chevron_right
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 text-xs text-slate-100">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold">{monthName}</span>
                  <span className="text-[10px] text-slate-300">{currentYear}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-300 mb-1">
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                  {calendarDays.map((day) => {
                    const date = new Date(currentYear, currentMonth, day);
                    const isToday =
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
                    const isHoliday = isColHoliday(date);

                    const baseClass = "inline-flex items-center justify-center rounded-full px-1 py-[2px]";

                    let colorClass = "text-slate-100";
                    if (isHoliday) colorClass = "text-red-400 font-semibold";
                    if (isToday) colorClass = "bg-rose-500 text-white font-semibold";

                    return (
                      <span key={day} className={`${baseClass} ${colorClass}`}>
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between mt-6 text-xs text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center" />
              <div>
                <p className="font-semibold leading-tight">Diego Rodriguez</p>
                <p className="text-[10px] text-slate-400">Estudiante</p>
              </div>
            </div>
            <button className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm">
              <span className="material-icons text-[16px]">settings</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-slate-900/70 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 flex flex-col">
          <header className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-wide truncate pr-4">
              {displayedDate}
            </h2>
            <button
              type="button"
              onClick={() => setShowRightPanel((prev) => !prev)}
              className="w-10 h-10 rounded-full border border-slate-500 flex items-center justify-center"
              aria-label="Abrir menú principal"
            >
              <span className="material-icons">
                {showRightPanel ? "close" : "menu"}
              </span>
            </button>
          </header>

          <section className="space-y-4 flex-1 overflow-auto">
            {tasks.map((task, index) => (
              <div
                key={task.id ?? index}
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
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{task.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {task.date && task.time ? `${task.date} • ${task.time}` : null}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      Prioridad: {task.priority} • Estado: {task.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow"
                >
                  <span className="material-icons text-[16px]">close</span>
                </button>
              </div>
            ))}
          </section>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setShowRightPanel(true)}
              className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center text-3xl font-light shadow-lg border border-slate-300"
              aria-label="Nueva tarea"
            >
              <span className="material-icons text-[26px]">add</span>
            </button>
          </div>
        </main>
        {/* Panel derecho / formulario nueva tarea (se muestra en desktop y como slide en mobile) */}
        {showRightPanel && (
          <aside className="w-full lg:w-80 bg-indigo-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-indigo-800 flex flex-col gap-4 animate-fadeIn">
            <h2 className="text-center text-lg md:text-xl font-semibold">Crear Tarea</h2>

            <div className="flex flex-col gap-3 flex-1">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-name">
                  Nombre
                </label>
                <input
                  id="task-name"
                  name="name"
                  type="text"
                  value={newTask.name}
                  onChange={handleInputChange}
                  placeholder="Escribe la tarea..."
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm placeholder-indigo-200 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Fecha */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-date">
                  Fecha
                </label>
                <input
                  id="task-date"
                  name="date"
                  type="date"
                  value={newTask.date}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Hora */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-time">
                  Hora
                </label>
                <input
                  id="task-time"
                  name="time"
                  type="time"
                  value={newTask.time}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Prioridad */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-priority">
                  Prioridad
                </label>
                <select
                  id="task-priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                  <option value="personalizada">Personalizada</option>
                </select>

                {newTask.priority === "personalizada" && (
                  <input
                    name="customPriority"
                    type="text"
                    value={newTask.customPriority}
                    onChange={handleInputChange}
                    placeholder="Escribe la prioridad"
                    className="w-full mt-1 rounded-xl bg-indigo-700/60 px-4 py-2 text-sm placeholder-indigo-200 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                )}
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-status">
                  Estado
                </label>
                <select
                  id="task-status"
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="trabajando">Trabajándola</option>
                  <option value="ejecutando">Ejecutando</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </div>

              {/* Tema / descripción corta */}
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="task-topic">
                  Tema / descripción
                </label>
                <input
                  id="task-topic"
                  name="topic"
                  type="text"
                  value={newTask.topic || ""}
                  onChange={handleInputChange}
                  placeholder="Por ejemplo: Parcial de matemáticas"
                  className="w-full rounded-xl bg-indigo-700/60 px-4 py-2 text-sm placeholder-indigo-200 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addTask}
              className="mt-2 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 flex items-center justify-center gap-2 text-sm font-medium shadow-lg transition"
            >
              <span className="material-icons text-[18px]">save</span>
              <span>Guardar tarea</span>
            </button>
          </aside>
        )}
        </div>
      </div>

      {/* Menú inferior para mobile */}
      {!isDesktop && (
        <nav className="sticky bottom-0 w-full bg-slate-950/95 border-t border-slate-800 flex items-center justify-around py-2 text-xs">
          <button type="button" className="flex flex-col items-center gap-1 text-slate-100">
            <span className="material-icons text-[20px]">home</span>
            <span>Inicio</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRightPanel(true)}
            className="flex flex-col items-center gap-1 text-slate-100"
          >
            <span className="material-icons text-[20px]">add_circle</span>
            <span>Nueva</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-slate-100">
            <span className="material-icons text-[20px]">settings</span>
            <span>Opciones</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default Dashboard;
