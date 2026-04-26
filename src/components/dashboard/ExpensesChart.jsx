import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PERSONAL_CATEGORY_LABELS = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  lazer: "Lazer",
  cartao_credito: "Cartão",
  assinaturas: "Assinaturas",
  transporte: "Transporte",
  saude: "Saúde",
  outros: "Outros"
};

const COMPANY_CATEGORY_LABELS = {
  vendas: "Vendas",
  servicos: "Receita de Serviços",
  investimento: "Investimento/Capital",
  emprestimo: "Empréstimo",
  aluguel_comercial: "Aluguel Comercial",
  salarios: "Salários e Encargos",
  energia: "Energia/Água",
  internet: "Internet/Telecomunicações",
  marketing: "Marketing e Publicidade",
  estoque: "Estoque/Matéria Prima",
  transporte: "Transporte/Logística",
  impostos: "Impostos e Taxas",
  manutencao: "Manutenção e Reparos",
  seguros: "Seguros",
  consultoria: "Consultoria/Profissionais",
  software: "Software e Assinaturas",
  outros: "Outros"
};

const PERSONAL_CATEGORY_COLORS = {
  moradia: "#8B5CF6",
  alimentacao: "#F59E0B",
  lazer: "#EC4899",
  cartao_credito: "#06B6D4",
  assinaturas: "#10B981",
  transporte: "#3B82F6",
  saude: "#14B8A6",
  outros: "#6B7280"
};

const COMPANY_CATEGORY_COLORS = {
  vendas: "#8B5CF6",
  servicos: "#F59E0B",
  investimento: "#EC4899",
  emprestimo: "#06B6D4",
  aluguel_comercial: "#10B981",
  salarios: "#3B82F6",
  energia: "#14B8A6",
  internet: "#06B6D4",
  marketing: "#F59E0B",
  estoque: "#8B5CF6",
  transporte: "#3B82F6",
  impostos: "#EC4899",
  manutencao: "#6B7280",
  seguros: "#10B981",
  consultoria: "#F59E0B",
  software: "#06B6D4",
  outros: "#6B7280"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-white font-semibold mb-1">{payload[0].payload.category}</p>
        <p className="text-violet-400 font-bold text-lg">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpensesChart({ transactions = [], isCompany = false }) {
  const CATEGORY_LABELS = isCompany ? COMPANY_CATEGORY_LABELS : PERSONAL_CATEGORY_LABELS;
  const CATEGORY_COLORS = isCompany ? COMPANY_CATEGORY_COLORS : PERSONAL_CATEGORY_COLORS;

  // Filtrar apenas transações do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const expensesByCategory = Object.keys(CATEGORY_LABELS).reduce((acc, cat) => {
    const total = monthTransactions
      .filter(t => t.type === "saida" && t.category === cat)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return [...acc, { category: CATEGORY_LABELS[cat], value: total, key: cat }];
  }, []).filter(d => d.value > 0);

  // Mock data if no transactions
  const displayData = expensesByCategory.length > 0 ? expensesByCategory : (
    isCompany ? [
      { category: "Salários", value: 5000, key: "salarios" },
      { category: "Aluguel", value: 3000, key: "aluguel_comercial" },
      { category: "Marketing", value: 1500, key: "marketing" },
      { category: "Energia", value: 800, key: "energia" },
      { category: "Software", value: 500, key: "software" }
    ] : [
      { category: "Moradia", value: 2500, key: "moradia" },
      { category: "Alimentação", value: 1800, key: "alimentacao" },
      { category: "Transporte", value: 800, key: "transporte" },
      { category: "Lazer", value: 600, key: "lazer" },
      { category: "Assinaturas", value: 350, key: "assinaturas" }
    ]
  );

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Gastos por Categoria</h3>
        <p className="text-gray-500 text-sm">Distribuição mensal</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <defs>
              {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
            />
            <YAxis 
              type="category"
              dataKey="category" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151', opacity: 0.2 }} />
            <Bar 
              dataKey="value" 
              radius={[0, 8, 8, 0]}
              barSize={26}
              animationDuration={800}
            >
              {displayData.map((entry) => (
                <Cell 
                  key={entry.key} 
                  fill={`url(#grad-${entry.key})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-800">
        {displayData.slice(0, 5).map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ backgroundColor: CATEGORY_COLORS[item.key] }}
            />
            <span className="text-xs text-gray-400">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}