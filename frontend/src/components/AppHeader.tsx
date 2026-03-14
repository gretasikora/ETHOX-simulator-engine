import { Link } from "react-router-dom";

interface AppHeaderProps {
  onSearchSelect: (agentId: string) => void;
}

export function AppHeader({ onSearchSelect: _onSearchSelect }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 w-full shrink-0 items-center bg-aurora-bg0/98 px-5 py-3 backdrop-blur-sm">
      <Link to="/" className="flex shrink-0 items-center gap-3">
        <img src="/logo-no-bg (1).png" alt="" className="h-9 w-9 object-contain" aria-hidden />
        <img src="/epistemea.png" alt="EPISTEMEA" className="h-6 w-auto object-contain" />
      </Link>
    </header>
  );
}
