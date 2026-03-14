import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSimulationStore } from "../store/useSimulationStore";

export function RunSimulationPage() {
  const navigate = useNavigate();
  const setSimulationInput = useSimulationStore((s) => s.setSimulationInput);

  const [trigger, setTrigger] = useState("");
  const [numAgents, setNumAgents] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!trigger.trim()) {
      errs.trigger = "Trigger is required.";
    }
    if (!numAgents.trim()) {
      errs.numAgents = "Number of agents is required.";
    } else {
      const n = Number(numAgents);
      if (Number.isNaN(n) || !Number.isInteger(n)) {
        errs.numAgents = "Must be a whole number.";
      } else if (n < 1) {
        errs.numAgents = "Must be at least 1.";
      }
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSimulationInput(trigger.trim(), Number(numAgents));
    navigate("/explorer");
  };

  const isFormValid = trigger.trim() !== "" && numAgents.trim() !== "" && Number(numAgents) >= 1;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-aurora-bg0 p-8">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <img src="/logo-no-bg (1).png" alt="" className="h-10 w-10 object-contain" aria-hidden />
        <img src="/epistemea.png" alt="EPISTEMEA" className="h-7 w-auto object-contain" />
      </Link>
      <div className="surface-elevated w-full max-w-lg rounded-2xl border border-aurora-border/40 p-8 shadow-aurora-glow-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-aurora-text0">
          Run Simulation
        </h1>
        <p className="mb-6 text-base text-aurora-text2">
          Enter a trigger event and the number of agents. You&apos;ll go to the explorer and can run
          the simulation when ready.
        </p>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="trigger"
              className="mb-2 block text-base font-medium text-aurora-text1"
            >
              Trigger / Event
            </label>
            <textarea
              id="trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g. We are proposing a reform to the retirement system..."
              rows={4}
              className="w-full rounded-lg border border-aurora-border/70 bg-aurora-surface0/80 px-3 py-2.5 text-base text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50"
            />
            {validationErrors.trigger && (
              <p className="mt-1.5 text-sm text-aurora-danger">{validationErrors.trigger}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="numAgents"
              className="mb-2 block text-base font-medium text-aurora-text1"
            >
              Number of agents
            </label>
            <input
              id="numAgents"
              type="number"
              min={1}
              value={numAgents}
              onChange={(e) => setNumAgents(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-aurora-border/70 bg-aurora-surface0/80 px-3 py-2.5 text-base text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50"
            />
            <p className="mt-1 text-sm text-aurora-text2">
              Any positive whole number
            </p>
            {validationErrors.numAgents && (
              <p className="mt-1.5 text-sm text-aurora-danger">{validationErrors.numAgents}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="aurora-gradient flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
          >
            Generate society
          </button>
        </form>
      </div>
    </div>
  );
}
