interface ClusterOption {
  id: number;
  count: number;
  color: string;
}

interface MultiSelectProps {
  options: ClusterOption[];
  selected: number[];
  onChange: (selected: number[]) => void;
}

export function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  const allSelected =
    options.length > 0 && options.every((o) => selected.includes(o.id));

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dark-700 bg-dark-800/50 p-2">
      <button
        type="button"
        onClick={selectAll}
        className="w-full rounded px-2 py-1.5 text-left text-xs font-medium text-gray-300 hover:bg-dark-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {allSelected ? "Deselect all" : "Select all"}
      </button>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {options.map((opt) => {
          const isChecked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-dark-700"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(opt.id)}
                className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-accent focus:ring-accent"
              />
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span className="flex-1 text-sm text-gray-200">Cluster {opt.id}</span>
              <span className="text-xs text-gray-500">{opt.count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
