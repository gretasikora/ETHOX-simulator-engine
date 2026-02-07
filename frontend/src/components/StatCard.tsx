interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-lg bg-dark-700 p-3 ${
        accent ? "border-b-2 border-accent" : ""
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
