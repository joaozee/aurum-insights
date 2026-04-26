import { BookOpen, TrendingUp, DollarSign, Target, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StrategyEducation() {
  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-400">
          <BookOpen className="h-5 w-5" />
          Estratégia: Ações com DY ≥ 6%
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* O que é Dividend Yield */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            O que é Dividend Yield (DY)?
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            Dividend Yield é a relação entre os dividendos anuais pagos por uma ação e seu preço atual. Expressa em porcentagem, mostra o retorno que você recebe apenas com dividendos. Por exemplo, uma ação a R$50 que paga R$3 de dividendos anuais tem DY de 6%.
          </p>
          <div className="bg-gray-900 rounded-lg p-3 mt-2">
            <p className="text-xs text-gray-400 mb-1">Fórmula:</p>
            <p className="text-sm text-emerald-400 font-mono">DY = (Dividendos Anuais ÷ Preço Atual) × 100</p>
          </div>
        </div>

        {/* Por que 6%? */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-400" />
            Por que focar em DY ≥ 6%?
          </h4>
          <ul className="space-y-2">
            <li className="flex gap-3 text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Renda Passiva:</strong> 6% ao ano é aproximadamente 0,5% ao mês, gerando fluxo de caixa consistente</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Acima da Inflação:</strong> Historicamente supera a inflação brasileira, protegendo seu patrimônio</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Empresas Maduras:</strong> Empresas com DY alto geralmente são consolidadas e rentáveis</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong>Reinvestimento:</strong> Juros compostos aplicando dividendos em novas ações</span>
            </li>
          </ul>
        </div>

        {/* Princípios da Estratégia */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Princípios Fundamentais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-xs font-semibold text-white mb-1">🎯 Foco em Longo Prazo</p>
              <p className="text-xs text-gray-400">Horizonte mínimo de 5+ anos para capturar ciclos de reinvestimento</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-xs font-semibold text-white mb-1">📊 Diversificação</p>
              <p className="text-xs text-gray-400">Alocar em diferentes setores (bancário, varejo, infraestrutura) reduz risco</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-xs font-semibold text-white mb-1">🔄 Reinvestir Dividendos</p>
              <p className="text-xs text-gray-400">Reaplicar os dividendos em novas ações amplifica ganhos exponenciais</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-xs font-semibold text-white mb-1">📈 Aporte Mensal</p>
              <p className="text-xs text-gray-400">Consistência é chave. Aportes regulares reduzem impacto de volatilidade</p>
            </div>
          </div>
        </div>

        {/* Exemplo Prático */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Exemplo Prático
          </h4>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Aporte inicial:</span>
              <span className="text-white font-semibold">R$ 10.000</span>
            </div>
            <div className="flex justify-between">
              <span>Ação escolhida (DY 8%):</span>
              <span className="text-white font-semibold">ITUB4 (8% ao ano)</span>
            </div>
            <div className="border-t border-gray-700 my-2"></div>
            <div className="flex justify-between">
              <span>Dividendos recebidos (1º ano):</span>
              <span className="text-emerald-400 font-semibold">R$ 800</span>
            </div>
            <div className="flex justify-between">
              <span>Reinvestir em ITUB4:</span>
              <span className="text-emerald-400 font-semibold">Mais ações com dividendos</span>
            </div>
            <div className="border-t border-gray-700 my-2"></div>
            <div className="flex justify-between">
              <span>Após 10 anos (juros compostos):</span>
              <span className="text-violet-400 font-semibold">~R$ 21.600+ (reinvestimento)</span>
            </div>
          </div>
        </div>

        {/* Riscos a Considerar */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            ⚠️ Riscos a Considerar
          </h4>
          <ul className="space-y-2">
            <li className="flex gap-3 text-sm text-gray-300">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>Corte de Dividendos:</strong> Empresas podem reduzir ou suspender dividendos em crises</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>Risco de Mercado:</strong> Preço da ação pode cair mesmo com bom dividendo</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>Armadilha do Yield Alto:</strong> DY muito alto pode indicar empresa em dificuldades</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>Impostos:</strong> Pessoa física paga 15% de imposto sobre dividendos</span>
            </li>
          </ul>
        </div>

        {/* Próximos Passos */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-emerald-400 mb-2">💡 Próximos Passos</p>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li>Use a aba "Estratégia & Meta" para gerar uma estratégia personalizada</li>
            <li>Execute o backtest para ver projeções realistas do seu investimento</li>
            <li>Analise as recomendações de ações com DY ≥ 6%</li>
            <li>Defina suas metas financeiras e horizonte de investimento</li>
            <li>Comece com aportes mensais consistentes</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}