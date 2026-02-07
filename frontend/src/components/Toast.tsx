import { useUIStore } from "../store/useUIStore";

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[280px] rounded-lg border px-4 py-3 shadow-card ${
            t.type === "error"
              ? "border-aurora-danger/50 bg-aurora-surface1"
              : "border-aurora-success/50 bg-aurora-surface1"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-aurora-text0">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-aurora-text1 hover:text-aurora-text0 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-accent1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
