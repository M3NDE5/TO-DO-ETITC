import { useEffect, useMemo, useState, useRef } from "react";
import {
  crearTarea,
  suscribirTareas,
  eliminarTarea,
  actualizarTarea,
} from "../servicios/ServicioTareas";
import { generateResponse } from "../servicios/Gemini";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../context/AuthContext";
import { getAuthSession } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GoClockFill } from "react-icons/go";
import PomodoroTimer from "../componentes/PomodoroTimer";

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

// function MiComponente() {

// }

function isColHoliday(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return CO_HOLIDAYS.includes(`${month}-${day}`);
}

function Dashboard() {
  // Pomodoro modal state
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [showPomodoroCloseConfirm, setShowPomodoroCloseConfirm] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(20 * 60); // 20 min in seconds
  const [pomodoroPaused, setPomodoroPaused] = useState(false);
  // Configuración Pomodoro externa (duraciones por usuario)
  const DEFAULT_DURATIONS = { pomodoro: 25, short: 5, long: 15 };
  const [userPomodoroDurations, setUserPomodoroDurations] = useState(DEFAULT_DURATIONS);
  const [tempDurations, setTempDurations] = useState(DEFAULT_DURATIONS);
  const [showPomodoroConfig, setShowPomodoroConfig] = useState(false);

  // Open Pomodoro modal (inicia automáticamente)
  const openPomodoroModal = (task) => {
    setPomodoroTask(task);
    setShowPomodoro(true);
    setShowPomodoroCloseConfirm(false);
  };

  // Confirmación para cerrar Pomodoro
  const closePomodoroModal = () => {
    setShowPomodoro(false);
    setPomodoroTask(null);
    setShowPomodoroCloseConfirm(false);
  };
  const requestPomodoroClose = () => {
    setShowPomodoroCloseConfirm(true);
  };
  const cancelPomodoroClose = () => {
    setShowPomodoroCloseConfirm(false);
  };

  // Pomodoro timer effect
  useEffect(() => {
    if (!showPomodoro || pomodoroPaused || pomodoroTime <= 0) return;
    const timer = setInterval(() => {
      setPomodoroTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPomodoro, pomodoroPaused, pomodoroTime]);

  // ESC key requests Pomodoro close (shows confirm)
  useEffect(() => {
    if (!showPomodoro) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") requestPomodoroClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showPomodoro]);

  // Format time mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const today = new Date();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  // Eliminamos sessionId, usaremos userId
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Función para abrir/cerrar el panel y setear fecha/hora actual si se abre
  const toggleRightPanel = () => {
    if (!showRightPanel) {
      const now = new Date();
      const fecha = now.toISOString().slice(0, 10);
      const hora = now.toTimeString().slice(0, 5);
      setNewTask((prev) => ({
        ...prev,
        date: fecha,
        time: hora,
      }));
    }
    setShowRightPanel((prev) => !prev);
  };
  const [newTask, setNewTask] = useState({
    name: "",
    date: "",
    time: "",
    priority: "media",
    status: "pendiente",
    customPriority: "",
  });
  // Estado para el mensaje de IA
  const [iaMessage, setIaMessage] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  // Ejecutar sugerencia IA sólo una vez al cargar (cuando haya al menos una tarea)
  const iaHasRunRef = useRef(false);
  useEffect(() => {
    if (iaHasRunRef.current) return; // ya se ejecutó
    if (!tasks || tasks.length === 0) return; // esperar a que lleguen tareas iniciales
    iaHasRunRef.current = true;
    setIaLoading(true);
    const tareasTexto = tasks
      .map((t) => `- ${t.name} (${t.date || "sin fecha"})`)
      .join("\n");
    const prompt = `Estas son mis tareas actuales en mi aplicación de To Do:\n${tareasTexto}\n\nSugiere una tarea corta y concreta que podría agregar a mi lista, útil y relevante para mí. No incluyas ninguna fecha en la respuesta. Siempre responde como si sugirieras agregar una tarea, usando el formato: 'Te sugiero agregar: ...', en máximo 2 líneas.`;
    generateResponse(prompt)
      .then((msg) => setIaMessage(msg))
      .catch(() => setIaMessage("No se pudo obtener sugerencia de la IA."))
      .finally(() => setIaLoading(false));
  }, [tasks]);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // inicializar en la fecha de hoy en formato YYYY-MM-DD
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

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
    // Sakamoto's algorithm will be used to compute weekday reliably
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const getWeekday = (y, m, d) => {
      // Sakamoto algorithm: returns 0=Sunday .. 6=Saturday
      const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
      if (m < 3) y -= 1;
      return (
        (y +
          Math.floor(y / 4) -
          Math.floor(y / 100) +
          Math.floor(y / 400) +
          t[m - 1] +
          d) %
        7
      );
    };
    const firstDayIndex = getWeekday(currentYear, currentMonth + 1, 1); // month is 1-12 for the algorithm
    // Create array with leading nulls for offset, then day numbers
    const arr = [];
    for (let i = 0; i < firstDayIndex; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [currentMonth, currentYear]);

  // tareas filtradas según fecha seleccionada (formato YYYY-MM-DD)
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return tasks;
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const addTask = () => {
    if (!newTask.name.trim() || !user || !user.uid) return;

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
      createdAt: new Date(),
    };

    crearTarea(taskToAdd, user.uid);
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

  // Modal de confirmación para borrar tarea
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Modal de edición de tarea
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Modal to schedule IA suggestion
  const [showIaScheduleModal, setShowIaScheduleModal] = useState(false);

  const extractSuggestion = (msg) => {
    if (!msg) return "";
    // try to parse formats like "Te sugiero agregar: ..." or just raw suggestion
    const idx = msg.indexOf(":");
    if (idx !== -1) return msg.slice(idx + 1).trim().replace(/^"|"$/g, "");
    return msg.trim();
  };

  const openIaScheduleModal = () => {
    const suggestion = extractSuggestion(iaMessage);
    const todayIso = new Date().toISOString().slice(0, 10);
    setNewTask((prev) => ({
      ...prev,
      name: suggestion || prev.name,
      date: prev.date || todayIso,
    }));
    setShowIaScheduleModal(true);
  };

  const closeIaScheduleModal = () => {
    setShowIaScheduleModal(false);
  };

  const saveIaScheduledTask = () => {
    // reuse addTask to create the task, then close this modal
    addTask();
    setShowIaScheduleModal(false);
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      eliminarTarea(taskToDelete);
      setTaskToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (task) => {
    setEditTask({ ...task });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditTask(null);
    setShowEditModal(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTask((prev) => {
      if (!prev) return prev;
      if (name === "priority") {
        if (value === "personalizada") {
          const prevP = (prev.priority || "").toString().toLowerCase();
          const customVal = ["alta", "media", "baja"].includes(prevP)
            ? ""
            : prev.priority || "";
          return {
            ...prev,
            priority: "personalizada",
            customPriority: customVal || prev.customPriority || "",
          };
        }
        return { ...prev, priority: value, customPriority: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const saveEditedTask = async () => {
    if (!editTask || !editTask.id) return;
    const { id, name, date, time, priority, status, topic, customPriority } =
      editTask;
    const priorityToSave =
      priority === "personalizada" && customPriority && customPriority.trim()
        ? customPriority.trim()
        : priority;
    try {
      await actualizarTarea(id, {
        name,
        date,
        time,
        priority: priorityToSave,
        status,
        topic,
      });
      closeEditModal();
    } catch (err) {
      console.error("Error actualizando tarea:", err);
    }
  };

  const cancelDeleteTask = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
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

  const [user, setUser] = useState({ displayName: "", role: "", uid: "" });

  useEffect(() => {
    getAuthSession().then(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser({ displayName: "", role: "", photoURL: "", uid: "" });
        return;
      }
      // obtener datos adicionales desde Firestore (role, photoURL guardado)
      try {
        const userDocRef = doc(db, "usuarios", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        setUser({
          displayName: firebaseUser.displayName || userData.nombre || "",
          role: userData.role || "",
          photoURL: firebaseUser.photoURL || userData.photoURL || "",
          uid: firebaseUser.uid,
        });
        if (userData.pomodoroDurations) {
          const { pomodoro, short, long } = userData.pomodoroDurations;
          const loaded = {
            pomodoro: Number(pomodoro) || DEFAULT_DURATIONS.pomodoro,
            short: Number(short) || DEFAULT_DURATIONS.short,
            long: Number(long) || DEFAULT_DURATIONS.long,
          };
          setUserPomodoroDurations(loaded);
          setTempDurations(loaded);
        }
      } catch (err) {
        console.error("Error al obtener usuario Firestore:", err);
        setUser({
          displayName: firebaseUser.displayName || "",
          role: "",
          photoURL: firebaseUser.photoURL || "",
          uid: firebaseUser.uid,
        });
      }
    });
  }, []);

  // Suscribirse a tareas del usuario autenticado
  useEffect(() => {
    if (!user || !user.uid) return;
    const unsubscribe = suscribirTareas(user.uid, setTasks);
    return unsubscribe;
  }, [user]);

  const editPrioritySelectValue = useMemo(() => {
    if (!editTask) return "media";
    const p = (editTask.priority || "").toString().toLowerCase();
    return ["alta", "media", "baja"].includes(p) ? p : "personalizada";
  }, [editTask]);

  // Agrupación de tareas por estado principal para el tablero (pendiente, ejecutando, finalizada)
  const groupedTasks = useMemo(() => {
    const source = filteredTasks;
    return {
      pendiente: source.filter((t) => (t.status || "").toLowerCase() === "pendiente"),
      ejecutando: source.filter((t) => {
        const s = (t.status || "").toLowerCase();
        return s === "ejecutando" || s === "trabajando"; // unificamos estados de trabajo
      }),
      finalizada: source.filter((t) => (t.status || "").toLowerCase() === "finalizada"),
    };
  }, [filteredTasks]);

  // Detectar orientación móvil paisaje para mostrar Pomodoro full-screen estilo Pomofocus
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  useEffect(() => {
    const detect = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobileLandscape(w < 900 && w > h); // ancho mayor que alto y menor a 900px
    };
    detect();
    window.addEventListener("resize", detect);
    window.addEventListener("orientationchange", detect);
    return () => {
      window.removeEventListener("resize", detect);
      window.removeEventListener("orientationchange", detect);
    };
  }, []);

  // RETURN = TODO LO QUE TIENE QUE VER CON HTML
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Local styles to hide scrollbar only for the tasks section (no changes to index.css) */}
      <style>{`
        .no-scrollbar-local {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .no-scrollbar-local::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
          width: 0;
          height: 0;
        }
      `}</style>
      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center px-3 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 md:gap-6 h-full lg:h-[92vh]">
          {/* Sidebar */}
          <aside className="lg:w-64 bg-slate-900/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-2xl border border-slate-800">
            {/* Scrollable content */}
            <div
              className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <h1 className="text-xl font-extrabold tracking-wide mb-6">
                TO DO ETITC
              </h1>

              {/* Mensaje reluciente de la IA Gemini */}
              <section className="mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  Sugerencia de tarea
                </h2>
                {iaLoading ? (
                  <div className="w-full flex flex-col items-center justify-center text-center bg-gradient-to-r from-indigo-700 to-slate-800 rounded-xl shadow-lg p-4 animate-pulse">
                    <span className="material-icons text-yellow-300 text-3xl mb-2">
                      auto_awesome
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-white mb-1">
                      Sugerencia de la IA
                    </span>
                    <span className="text-white text-sm">Pensando...</span>
                  </div>
                ) : iaMessage ? (
                  <div className="w-full flex flex-col items-center justify-center text-center bg-gradient-to-r from-slate-800 to-purple-900 rounded-xl shadow-lg p-4">
                    <span className="material-icons text-indigo-300 text-2xl mb-1">
                      auto_awesome
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">
                      Sugerencia de la IA
                    </span>
                    <span className="text-indigo-100 text-sm">{iaMessage}</span>
                  </div>
                ) : null}
              {iaMessage && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={openIaScheduleModal}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
                    title="Agendar sugerencia"
                  >
                    Agendar
                  </button>
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
                    <span className="text-[10px] text-slate-300">
                      {currentYear}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-300 mb-1">
                    {WEEKDAYS.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                    {calendarDays.map((day, idx) => {
                      if (day === null) {
                        // empty cell to align the first day
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="inline-flex items-center justify-center rounded-full px-1 py-[6px]"
                          />
                        );
                      }
                      const date = new Date(currentYear, currentMonth, day);
                      const iso = date.toISOString().slice(0, 10);
                      const isToday =
                        day === today.getDate() &&
                        currentMonth === today.getMonth() &&
                        currentYear === today.getFullYear();
                      const isHoliday = isColHoliday(date);

                      const baseClass =
                        "inline-flex items-center justify-center rounded-full px-1 py-[2px] cursor-pointer";

                      let colorClass = "text-slate-100";
                      if (isHoliday) colorClass = "text-red-400 font-semibold";
                      if (isToday && !selectedDate)
                        colorClass = "bg-rose-500 text-white font-semibold";
                      if (selectedDate === iso)
                        colorClass = "bg-indigo-500 text-white font-semibold";

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDate(iso)}
                          className={`${baseClass} ${colorClass}`}
                          aria-pressed={selectedDate === iso}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* Fixed user info section */}
            <div className="relative flex items-center justify-between mt-2 text-xs text-slate-200 p-2 rounded-xl">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex items-center gap-3 flex-1 hover:bg-[#090d18] rounded-lg px-2 py-1 text-left"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center" />
                )}
                <div className="flex flex-col">
                  <p className="font-semibold leading-tight truncate max-w-[120px]">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.role}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempDurations(userPomodoroDurations);
                  setShowPomodoroConfig(true);
                }}
                className="ml-2 w-9 h-9 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 flex items-center justify-center text-indigo-200 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="Configurar Pomodoro"
              >
                <span className="material-icons text-[20px]">timer</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-12 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-lg py-2 px-4 min-w-[150px] flex flex-col">
                  <button
                    className="text-left text-sm text-red-400 hover:text-red-600 py-1 px-2 rounded transition font-semibold"
                    onClick={handleLogout}
                  >Cerrar sesión</button>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-slate-900/70 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 flex flex-col">
            <header className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-wide truncate pr-4">
                {displayedDate}
              </h2>
            </header>

            <section className="flex-1 overflow-auto no-scrollbar-local">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Tablero de tareas"}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-indigo-300 hover:text-indigo-400"
                  >
                    Ver todas
                  </button>
                )}
              </div>

              {/* Tablero estilo Scrum */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full min-h-[60vh]">
                {[
                  { key: "pendiente", title: "Pendiente" },
                  { key: "ejecutando", title: "Ejecutando" },
                  { key: "finalizada", title: "Completadas" },
                ].map((col) => (
                  <div
                    key={col.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("text/task-id");
                      if (!id) return;
                      const newStatus = col.key === "pendiente" ? "pendiente" : col.key === "ejecutando" ? "ejecutando" : "finalizada";
                      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
                      actualizarTarea(id, { status: newStatus }).catch((err) => {
                        console.error("Error actualizando estado:", err);
                      });
                    }}
                    className="flex flex-col bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-3 md:p-4 min-h-[220px] h-[90%] overflow-auto"
                  >
                    <h4 className="text-center text-sm font-semibold uppercase tracking-wide mb-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 text-indigo-200">
                      {col.title}
                    </h4>
                    <div className="flex-1 flex flex-col gap-3">
                      {groupedTasks[col.key].length === 0 && (
                        <div className="text-[11px] text-slate-500 italic text-center py-2">
                          Sin tareas
                        </div>
                      )}
                      {groupedTasks[col.key].map((task) => {
                        const priorityLower = (task.priority || "").toString().toLowerCase();
                        const borderClass = priorityLower.includes("alta")
                          ? "border-red-600"
                          : priorityLower.includes("media")
                          ? "border-orange-500"
                          : priorityLower.includes("baja")
                          ? "border-emerald-600"
                          : "border-slate-400";
                        const dotClass = priorityLower.includes("alta")
                          ? "bg-red-600"
                          : priorityLower.includes("media")
                          ? "bg-orange-400"
                          : priorityLower.includes("baja")
                          ? "bg-emerald-500"
                          : "bg-slate-400";
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              if (task.id) e.dataTransfer.setData("text/task-id", task.id);
                            }}
                            className="bg-slate-200 text-slate-900 rounded-xl px-4 py-3 shadow group cursor-move relative flex flex-col group transition-all duration-300"
                            style={{
                              minHeight: 'auto',
                              transition: 'padding-bottom 0.3s, min-height 0.3s',
                              paddingBottom: undefined,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${borderClass}`}
                                title={`Prioridad: ${task.priority || '-'}`}
                                aria-hidden
                              >
                                <span className={`${dotClass} w-2.5 h-2.5 rounded-full`} />
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold leading-tight truncate max-w-[140px]">
                                  {task.name}
                                </span>
                                {(task.date || task.time) && (
                                  <span className="text-[10px] text-slate-600">
                                    {task.date} {task.time && `• ${task.time}`}
                                  </span>
                                )}
                                {task.topic && (
                                  <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                    {task.topic}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <div
                                className="flex gap-3 transition-all duration-300 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-16 group-hover:mt-4 group-hover:mb-2"
                                style={{
                                  overflow: 'hidden',
                                  transition: 'opacity 0.3s, max-height 0.3s, margin-top 0.3s, margin-bottom 0.3s',
                                }}
                              >
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow transition-opacity hover:opacity-100 opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  aria-label="Editar"
                                >
                                  <span className="material-icons text-[18px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(task.id)}
                                  className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow transition-opacity hover:opacity-100 opacity-80 focus:outline-none focus:ring-2 focus:ring-red-400"
                                  aria-label="Eliminar"
                                >
                                  <span className="material-icons text-[18px]">close</span>
                                </button>
                                <button
                                  onClick={() => openPomodoroModal(task)}
                                  className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow transition-opacity hover:opacity-100 opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  aria-label="Pomodoro"
                                  title="Iniciar Pomodoro"
                                  style={{ boxShadow: '0 2px 8px rgba(80,0,120,0.15)' }}
                                >
                                  <span className="material-icons text-[18px]">timer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end mt-8 fixed bottom-20 right-6 md:bottom-10 md:right-10 lg:static lg:mt-0 ">
              <button
                onClick={toggleRightPanel}
                className={`w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center text-3xl font-light shadow-lg border border-slate-300 transition-transform ${
                  showRightPanel ? "rotate-45" : ""
                }`}
                aria-label={
                  showRightPanel ? "Cerrar panel de tarea" : "Nueva tarea"
                }
              >
                <span className="material-icons text-[26px]">add</span>
              </button>
            </div>
          </main>
          {/* Modal para nueva tarea (reemplaza panel lateral) */}
          {showRightPanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md bg-indigo-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-indigo-800 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <h2 className="text-center text-lg md:text-xl font-semibold flex-1">Crear Tarea</h2>
                  <button
                    onClick={toggleRightPanel}
                    aria-label="Cerrar"
                    className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-600 text-white flex items-center justify-center shadow"
                  >
                    <span className="material-icons text-[18px]">close</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {/* Nombre */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium" htmlFor="task-name">Nombre</label>
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
                    <label className="text-xs font-medium" htmlFor="task-date">Fecha</label>
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
                    <label className="text-xs font-medium" htmlFor="task-time">Hora</label>
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
                    <label className="text-xs font-medium" htmlFor="task-priority">Prioridad</label>
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
                    <label className="text-xs font-medium" htmlFor="task-status">Estado</label>
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
                    <label className="text-xs font-medium" htmlFor="task-topic">Tema / descripción</label>
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      {/* Modal para agendar a partir de la sugerencia de la IA */}
      {showIaScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-indigo-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-indigo-800 text-slate-100">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">Agendar sugerencia</h3>
              <button
                onClick={closeIaScheduleModal}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-600 text-white flex items-center justify-center shadow"
              >
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-indigo-100">{iaMessage}</p>
              <div className="space-y-1">
                <label className="text-xs font-medium">Nombre</label>
                <input
                  name="name"
                  value={newTask.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium">Fecha</label>
                  <input
                    name="date"
                    type="date"
                    value={newTask.date}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="w-32 space-y-1">
                  <label className="text-xs font-medium">Hora</label>
                  <input
                    name="time"
                    type="time"
                    value={newTask.time}
                    onChange={handleInputChange}
                    className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Prioridad</label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                  <option value="personalizada">Personalizada</option>
                </select>
                {newTask.priority === "personalizada" && (
                  <input
                    name="customPriority"
                    value={newTask.customPriority}
                    onChange={handleInputChange}
                    placeholder="Escribe la prioridad"
                    className="w-full mt-1 rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Estado</label>
                <select
                  name="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="trabajando">Trabajándola</option>
                  <option value="ejecutando">Ejecutando</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Tema / descripción</label>
                <input
                  name="topic"
                  value={newTask.topic || ""}
                  onChange={handleInputChange}
                  placeholder="Descripción corta"
                  className="w-full rounded-xl bg-indigo-800/40 border border-indigo-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={saveIaScheduledTask}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
              >
                Guardar
              </button>
              <button
                onClick={closeIaScheduleModal}
                className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 w-full max-w-xs flex flex-col items-center text-slate-100">
            <span className="material-icons text-red-500 text-4xl mb-2">warning</span>
            <h3 className="text-lg font-semibold mb-2 text-center">¿Eliminar tarea?</h3>
            <p className="text-sm text-center mb-4 text-slate-300">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={confirmDeleteTask}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Eliminar
              </button>
              <button
                onClick={cancelDeleteTask}
                className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de tarea */}
      {showEditModal && editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6 w-full max-w-md text-slate-100">
            <h3 className="text-lg font-semibold mb-4">Editar tarea</h3>
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Nombre</label>
                <input
                  name="name"
                  value={editTask.name || ''}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium">Fecha</label>
                  <input
                    name="date"
                    type="date"
                    value={editTask.date || ''}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="w-32 space-y-1">
                  <label className="text-xs font-medium">Hora</label>
                  <input
                    name="time"
                    type="time"
                    value={editTask.time || ''}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Prioridad</label>
                <select
                  name="priority"
                  value={editPrioritySelectValue}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                  <option value="personalizada">Personalizada</option>
                </select>
                {editPrioritySelectValue === 'personalizada' && (
                  <input
                    name="customPriority"
                    value={editTask.customPriority || editTask.priority || ''}
                    onChange={handleEditChange}
                    placeholder="Escribe la prioridad"
                    className="w-full mt-1 rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Estado</label>
                <select
                  name="status"
                  value={editTask.status || 'pendiente'}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="trabajando">Trabajándola</option>
                  <option value="ejecutando">Ejecutando</option>
                  <option value="finalizada">Finalizada</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Descripción</label>
                <input
                  name="topic"
                  value={editTask.topic || ''}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEditedTask}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                Guardar
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menú inferior para mobile */}
      {!isDesktop && (
        <nav className="sticky bottom-0 w-full bg-slate-950/95 border-t border-slate-800 flex items-center justify-around py-2 text-xs">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-100"
          >
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
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-100"
          >
            <span className="material-icons text-[20px]">settings</span>
            <span>Opciones</span>
          </button>
        </nav>
      )}
      {/* Modal / Full-screen Pomodoro */}
      {showPomodoro && pomodoroTask && (
        isMobileLandscape ? (
          <div className="fixed inset-0 z-50 flex flex-col items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
            <div className="w-full flex justify-between items-center mb-4 max-w-3xl">
              <h2 className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Focus Mode</h2>
              <button
                onClick={requestPomodoroClose}
                className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-sm font-semibold backdrop-blur transition"
              >Cerrar</button>
            </div>
            <div className="flex-1 w-full flex flex-col items-center justify-start max-w-3xl gap-6">
              <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-6 shadow-xl backdrop-blur-lg">
                <PomodoroTimer
                  onClose={requestPomodoroClose}
                  autoStart={true}
                  task={pomodoroTask}
                  fullScreen
                  durations={userPomodoroDurations}
                />
              </div>
              {showPomodoroCloseConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                  <div className="bg-slate-800/80 rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center border border-indigo-700/40 text-slate-100">
                    <span className="material-icons text-indigo-300 text-4xl mb-2">warning</span>
                    <h4 className="text-lg font-semibold mb-2 text-center">¿Cerrar temporizador?</h4>
                    <p className="text-sm text-center mb-4 text-slate-300">Se perderá el tiempo actual.</p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={closePomodoroModal}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition"
                      >Cerrar</button>
                      <button
                        onClick={cancelPomodoroClose}
                        className="flex-1 py-2 rounded-xl bg-indigo-600/40 text-white font-semibold hover:bg-indigo-600/60 transition"
                      >Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) requestPomodoroClose();
            }}
          >
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-8 relative">
              <PomodoroTimer
                onClose={requestPomodoroClose}
                autoStart={true}
                task={pomodoroTask}
                durations={userPomodoroDurations}
              />
              {showPomodoroCloseConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
                  <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center border border-slate-800 text-slate-100">
                    <span className="material-icons text-yellow-400 text-4xl mb-2">warning</span>
                    <h4 className="text-lg font-semibold mb-2 text-center">¿Cerrar temporizador?</h4>
                    <p className="text-sm text-center mb-4">¿Seguro que quieres cerrar el temporizador Pomodoro? El tiempo actual se perderá.</p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={closePomodoroModal}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                      >Cerrar</button>
                      <button
                        onClick={cancelPomodoroClose}
                        className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition"
                      >Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}
      {/* Modal configuración Pomodoro */}
      {showPomodoroConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPomodoroConfig(false); }}
        >
          <div className="w-full max-w-sm bg-slate-900/95 rounded-2xl border border-slate-700 shadow-2xl p-6 text-slate-100 flex flex-col gap-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold">Configurar Pomodoro</h3>
              <button
                type="button"
                onClick={() => setShowPomodoroConfig(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-600"
                aria-label="Cerrar"
              >
                <span className="material-icons text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Personaliza las duraciones (minutos). Se guardan en tu cuenta.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const clean = {
                  pomodoro: Math.min(Math.max(Number(tempDurations.pomodoro) || DEFAULT_DURATIONS.pomodoro, 1), 180),
                  short: Math.min(Math.max(Number(tempDurations.short) || DEFAULT_DURATIONS.short, 1), 60),
                  long: Math.min(Math.max(Number(tempDurations.long) || DEFAULT_DURATIONS.long, 1), 120),
                };
                setUserPomodoroDurations(clean);
                try {
                  if (user && user.uid) {
                    await updateDoc(doc(db, 'usuarios', user.uid), { pomodoroDurations: clean });
                  }
                } catch (err) {
                  console.error('Error guardando duraciones Pomodoro:', err);
                }
                setShowPomodoroConfig(false);
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="durPomodoro" className="text-xs font-medium">Pomodoro</label>
                <input
                  id="durPomodoro"
                  type="number"
                  min={1}
                  max={180}
                  value={tempDurations.pomodoro}
                  onChange={(e) => setTempDurations((prev) => ({ ...prev, pomodoro: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="durShort" className="text-xs font-medium">Descanso Corto</label>
                <input
                  id="durShort"
                  type="number"
                  min={1}
                  max={60}
                  value={tempDurations.short}
                  onChange={(e) => setTempDurations((prev) => ({ ...prev, short: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="durLong" className="text-xs font-medium">Descanso Largo</label>
                <input
                  id="durLong"
                  type="number"
                  min={1}
                  max={120}
                  value={tempDurations.long}
                  onChange={(e) => setTempDurations((prev) => ({ ...prev, long: e.target.value }))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >Guardar</button>
            </form>
            <button
              type="button"
              onClick={() => setShowPomodoroConfig(false)}
              className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-600"
            >Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
