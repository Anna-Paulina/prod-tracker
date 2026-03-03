
import { useState } from "react";

export default function Employees({ employees, setEmployees, skills, machines }) {
  const [form, setForm] = useState({ name: "", skills: [], machines: [], autonomous: false });
  const [editing, setEditing] = useState(null);

  const toggleSkill = (id) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(id) ? f.skills.filter((s) => s !== id) : [...f.skills, id],
    }));
  };

  const toggleMachine = (id) => {
    setForm((f) => ({
      ...f,
      machines: f.machines.includes(id) ? f.machines.filter((m) => m !== id) : [...f.machines, id],
    }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setEmployees(employees.map((e) => (e.id === editing ? { ...form, id: editing } : e)));
      setEditing(null);
    } else {
      setEmployees([...employees, { ...form, id: crypto.randomUUID() }]);
    }
    setForm({ name: "", skills: [], machines: [], autonomous: false });
  };

  const edit = (emp) => {
    setForm({ name: emp.name, skills: emp.skills, machines: emp.machines, autonomous: emp.autonomous });
    setEditing(emp.id);
  };

  const remove = (id) => setEmployees(employees.filter((e) => e.id !== id));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employés</h1>
        <p className="page-sub">Gérez les compétences et habilitations de votre équipe</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <p className="section-title">{editing ? "✏️ Modifier l'employé" : "➕ Nouvel employé"}</p>
          <div className="input-row" style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Prénom Nom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {skills.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="section-title" style={{ marginBottom: 8 }}>Compétences</p>
              <div className="chip-list">
                {skills.map((s) => (
                  <div
                    key={s.id}
                    className="chip"
                    style={{
                      cursor: "pointer",
                      borderColor: form.skills.includes(s.id) ? "var(--accent)" : "var(--border)",
                      background: form.skills.includes(s.id) ? "rgba(232,255,71,0.1)" : "var(--surface2)",
                    }}
                    onClick={() => toggleSkill(s.id)}
                  >
                    {form.skills.includes(s.id) ? "✓ " : ""}{s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {machines.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="section-title" style={{ marginBottom: 8 }}>Machines</p>
              <div className="chip-list">
                {machines.map((m) => (
                  <div
                    key={m.id}
                    className="chip"
                    style={{
                      cursor: "pointer",
                      borderColor: form.machines.includes(m.id) ? "var(--accent2)" : "var(--border)",
                      background: form.machines.includes(m.id) ? "rgba(71,200,255,0.1)" : "var(--surface2)",
                    }}
                    onClick={() => toggleMachine(m.id)}
                  >
                    {form.machines.includes(m.id) ? "✓ " : ""}⚙️ {m.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="checkbox-label" style={{ marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={form.autonomous}
              onChange={(e) => setForm({ ...form, autonomous: e.target.checked })}
            />
            Autonome (peut travailler sans supervision)
          </label>

          <div className="input-row">
            <button className="btn btn-accent" onClick={save}>{editing ? "Mettre à jour" : "Ajouter"}</button>
            {editing && (
              <button className="btn btn-ghost" onClick={() => { setEditing(null); setForm({ name: "", skills: [], machines: [], autonomous: false }); }}>
                Annuler
              </button>
            )}
          </div>

          {(skills.length === 0 && machines.length === 0) && (
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
              ⚠️ Ajoutez des machines et compétences dans la première page d'abord.
            </p>
          )}
        </div>

        {/* STATS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="stat-card">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">EMPLOYÉS TOTAL</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {employees.filter((e) => e.autonomous).length}
            </div>
            <div className="stat-label">AUTONOMES</div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {employees.length > 0 && (
        <div className="card">
          <p className="section-title">📋 Liste des employés</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Compétences</th>
                  <th>Machines</th>
                  <th>Autonome</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td><strong>{emp.name}</strong></td>
                    <td>
                      <div className="chip-list">
                        {emp.skills.map((sid) => {
                          const s = skills.find((x) => x.id === sid);
                          return s ? <span key={sid} className="badge badge-blue">{s.name}</span> : null;
                        })}
                        {emp.skills.length === 0 && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="chip-list">
                        {emp.machines.map((mid) => {
                          const m = machines.find((x) => x.id === mid);
                          return m ? <span key={mid} className="badge badge-yellow">{m.name}</span> : null;
                        })}
                        {emp.machines.length === 0 && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td>
                      {emp.autonomous
                        ? <span className="badge badge-green">Oui</span>
                        : <span className="badge" style={{ background: "var(--surface2)", color: "var(--text-dim)" }}>Non</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => edit(emp)}>Éditer</button>
                        <button className="btn btn-danger" onClick={() => remove(emp.id)}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
