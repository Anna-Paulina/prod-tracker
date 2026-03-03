
import { useState } from "react";

export default function MachinesSkills({ machines, setMachines, skills, setSkills }) {
  const [machineName, setMachineName] = useState("");
  const [skillName, setSkillName] = useState("");

  const addMachine = () => {
    if (!machineName.trim()) return;
    setMachines([...machines, { id: crypto.randomUUID(), name: machineName.trim() }]);
    setMachineName("");
  };

  const removeMachine = (id) => setMachines(machines.filter((m) => m.id !== id));

  const addSkill = () => {
    if (!skillName.trim()) return;
    setSkills([...skills, { id: crypto.randomUUID(), name: skillName.trim() }]);
    setSkillName("");
  };

  const removeSkill = (id) => setSkills(skills.filter((s) => s.id !== id));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Machines & Compétences</h1>
        <p className="page-sub">Configurez vos machines et les compétences disponibles</p>
      </div>

      <div className="grid-2">
        {/* MACHINES */}
        <div className="card">
          <p className="section-title">⚙️ Machines</p>
          <div className="input-row">
            <input
              type="text"
              placeholder="Nom de la machine (ex: Tour CNC-1)"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMachine()}
            />
            <button className="btn btn-accent" onClick={addMachine}>Ajouter</button>
          </div>
          {machines.length === 0 ? (
            <div className="empty-state">Aucune machine ajoutée</div>
          ) : (
            <div className="chip-list">
              {machines.map((m) => (
                <div key={m.id} className="chip">
                  <span>{m.name}</span>
                  <button onClick={() => removeMachine(m.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKILLS */}
        <div className="card">
          <p className="section-title">🎯 Compétences</p>
          <div className="input-row">
            <input
              type="text"
              placeholder="Nom de la compétence (ex: Fraisage)"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <button className="btn btn-accent" onClick={addSkill}>Ajouter</button>
          </div>
          {skills.length === 0 ? (
            <div className="empty-state">Aucune compétence ajoutée</div>
          ) : (
            <div className="chip-list">
              {skills.map((s) => (
                <div key={s.id} className="chip">
                  <span>{s.name}</span>
                  <button onClick={() => removeSkill(s.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text-dim)" }}>
        💡 Ces données seront disponibles dans les autres pages pour configurer les employés et les pièces.
      </div>
    </div>
  );
}
