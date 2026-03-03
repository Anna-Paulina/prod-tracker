
import { useState } from "react";

const PERIODS = [
  { key: "2w", label: "2 Semaines" },
  { key: "1m", label: "Mois" },
  { key: "3m", label: "Trimestre" },
];

// Get date range based on period
function getDateRange(period) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  let end;
  if (period === "2w") {
    end = new Date(today);
    end.setDate(end.getDate() + 14);
  } else if (period === "1m") {
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else {
    end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  }
  return { start, end };
}

// Count working days between two date objects
function workDaysBetween(start, end) {
  let count = 0;
  const d = new Date(Math.max(start, new Date(start)));
  const e = new Date(end);
  const s = new Date(start);
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Working days available for an employee in a period
function getEmployeeAvailableHours(employee, presences, periodStart, periodEnd) {
  const empPresences = presences.filter((p) => p.employeeId === employee.id);
  let totalDays = 0;
  for (const p of empPresences) {
    const ps = new Date(p.start);
    const pe = new Date(p.end);
    const overlapStart = new Date(Math.max(ps, periodStart));
    const overlapEnd = new Date(Math.min(pe, periodEnd));
    if (overlapStart <= overlapEnd) {
      totalDays += workDaysBetween(overlapStart, overlapEnd);
    }
  }
  return totalDays * 7.5;
}

function chargeColor(pct) {
  if (pct >= 100) return "#ff6b6b";
  if (pct >= 80) return "#e8ff47";
  return "#4ade80";
}

export default function Dashboard({ employees, presences, machines, parts, machiningTimes }) {
  const [period, setPeriod] = useState("1m");

  // Assignment: which parts on which machines in this period
  // For simplicity, we let user assign parts to this period
  const [assignments, setAssignments] = useState([]); // { id, partRef, machineId, qty }
  const [assignForm, setAssignForm] = useState({ partRef: "", machineId: "", qty: 1 });

  const { start: periodStart, end: periodEnd } = getDateRange(period);
  const periodDays = workDaysBetween(periodStart, periodEnd);

  const addAssignment = () => {
    if (!assignForm.partRef || !assignForm.machineId) return;
    setAssignments([...assignments, { ...assignForm, id: crypto.randomUUID(), qty: parseInt(assignForm.qty) || 1 }]);
    setAssignForm({ partRef: assignForm.partRef, machineId: assignForm.machineId, qty: 1 });
  };

  const removeAssignment = (id) => setAssignments(assignments.filter((a) => a.id !== id));

  // For each machine, calculate total load hours from assignments
  const machineLoad = (machineId) => {
    return assignments
      .filter((a) => a.machineId === machineId)
      .reduce((acc, a) => {
        const t = machiningTimes[a.partRef]?.[machineId] || 0;
        return acc + t * a.qty;
      }, 0);
  };

  // For each employee, calculate available hours in period and load
  const employeeData = employees.map((emp) => {
    const availableHours = getEmployeeAvailableHours(emp, presences, periodStart, periodEnd);
    // Load = sum of machine hours for machines they can operate that are in assignments
    const loadHours = emp.machines.reduce((acc, machineId) => {
      return acc + machineLoad(machineId);
    }, 0);
    // Assign load proportionally (divide by # of qualified employees per machine)
    return { emp, availableHours, loadHours };
  });

  const fmt = (d) => d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">Charge & disponibilité · {fmt(periodStart)} → {fmt(periodEnd)} · {periodDays} jours ouvrés</p>
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
        <p className="section-title">📦 Affecter des pièces à la période</p>
        {parts.length === 0 || machines.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>⚠️ Ajoutez des pièces et machines d'abord.</p>
        ) : (
          <>
            <div className="input-row">
              <select value={assignForm.partRef} onChange={(e) => setAssignForm({ ...assignForm, partRef: e.target.value })} style={{ flex: 1 }}>
                <option value="">Référence pièce</option>
                {parts.map((p) => <option key={p.ref} value={p.ref}>{p.ref}</option>)}
              </select>
              <select value={assignForm.machineId} onChange={(e) => setAssignForm({ ...assignForm, machineId: e.target.value })} style={{ flex: 1 }}>
                <option value="">Machine</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="number" min={1} placeholder="Qté" value={assignForm.qty} onChange={(e) => setAssignForm({ ...assignForm, qty: e.target.value })} style={{ width: 70 }} />
              <button className="btn btn-accent" onClick={addAssignment}>Affecter</button>
            </div>
            {assignments.length > 0 && (
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Machine</th>
                      <th>Qté</th>
                      <th>Heures totales</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => {
                      const machine = machines.find((m) => m.id === a.machineId);
                      const unitTime = machiningTimes[a.partRef]?.[a.machineId] || 0;
                      const total = unitTime * a.qty;
                      return (
                        <tr key={a.id}>
                          <td className="mono"><strong>{a.partRef}</strong></td>
                          <td>{machine?.name || "—"}</td>
                          <td className="mono">{a.qty}</td>
                          <td><span className="badge badge-yellow">{total.toFixed(2)}h</span></td>
                          <td><button className="btn btn-danger" onClick={() => removeAssignment(a.id)}>×</button></td>
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
              const capacity = periodDays * 7.5;
              const pct = capacity > 0 ? Math.min((load / capacity) * 100, 120) : 0;
              const color = chargeColor((load / capacity) * 100);
              return (
                <div key={m.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span><strong>{m.name}</strong></span>
                    <span className="mono" style={{ color }}>
                      {load.toFixed(1)}h / {capacity.toFixed(1)}h — <strong>{capacity > 0 ? ((load / capacity) * 100).toFixed(0) : 0}%</strong>
                    </span>
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
                  <th>Heures disponibles</th>
                  <th>Autonome</th>
                  <th>Machines qualifiées</th>
                  <th>Charge estimée</th>
                  <th>Taux</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map(({ emp, availableHours }) => {
                  const load = assignments
                    .filter((a) => emp.machines.includes(a.machineId))
                    .reduce((acc, a) => {
                      const t = machiningTimes[a.partRef]?.[a.machineId] || 0;
                      // Count how many employees can do this machine
                      const qualified = employees.filter((e) => e.machines.includes(a.machineId)).length;
                      return acc + (t * a.qty) / Math.max(1, qualified);
                    }, 0);

                  const pct = availableHours > 0 ? (load / availableHours) * 100 : 0;
                  const color = chargeColor(pct);

                  return (
                    <tr key={emp.id}>
                      <td><strong>{emp.name}</strong></td>
                      <td className="mono">{availableHours.toFixed(1)}h</td>
                      <td>{emp.autonomous ? <span className="badge badge-green">✓ Oui</span> : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>}</td>
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
                        <div style={{ minWidth: 120 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span className="mono">{load.toFixed(1)}h</span>
                            <span style={{ color }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="charge-bar-bg">
                            <div className="charge-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: pct >= 100 ? "#2d1010" : pct >= 80 ? "#2d2a00" : "#1a3320",
                          color
                        }}>
                          {pct >= 100 ? "Surchargé" : pct >= 80 ? "Chargé" : pct > 0 ? "Disponible" : "Libre"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {employees.some((e) => getEmployeeAvailableHours(e, presences, periodStart, periodEnd) === 0) && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 6, fontSize: 12, color: "var(--accent3)" }}>
              ⚠️ Certains employés n'ont pas de périodes de présence sur cette période.
            </div>
          )}
        </div>
      )}

      {employees.length === 0 && machines.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <strong>Aucune donnée à afficher</strong><br />
          <span>Configurez vos machines, employés et présences dans les autres pages.</span>
        </div>
      )}
    </div>
  );
}
