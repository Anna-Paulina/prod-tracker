import { useState } from "react";
import MachinesSkills from "./pages/MachinesSkills";
import Employees from "./pages/Employees";
import Presence from "./pages/Presence";
import Parts from "./pages/Parts";
import Dashboard from "./pages/Dashboard";
import "./App.css";

const PAGES = [
  { id: "machines", label: "Machines & Compétences", icon: "⚙️" },
  { id: "employees", label: "Employés", icon: "👷" },
  { id: "presence", label: "Présence", icon: "📅" },
  { id: "parts", label: "Pièces & Références", icon: "🔩" },
  { id: "dashboard", label: "Tableau de bord", icon: "📊" },
];

export default function App() {
  const [page, setPage] = useState("machines");
  const [machines, setMachines] = useState([]);
  const [skills, setSkills] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [presences, setPresences] = useState([]);
  const [parts, setParts] = useState([]);
  const [machiningTimes, setMachiningTimes] = useState({}); // { partRef: { machineId: hours } }
  const [assignments, setAssignments] = useState([]); // lifted from Dashboard so Parts can populate it

  const shared = {
    machines, setMachines,
    skills, setSkills,
    employees, setEmployees,
    presences, setPresences,
    parts, setParts,
    machiningTimes, setMachiningTimes,
    assignments, setAssignments,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">ProdTrack</span>
        </div>
        <nav>
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={`nav-btn ${page === p.id ? "active" : ""}`}
              onClick={() => setPage(p.id)}
            >
              <span className="nav-icon">{p.icon}</span>
              <span className="nav-label">{p.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">
        {page === "machines" && <MachinesSkills {...shared} />}
        {page === "employees" && <Employees {...shared} />}
        {page === "presence" && <Presence {...shared} />}
        {page === "parts" && <Parts {...shared} />}
        {page === "dashboard" && <Dashboard {...shared} />}
      </main>
    </div>
  );
}
