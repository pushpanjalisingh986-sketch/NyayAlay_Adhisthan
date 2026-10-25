import { useEffect, useState } from 'react';
import { listProcedures, startProcedure, chooseProcedureOption } from '../api';

type ProcedureSummary = { id: string; title: string; description: string };
type Step = {
  id: string;
  title: string;
  body: string;
  options?: { id: string; label: string; nextStepId: string }[];
  helpline?: string;
};

export default function ProceduresPage() {
  const [list, setList] = useState<ProcedureSummary[]>([]);
  const [procedureId, setProcedureId] = useState('');
  const [step, setStep] = useState<Step | null>(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    listProcedures()
      .then((data) => {
        const items = Array.isArray(data) ? data : data.value || data;
        setList(items);
      })
      .catch(() => setError('Failed to load procedures'));
  }, []);

  async function onStart(id: string) {
    setError('');
    try {
      const data = await startProcedure(id);
      setProcedureId(id);
      setStep(data.step);
      setDisclaimer(data.disclaimer || '');
    } catch {
      setError('Failed to start procedure');
    }
  }

  async function onChoose(optionId: string) {
    if (!procedureId || !step) return;
    setError('');
    try {
      const data = await chooseProcedureOption(procedureId, step.id, optionId);
      setStep(data.step);
      setDisclaimer(data.disclaimer || '');
    } catch {
      setError('Failed to choose option');
    }
  }

  return (
    <div className="page">
      <h2>Procedure Navigator</h2>
      <p className="muted">Guided general information flows. Not legal advice.</p>
      {!step && (
        <div className="cards">
          {list.map((p) => (
            <button key={p.id} className="card" onClick={() => onStart(p.id)}>
              <strong>{p.title}</strong>
              <div className="muted">{p.description}</div>
            </button>
          ))}
        </div>
      )}
      {step && (
        <div className="step-card">
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          {step.helpline && <p className="helpline">Helpline: {step.helpline}</p>}
          {disclaimer && <p className="disclaimer">{disclaimer}</p>}
          <div className="row wrap">
            {(step.options || []).map((o) => (
              <button key={o.id} onClick={() => onChoose(o.id)}>
                {o.label}
              </button>
            ))}
            <button className="secondary" onClick={() => setStep(null)}>
              Back to list
            </button>
          </div>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}