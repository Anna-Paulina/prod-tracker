
import { useState, useRef } from "react";

// CSV format expected: Référence,Machine,Temps_heures
// Example: REF-001,Tour CNC-1,2.5

export default function Parts({ parts, setParts, machines, machiningTimes, setMachiningTimes }) {
  const [csvData, setCsvData] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [manualMachine, setManualMachine] = useState("");
  const [manualTime, setManualTime] = useState("");
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(Boolean);
    const header = lines[0].toLowerCase();
    const dataLines = header.includes("réf") || header.includes("ref") || header.includes("machine")
      ? lines.slice(1) : lines;

    const newTimes = { ...machiningTimes };
    const newParts = new Set(parts.map((p) => p.ref));
    let count = 0;

    for (const line of dataLines) {
      const cols = line.split(/[;,]/).map((c) => c.trim().replace(/"/g, ""));
      if (cols.length < 3) continue;
      const [ref, machineName, timeStr] = cols;
      const time = parseFloat(timeStr.replace(",", "."));
      if (!ref || !machineName || isNaN(time)) continue;

      // Find machine by name
      const machine = machines.find((m) =>
        m.name.toLowerCase() === machineName.toLowerCase()
      );
      if (!machine) continue;

      if (!newTimes[ref]) newTimes[ref] = {};
      newTimes[ref][machine.id] = time;
      newParts.add(ref);
      count++;
    }

    setMachiningTimes(newTimes);
    setParts([...new Set([...parts.map((p) => p.ref), ...newParts])].map((ref) => ({ ref })));
    setCsvData({ count });
    setCsvError("");
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { parseCSV(ev.target.result); }
      catch (err) { setCsvError("Erreur lors de la lecture du CSV : " + err.message); }
    };
    reader.readAsText(file);
  };

  const addManual = () => {
    if (!manualRef.trim() || !manualMachine || !manualTime) return;
    const time = parseFloat(manualTime);
    if (isNaN(time)) return;

    const newTimes = { ...machiningTimes };
    if (!newTimes[manualRef]) newTimes[manualRef] = {};
    newTimes[manualRef][manualMachine] = time;
    setMachiningTimes(newTimes);

    if (!parts.find((p) => p.ref === manualRef)) {
      setParts([...parts, { ref: manualRef }]);
    }
    setManualRef("");
    setManualMachine("");
    setManualTime("");
  };

  const removePart = (ref) => {
    setParts(parts.filter((p) => p.ref !== ref));
    const nt = { ...machiningTimes };
    delete nt[ref];
    setMachiningTimes(nt);
  };

  const getTotalTime = (ref) => {
    const times = machiningTimes[ref] || {};
    return Object.values(times).reduce((a, b) => a + b, 0);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pièces & Références</h1>
        <p className="page-sub">Importez un CSV ou saisissez manuellement les temps d'usinage</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* CSV IMPORT */}
        <div className="card">
          <p className="section-title">📂 Import CSV</p>
          <div
            className="file-upload"
            onClick={() => fileRef.current.click()}
            style={{ marginBottom: 12 }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <strong>Cliquer pour importer un CSV</strong>
            <br />
            <span style={{ fontSize: 11, marginTop: 4, display: "block" }}>
              Format : Référence ; Machine ; Temps_heures
            </span>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={onFile} />

          {csvData && (
            <div style={{ background: "rgba(232,255,71,0.08)", border: "1px solid var(--accent)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--accent)" }}>
              ✓ {csvData.count} lignes importées
            </div>
          )}
          {csvError && (
            <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid var(--accent3)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "var(--accent3)" }}>
              ⚠️ {csvError}
            </div>
          )}

          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface2)", borderRadius: 6, fontSize: 12, color: "var(--text-dim)" }}>
            <strong style={{ color: "var(--text)" }}>Format attendu :</strong><br />
            <span className="mono">Référence;Machine;Temps_heures</span><br />
            <span className="mono" style={{ color: "var(--accent2)" }}>REF-001;Tour CNC-1;2.5</span><br />
            <span className="mono" style={{ color: "var(--accent2)" }}>REF-002;Fraiseuse-2;1.75</span>
          </div>
        </div>

        {/* MANUAL ENTRY */}
        <div className="card">
          <p className="section-title">✏️ Saisie manuelle</p>
          {machines.length === 0 ? (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>⚠️ Ajoutez des machines d'abord.</p>
          ) : (
            <>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Référence pièce (ex: REF-001)"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                />
              </div>
              <div className="input-row">
                <select
                  value={manualMachine}
                  onChange={(e) => setManualMachine(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Machine</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Heures"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  style={{ width: 90 }}
                  min="0" step="0.25"
                />
                <button className="btn btn-accent" onClick={addManual}>+</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PARTS TABLE */}
      {parts.length > 0 && (
        <div className="card">
          <p className="section-title">📋 Références ({parts.length})</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  {machines.map((m) => <th key={m.id}>{m.name}</th>)}
                  <th>Total heures</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.ref}>
                    <td><strong className="mono">{p.ref}</strong></td>
                    {machines.map((m) => {
                      const t = machiningTimes[p.ref]?.[m.id];
                      return (
                        <td key={m.id} className="mono">
                          {t != null ? `${t}h` : <span style={{ color: "var(--text-dim)" }}>—</span>}
                        </td>
                      );
                    })}
                    <td>
                      <span className="badge badge-yellow">{getTotalTime(p.ref).toFixed(2)}h</span>
                    </td>
                    <td><button className="btn btn-danger" onClick={() => removePart(p.ref)}>Suppr.</button></td>
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
