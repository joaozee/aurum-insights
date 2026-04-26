// TODO: conectar fonte de notícias (NewsAPI, Infomoney RSS ou similar)
// Dados mockados realistas como fallback

const MOCK_NEWS = [
  {
    id: 1, category: "Mercado", featured: true,
    title: "Ibovespa sobe forte e investidores comemoram renovação de máximas históricas",
    subtitle: "Ações de bancos e commodities lideram a alta do dia, com Petrobras e Vale valorizando mais de 2%",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
    time: "17/03/2026 • 14h32",
  },
  {
    id: 2, category: "Dividendos",
    title: "Banco do Brasil anuncia pagamento de R$ 2,1 bilhões em JCP para acionistas",
    time: "17/03/2026 • 11h20",
  },
  {
    id: 3, category: "Economia",
    title: "Dólar recua após dados positivos da balança comercial brasileira",
    time: "17/03/2026 • 10h05",
  },
  {
    id: 4, category: "Economia",
    title: "Cashback do IR: Entenda a novidade que promete liberar R$ 50 bilhões à economia",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
    time: "17/03/2026 • 09h15",
  },
  {
    id: 5, category: "Mercado",
    title: "Bolsas sobem forte e Ibovespa tenta sustentar os 181 mil pontos",
    image: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&q=80",
    time: "17/03/2026 • 08h40",
  },
  {
    id: 6, category: "Mercado",
    title: "Bradesco dobra aposta em elétrica prevendo um dos maiores dividendos do setor",
    image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=160&q=80",
    time: "17/03/2026 • 13h50",
  },
  {
    id: 7, category: "Mercado",
    title: "Petrobras (PETR4) atualiza valor por ação do dividendo e JCP para março",
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=160&q=80",
    time: "17/03/2026 • 12h10",
  },
  {
    id: 8, category: "Negócios",
    title: "Porto ignora baixa da Oncoclínicas (ONCO3) e propõe aporte de R$ 3 bi no setor",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=160&q=80",
    time: "17/03/2026 • 11h05",
  },
  {
    id: 9, category: "Mercado",
    title: "XP dobra taxa para fundo de ouro e analistas sugerem resgate imediato",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=160&q=80",
    time: "17/03/2026 • 10h30",
  },
];

const CATEGORY_COLORS = {
  Mercado: "text-amber-400",
  Dividendos: "text-emerald-400",
  Economia: "text-blue-400",
  Negócios: "text-violet-400",
};

function CategoryBadge({ cat }) {
  const color = CATEGORY_COLORS[cat] || "text-gray-400";
  return <span className={`text-[11px] font-semibold uppercase ${color}`}>{cat}</span>;
}

export default function MarketNews() {
  const featured = MOCK_NEWS[0];
  const subLeft = MOCK_NEWS.slice(1, 3);
  const center = MOCK_NEWS.slice(3, 5);
  const mostRead = MOCK_NEWS.slice(5, 9);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white border-l-4 border-amber-500 pl-3">
          Notícias em destaque
        </h2>
        <button className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
          Ver lista completa →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col esquerda — 1 destaque + 2 manchetes */}
        <div className="space-y-4">
          <div className="space-y-2">
            <img src={featured.image} alt={featured.title}
              className="w-full h-44 object-cover rounded-xl" />
            <CategoryBadge cat={featured.category} />
            <h3 className="text-base font-bold text-white leading-snug hover:text-amber-400 cursor-pointer transition-colors">
              {featured.title}
            </h3>
          </div>
          <div className="space-y-3 border-t border-gray-700 pt-3">
            {subLeft.map(n => (
              <p key={n.id} className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors leading-snug">
                {n.title}
              </p>
            ))}
          </div>
        </div>

        {/* Col central — 2 notícias médias */}
        <div className="space-y-4">
          {center.map(n => (
            <div key={n.id} className="space-y-2">
              {n.image && (
                <img src={n.image} alt={n.title}
                  className="w-full h-32 object-cover rounded-xl" />
              )}
              <CategoryBadge cat={n.category} />
              <h4 className="text-sm font-semibold text-white leading-snug hover:text-amber-400 cursor-pointer transition-colors">
                {n.title}
              </h4>
              <p className="text-[11px] text-gray-500">{n.time}</p>
            </div>
          ))}
        </div>

        {/* Col direita — As mais lidas */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            As mais lidas hoje
          </h4>
          <div className="space-y-3">
            {mostRead.map(n => (
              <div key={n.id} className="flex gap-3 items-start hover:bg-gray-800/40 rounded-lg p-1.5 -mx-1.5 cursor-pointer transition-colors">
                {n.image && (
                  <img src={n.image} alt={n.title}
                    className="w-14 h-14 object-cover rounded-lg shrink-0" />
                )}
                <div className="min-w-0 space-y-1">
                  <CategoryBadge cat={n.category} />
                  <p className="text-xs text-gray-200 leading-snug line-clamp-2">{n.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}