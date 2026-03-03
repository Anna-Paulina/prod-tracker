
import { useState } from "react";

export default function Presence({ presences, setPresences, employees }) {
  const [form, setForm] = useState({ employeeId: "", start: "", end: "" });

  const add = () => {
    if (!form.employeeId || !form.start || !form.end) return;
    if (form.end < form.start) return alert("La date de fin doit être après la date de début.");
    setPresences([...presences, { ...form, id: crypto.randomUUID() }]);
    setForm({ employeeId: form.employeeId, start: "", end: "" });
  };

  const remove = (id) => setPresences(presences.filter((p) => p.id !== id));

  const getEmployee = (id) => employees.find((e) => e.id === id);

  // Calculate working days between two dates (Mon-Fri)
  const workDays = (start, end) => {
    if (!start || !end) return 0;
    let count = 0;
    const s = new Date(start), e = new Date(end);
    const d = new Date(s);
    while (d <= e) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  };

  const totalHours = (start, end) => workDays(start, end) * 7.5;

  // Sort presences by start date
  const sorted = [...presences].sort((a, b) => a.start.localeCompare(b.start));

  // Group by employee for stats
  const stats = employees.map((emp) => {
    const periods = presences.filter((p) => p.employeeId === emp.id);
    const total = periods.reduce((acc, p) => acc + workDays(p.start, p.end), 0);
    return { ...emp, workDays: total, periods: periods.length };
  }).filter((e) => e.periods > 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Présence</h1>
        <p className="page-sub">Gérez les périodes de présence de vos employés</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <p className="section-title">➕ Ajouter une période</p>
          {employees.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>⚠️ Ajoutez des employés d'abord.</p>
          ) : (
            <>
              <div className="input-row">
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-row">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>DATE DÉBUT</label>
                  <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>DATE FIN</label>
                  <input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} style={{ width: "100%" }} />
                </div>
              </div>
              {form.start && form.end && (
                <p style={{ fontSize: 12, color: "var(--accent)", marginBottom: 12 }}>
                  → {workDays(form.start, form.end)} jours ouvrés · {totalHours(form.start, form.end).toFixed(1)}h
                </p>
              )}
              <button className="btn btn-accent" onClick={add}>Ajouter la période</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="stat-card">
            <div className="stat-value">{presences.length}</div>
            <div className="stat-label">PÉRIODES ENREGISTRÉES</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {presences.reduce((acc, p) => acc + workDays(p.start, p.end), 0)}
            </div>
            <div className="stat-label">JOURS OUVRÉS TOTAUX</div>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="card">
          <p className="section-title">📋 Périodes de présence</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Jours ouvrés</th>
                  <th>Heures dispo.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const emp = getEmployee(p.employeeId);
                  const days = workDays(p.start, p.end);
                  return (
                    <tr key={p.id}>
                      <td><strong>{emp?.name || "—"}</strong></td>
                      <td className="mono">{p.start}</td>
                      <td className="mono">{p.end}</td>
                      <td><span className="badge badge-blue">{days}j</span></td>
                      <td className="mono">{(days * 7.5).toFixed(1)}h</td>
                      <td><button className="btn btn-danger" onClick={() => remove(p.id)}>Suppr.</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
