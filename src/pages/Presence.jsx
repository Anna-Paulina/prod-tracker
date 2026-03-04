import { useState } from "react";

// Exported helper: working days between two Date objects
export function workDaysBetween(start, end) {
  let count = 0;
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Available hours for an employee in a date range:
// 40h/week by default, minus absence hours (with half-day support)
export function employeeAvailableHours(emp, absences, periodStart, periodEnd) {
  const totalDays = workDaysBetween(periodStart, periodEnd);
  const totalHours = (totalDays / 5) * 40;

  const absentHours = absences
    .filter((a) => a.employeeId === emp.id)
    .reduce((acc, a) => {
      const as = new Date(a.start);
      const ae = new Date(a.end);
      const os = new Date(Math.max(as, periodStart));
      const oe = new Date(Math.min(ae, periodEnd));
      if (os > oe) return acc;
      const days = workDaysBetween(os, oe);
      let hours = days * 8;
      // Deduct half-day only if the clipped range still includes the relevant edge
      if (a.halfDay === "start" && os.getTime() === as.getTime()) hours -= 4;
      if (a.halfDay === "end" && oe.getTime() === ae.getTime()) hours -= 4;
      return acc + Math.max(0, hours);
    }, 0);

  return Math.max(0, totalHours - absentHours);
}

export default function Presence({ presences, setPresences, employees }) {
  const [form, setForm] = useState({ employeeId: "", start: "", end: "", halfDay: "none" });

  // halfDay: "none" | "start" | "end"
  // "start" = première demi-journée absente seulement  
  // "end"   = dernière demi-journée absente seulement

  const add = () => {
    if (!form.employeeId || !form.start || !form.end) return;
    if (form.end < form.start) return alert("La date de fin doit être après la date de début.");
    setPresences([...presences, { ...form, id: crypto.randomUUID() }]);
    setForm({ employeeId: form.employeeId, start: "", end: "", halfDay: "none" });
  };

  const workDays = (start, end) => workDaysBetween(new Date(start), new Date(end));

  // Hours deducted accounting for half-day option
  const absenceHours = (p) => {
    const days = workDays(p.start, p.end);
    const full = days * 8;
    if (p.halfDay === "start" || p.halfDay === "end") return full - 4;
    return full;
  };

  const sorted = [...presences].sort((a, b) => a.start.localeCompare(b.start));

  const totalAbsentDays = presences.reduce((acc, p) => acc + workDays(p.start, p.end), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Absences</h1>
        <p className="page-sub">Les employés sont disponibles 40h/semaine par défaut — saisissez ici les absences</p>
      </div>

      <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(232,255,71,0.06)", border: "1px solid rgba(232,255,71,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text-dim)" }}>
        💡 <strong style={{ color: "var(--text)" }}>Base : 40h/semaine (8h/jour, lun–ven)</strong> — Les périodes saisies ici sont des <strong style={{ color: "var(--accent3)" }}>absences</strong> et seront déduites de la disponibilité dans le tableau de bord.
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <p className="section-title">➕ Ajouter une absence</p>
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
                  <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>DÉBUT</label>
                  <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>FIN</label>
                  <input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} style={{ width: "100%" }} />
                </div>
              </div>
              {form.start && form.end && form.end >= form.start && (() => {
                const days = workDays(form.start, form.end);
                const h = days * 8 - (form.halfDay !== "none" ? 4 : 0);
                return (
                  <p style={{ fontSize: 12, color: "var(--accent3)", marginBottom: 12 }}>
                    − {days} jour{days > 1 ? "s" : ""} ouvré{days > 1 ? "s" : ""}{form.halfDay !== "none" ? " (−½j)" : ""} · {h}h déduites
                  </p>
                );
              })()}
              <div className="input-row" style={{ marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>DEMI-JOURNÉE</label>
                  <select value={form.halfDay} onChange={(e) => setForm({ ...form, halfDay: e.target.value })} style={{ width: "100%" }}>
                    <option value="none">Journées complètes</option>
                    <option value="start">½ journée au début</option>
                    <option value="end">½ journée à la fin</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-accent" onClick={add}>Enregistrer l'absence</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="stat-card">
            <div className="stat-value">{presences.length}</div>
            <div className="stat-label">ABSENCES ENREGISTRÉES</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent3)" }}>
              {totalAbsentDays}
            </div>
            <div className="stat-label">JOURS OUVRÉS ABSENTS</div>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="card">
          <p className="section-title">📋 Absences enregistrées</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Jours ouvrés</th>
                  <th>Heures déduites</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const emp = employees.find((e) => e.id === p.employeeId);
                  const days = workDays(p.start, p.end);
                  const hours = absenceHours(p);
                  const halfLabel = p.halfDay === "start" ? " (½ début)" : p.halfDay === "end" ? " (½ fin)" : "";
                  return (
                    <tr key={p.id}>
                      <td><strong>{emp?.name || "—"}</strong></td>
                      <td className="mono">{p.start}{p.halfDay === "start" ? " ½" : ""}</td>
                      <td className="mono">{p.end}{p.halfDay === "end" ? " ½" : ""}</td>
                      <td><span className="badge badge-red">{days}j{halfLabel}</span></td>
                      <td className="mono" style={{ color: "var(--accent3)" }}>−{hours}h</td>
                      <td><button className="btn btn-danger" onClick={() => setPresences(presences.filter((x) => x.id !== p.id))}>Suppr.</button></td>
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
