import MarketOverview from "./MarketOverview";
import MarketNews from "./MarketNews";

export default function MarketDashboard({ onSelectStock }) {
  return (
    <div className="space-y-6">
      {/* Seção 1: Ibovespa + Altas/Baixas + Moedas + Índices + Criptos */}
      <MarketOverview />

      {/* Notícias em destaque */}
      <MarketNews />
    </div>
  );
}