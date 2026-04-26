import { TrendingUp } from "lucide-react";
import UniversalSearchBar from "./UniversalSearchBar";

export default function CompanyHeader({ onSearch }) {
  const handleSelect = (ticker) => {
    if (!ticker.trim()) return;
    const t = ticker.toUpperCase();
    onSearch(t);
  };

  return (
    <>
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <TrendingUp className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Análise de Ações</h1>
          <p className="text-gray-400">Pesquise ações, FIIs ou criptomoedas para análise completa</p>
        </div>
      </div>

      <UniversalSearchBar
        onSelect={handleSelect}
        placeholder="Buscar ações, FIIs ou criptomoedas... (ex: PETR4, MXRF11, BTC)"
      />
    </div>
    </>
  );
}