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
          className={`min-w-[280px] rounded-lg border px-4 py-3 shadow-lg ${
            t.type === "error"
              ? "border-red-500/60 bg-dark-800"
              : "border-emerald-500/60 bg-dark-800"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-200">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
