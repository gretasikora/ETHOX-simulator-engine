import { useMemo, useState } from "react";
import type { ClusterRow } from "../../utils/metrics";

type SortKey = "clusterId" | "size" | "cohesionWithin" | "avgInfluence" | "meanOpinion" | "adoptionShare";

const COLUMNS: { key: SortKey; label: string; liveOnly?: boolean }[] = [
  { key: "clusterId", label: "Cluster" },
  { key: "size", label: "Size" },
  { key: "cohesionWithin", label: "Cohesion" },
  { key: "avgInfluence", label: "Avg influence" },
  { key: "meanOpinion", label: "Mean opinion", liveOnly: true },
  { key: "adoptionShare", label: "Adoption %", liveOnly: true },
];

interface ClusterBreakdownTableProps {
  rows: ClusterRow[];
  hasLive: boolean;
}

export function ClusterBreakdownTable({ rows, hasLive }: ClusterBreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("size");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const key = sortKey;
    return [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return asc ? -1 : 1;
      if (vb == null) return asc ? 1 : -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return asc ? cmp : -cmp;
    });
  }, [rows, sortKey, asc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((a) => !a);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  const visibleColumns = COLUMNS.filter((c) => !c.liveOnly || hasLive);

  return (
    <div className="rounded-lg border border-dark-600 bg-dark-800">
      <div className="border-b border-dark-600 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Cluster breakdown</h3>
        <p className="text-xs text-gray-500">Sort by column header</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-dark-600 text-gray-400">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none px-4 py-2 hover:bg-dark-700 hover:text-gray-200"
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (asc ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.clusterId} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                <td className="px-4 py-2 font-medium text-white">{row.clusterId}</td>
                <td className="px-4 py-2 tabular-nums text-gray-300">{row.size}</td>
                <td className="px-4 py-2 tabular-nums text-gray-300">
                  {row.cohesionWithin.toFixed(2)}
                </td>
                <td className="px-4 py-2 tabular-nums text-gray-300">
                  {row.avgInfluence.toFixed(3)}
                </td>
                {hasLive && (
                  <>
                    <td className="px-4 py-2 tabular-nums text-gray-300">
                      {row.meanOpinion != null ? row.meanOpinion.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-gray-300">
                      {row.adoptionShare != null ? `${(row.adoptionShare * 100).toFixed(0)}%` : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
