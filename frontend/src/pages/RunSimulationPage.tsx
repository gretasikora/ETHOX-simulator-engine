import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSimulationStore } from "../store/useSimulationStore";

export function RunSimulationPage() {
  const navigate = useNavigate();
  const setSimulationInput = useSimulationStore((s) => s.setSimulationInput);

  const [trigger, setTrigger] = useState("");
  const [numAgents, setNumAgents] = useState(100);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!trigger.trim()) {
      errs.trigger = "Trigger is required.";
    }
    const n = Number(numAgents);
    if (Number.isNaN(n) || !Number.isInteger(n)) {
      errs.numAgents = "Must be a whole number.";
    } else if (n < 10 || n > 5000) {
      errs.numAgents = "Must be between 10 and 5000.";
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

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-aurora-bg0 p-8">
      <div className="mb-6 w-full max-w-lg text-left">
        <Link
          to="/explorer"
          className="text-sm text-aurora-text2 transition-colors hover:text-aurora-accent1"
        >
          ← Skip to Explorer
        </Link>
      </div>
      <div className="surface-elevated w-full max-w-lg rounded-2xl border border-aurora-border/40 p-8 shadow-aurora-glow-sm">
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-aurora-text0">
          Run Simulation
        </h1>
        <p className="mb-6 text-sm text-aurora-text2">
          Enter a trigger event and the number of agents. You&apos;ll go to the explorer and can run
          the simulation when ready.
        </p>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="trigger"
              className="mb-2 block text-sm font-medium text-aurora-text1"
            >
              Trigger / Event
            </label>
            <textarea
              id="trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g. The market has added a new selection of kitchenware..."
              rows={4}
              className="w-full rounded-lg border border-aurora-border/70 bg-aurora-surface0/80 px-3 py-2.5 text-sm text-aurora-text0 placeholder-aurora-text2 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50"
            />
            {validationErrors.trigger && (
              <p className="mt-1.5 text-xs text-aurora-danger">{validationErrors.trigger}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="numAgents"
              className="mb-2 block text-sm font-medium text-aurora-text1"
            >
              Number of agents
            </label>
            <input
              id="numAgents"
              type="number"
              min={10}
              max={5000}
              step={10}
              value={numAgents}
              onChange={(e) => setNumAgents(Number(e.target.value) || 10)}
              className="w-full rounded-lg border border-aurora-border/70 bg-aurora-surface0/80 px-3 py-2.5 text-sm text-aurora-text0 focus:border-aurora-accent1 focus:outline-none focus:ring-1 focus:ring-aurora-accent1/50"
            />
            <p className="mt-1 text-xs text-aurora-text2">
              Min 10, max 5000, step 10
            </p>
            {validationErrors.numAgents && (
              <p className="mt-1.5 text-xs text-aurora-danger">{validationErrors.numAgents}</p>
            )}
          </div>

          <button
            type="submit"
            className="aurora-gradient flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-aurora-bg0 shadow-aurora-glow-sm transition-all hover:opacity-95 hover:shadow-aurora-glow active:scale-[0.98]"
          >
            Continue to Explorer
          </button>
        </form>
      </div>
    </div>
  );
}
