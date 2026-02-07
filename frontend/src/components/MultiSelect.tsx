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
    <div className="space-y-2 rounded-lg border border-aurora-border bg-aurora-surface1 p-2">
      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-aurora-text2 hover:bg-aurora-surface2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={selectAll}
          className="h-3.5 w-3.5 rounded border-aurora-border bg-aurora-surface2 text-aurora-accent1 focus:ring-aurora-accent1"
        />
        <span>{allSelected ? "Deselect all" : "Select all"}</span>
      </label>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {options.map((opt) => {
          const isChecked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-aurora-surface2"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(opt.id)}
                className="h-3.5 w-3.5 rounded border-aurora-border bg-aurora-surface2 text-aurora-accent1 focus:ring-aurora-accent1"
              />
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span className="flex-1 text-sm text-aurora-text0">Cluster {opt.id}</span>
              <span className="text-right text-xs tabular-nums text-aurora-text2">{opt.count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
