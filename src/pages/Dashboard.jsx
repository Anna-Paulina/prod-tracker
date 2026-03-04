import { useState } from "react";
import { workDaysBetween, employeeAvailableHours } from "./Presence";

const PERIODS = [
  { key: "2w", label: "2 Semaines" },
  { key: "1m", label: "Mois" },
  { key: "3m", label: "Trimestre" },
];

function getDateRange(period) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  let end;
  if (period === "2w") { end = new Date(today); end.setDate(end.getDate() + 14); }
  else if (period === "1m") { end = new Date(today.getFullYear(), today.getMonth() + 1, 0); }
  else { end = new Date(today.getFullYear(), today.getMonth() + 3, 0); }
  return { start, end };
}

function chargeColor(pct) {
  if (pct >= 100) return "#ff6b6b";
  if (pct >= 80) return "#e8ff47";
  return "#4ade80";
}

export default function Dashboard({ employees, presences, machines, parts, machiningTimes, assignments, setAssignments }) {
  const [period, setPeriod] = useState("1m");
  const [form, setForm] = useState({ partRef: "", machineId: "", qty: 1 });

  const { start: periodStart, end: periodEnd } = getDateRange(period);
  const periodDays = workDaysBetween(periodStart, periodEnd);

  const addAssignment = () => {
    if (!form.partRef || !form.machineId) return;
    setAssignments((prev) => [...prev, { ...form, id: crypto.randomUUID(), qty: parseInt(form.qty) || 1 }]);
    setForm((f) => ({ ...f, qty: 1 }));
  };

  const machineLoad = (machineId) =>
    assignments.filter((a) => a.machineId === machineId)
      .reduce((acc, a) => acc + (machiningTimes[a.partRef]?.[machineId] || 0) * a.qty, 0);

  const fmt = (d) => d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">Charge & disponibilité · {fmt(periodStart)} → {fmt(periodEnd)} · {periodDays} jours ouvrés · base 40h/sem</p>
        </div>
        <div className="period-toggle">
          {PERIODS.map((p) => (
            <button key={p.key} className={`period-btn ${period === p.key ? "active" : ""}`} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ASSIGNMENTS */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-title">📦 Planning de pièces</p>
        {assignments.length === 0 && parts.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>⚠️ Importez un CSV dans la page Pièces pour alimenter le planning automatiquement.</p>
        ) : (
          <>
            {parts.length > 0 && machines.length > 0 && (
              <div className="input-row" style={{ marginBottom: 12 }}>
                <select value={form.partRef} onChange={(e) => setForm({ ...form, partRef: e.target.value })} style={{ flex: 1 }}>
                  <option value="">Référence pièce</option>
                  {parts.map((p) => <option key={p.ref} value={p.ref}>{p.ref}</option>)}
                </select>
                <select value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} style={{ flex: 1 }}>
                  <option value="">Machine</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input type="number" min={1} placeholder="Qté" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ width: 70 }} />
                <button className="btn btn-accent" onClick={addAssignment}>+ Ajouter</button>
                {assignments.length > 0 && (
                  <button className="btn btn-danger" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setAssignments([])}>Vider</button>
                )}
              </div>
            )}
            {assignments.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Référence</th><th>Machine</th><th>Qté</th><th>Heures totales</th><th></th></tr></thead>
                  <tbody>
                    {assignments.map((a) => {
                      const machine = machines.find((m) => m.id === a.machineId);
                      const unitTime = machiningTimes[a.partRef]?.[a.machineId] || 0;
                      return (
                        <tr key={a.id}>
                          <td className="mono"><strong>{a.partRef}</strong></td>
                          <td>{machine?.name || "—"}</td>
                          <td className="mono">{a.qty}</td>
                          <td><span className="badge badge-yellow">{(unitTime * a.qty).toFixed(2)}h</span></td>
                          <td><button className="btn btn-danger" onClick={() => setAssignments(assignments.filter((x) => x.id !== a.id))}>×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* MACHINE CHARGE */}
      {machines.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="section-title">⚙️ Charge machines</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {machines.map((m) => {
              const load = machineLoad(m.id);
              const capacity = periodDays * 8;
              const pct = capacity > 0 ? (load / capacity) * 100 : 0;
              const color = chargeColor(pct);
              return (
                <div key={m.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span><strong>{m.name}</strong></span>
                    <span className="mono" style={{ color }}>{load.toFixed(1)}h / {capacity.toFixed(1)}h — <strong>{pct.toFixed(0)}%</strong></span>
                  </div>
                  <div className="charge-bar-bg">
                    <div className="charge-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPLOYEE AVAILABILITY */}
      {employees.length > 0 && (
        <div className="card">
          <p className="section-title">👷 Disponibilité employés</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Heures dispo.</th>
                  <th>Machines</th>
                  <th>Charge estimée</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const avail = employeeAvailableHours(emp, presences, periodStart, periodEnd);
                  const load = assignments
                    .filter((a) => emp.machines.includes(a.machineId))
                    .reduce((acc, a) => {
                      const t = machiningTimes[a.partRef]?.[a.machineId] || 0;
                      const qualified = employees.filter((e) => e.machines.includes(a.machineId)).length;
                      return acc + (t * a.qty) / Math.max(1, qualified);
                    }, 0);

                  const pct = avail > 0 ? (load / avail) * 100 : 0;
                  const color = chargeColor(pct);
                  const label = pct >= 100 ? "Surchargé" : pct >= 80 ? "Chargé" : load > 0 ? "Disponible" : "Libre";
                  const badgeBg = pct >= 100 ? "#2d1010" : pct >= 80 ? "#2d2a00" : "#1a3320";

                  const absenceDays = presences
                    .filter((p) => p.employeeId === emp.id)
                    .reduce((acc, p) => {
                      const os = new Date(Math.max(new Date(p.start), periodStart));
                      const oe = new Date(Math.min(new Date(p.end), periodEnd));
                      if (os > oe) return acc;
                      return acc + workDaysBetween(os, oe);
                    }, 0);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.name}</strong>
                        {emp.autonomous && <span className="badge badge-green" style={{ marginLeft: 6 }}>auto</span>}
                        {absenceDays > 0 && <span className="badge badge-red" style={{ marginLeft: 6 }}>−{absenceDays}j abs.</span>}
                      </td>
                      <td className="mono">{avail.toFixed(0)}h</td>
                      <td>
                        <div className="chip-list">
                          {emp.machines.map((mid) => {
                            const machine = machines.find((x) => x.id === mid);
                            return machine ? <span key={mid} className="badge badge-yellow">{machine.name}</span> : null;
                          })}
                          {emp.machines.length === 0 && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Aucune</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ minWidth: 130 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span className="mono">{load.toFixed(1)}h</span>
                            <span style={{ color }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="charge-bar-bg">
                            <div className="charge-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                          </div>
                        </div>
                      </td>
                      <td><span className="badge" style={{ background: badgeBg, color }}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {employees.length === 0 && machines.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <strong>Aucune donnée à afficher</strong><br />
          <span>Configurez vos machines, employés et importez un CSV de pièces.</span>
        </div>
      )}
    </div>
  );
}
