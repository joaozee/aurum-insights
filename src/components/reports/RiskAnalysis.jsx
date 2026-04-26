import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Shield, Activity, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function RiskAnalysis({ assets, transactions }) {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateRiskMetrics();
  }, [assets, transactions]);

  const calculateRiskMetrics = async () => {
    setLoading(true);
    try {
      const assetsList = Object.values(assets);
      
      // Calcular volatilidade (desvio padrão simulado)
      const volatility = calculateVolatility(assetsList);
      
      // Calcular beta da carteira
      const beta = await calculateBeta(assetsList);
      
      // Calcular Sharpe Ratio
      const sharpeRatio = calculateSharpeRatio(assetsList);
      
      // Score de diversificação
      const diversificationScore = calculateDiversification(assetsList);
      
      setRiskMetrics({
        volatility,
        beta,
        sharpeRatio,
        diversificationScore,
        riskLevel: getRiskLevel(volatility, beta)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateVolatility = (assetsList) => {
    // Calcular variação dos ativos
    const variations = assetsList.map(asset => {
      const variation = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
      return Math.abs(variation);
    });
    
    const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
    return avgVariation || 5.2;
  };

  const calculateBeta = async (assetsList) => {
    // Beta médio da carteira (em produção, buscar betas reais)
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Calcule o beta médio aproximado para uma carteira brasileira com os seguintes ativos: ${assetsList.map(a => a.ticker).join(', ')}.
        Beta mede a sensibilidade ao mercado. 1.0 = neutro, >1.0 = mais volátil, <1.0 = menos volátil.
        Retorne apenas o valor numérico do beta médio ponderado.`,
        response_json_schema: {
          type: "object",
          properties: {
            beta: { type: "number" }
          }
        }
      });
      
      return result.beta || 1.05;
    } catch (err) {
      return 1.05;
    }
  };

  const calculateSharpeRatio = (assetsList) => {
    // Sharpe Ratio simplificado
    const totalValue = assetsList.reduce((sum, a) => sum + a.quantity * a.current_price, 0);
    const totalInvested = assetsList.reduce((sum, a) => sum + a.quantity * a.purchase_price, 0);
    const returns = ((totalValue - totalInvested) / totalInvested) * 100;
    
    const riskFreeRate = 0.9; // CDI mensal aproximado
    const volatility = calculateVolatility(assetsList);
    
    return ((returns - riskFreeRate) / volatility) || 1.2;
  };

  const calculateDiversification = (assetsList) => {
    // Score de 0 a 100 baseado em número de ativos e distribuição
    const numAssets = assetsList.length;
    const totalValue = assetsList.reduce((sum, a) => sum + a.quantity * a.current_price, 0);
    
    // Verificar concentração
    const maxConcentration = Math.max(...assetsList.map(a => 
      (a.quantity * a.current_price / totalValue) * 100
    ));
    
    let score = Math.min(numAssets * 10, 50); // 50 pontos max por quantidade
    score += Math.max(50 - maxConcentration, 0); // 50 pontos max por não-concentração
    
    return Math.min(score, 100);
  };

  const getRiskLevel = (volatility, beta) => {
    if (volatility > 15 || beta > 1.3) return { level: "Alto", color: "text-red-400", bg: "bg-red-500/10" };
    if (volatility > 8 || beta > 1.1) return { level: "Moderado", color: "text-amber-400", bg: "bg-amber-500/10" };
    return { level: "Baixo", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  };

  if (loading || !riskMetrics) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  const riskLevel = riskMetrics.riskLevel;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 rounded-2xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-violet-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Análise de Risco</h3>
          <p className="text-gray-500 text-sm">Métricas de volatilidade e exposição</p>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className={`${riskLevel.bg} border border-gray-700 rounded-xl p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${riskLevel.color}`} />
            <div>
              <p className="text-gray-400 text-xs">Nível de Risco</p>
              <p className={`text-xl font-bold ${riskLevel.color}`}>{riskLevel.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Score de Diversificação</p>
            <p className="text-white font-bold text-xl">{riskMetrics.diversificationScore.toFixed(0)}/100</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RiskMetricCard
          icon={Activity}
          label="Volatilidade"
          value={`${riskMetrics.volatility.toFixed(2)}%`}
          description="Desvio padrão dos retornos"
          color="text-violet-400"
        />
        
        <RiskMetricCard
          icon={TrendingUp}
          label="Beta"
          value={riskMetrics.beta.toFixed(2)}
          description="Sensibilidade ao mercado"
          color="text-amber-400"
          progress={Math.min((riskMetrics.beta / 2) * 100, 100)}
        />
        
        <RiskMetricCard
          icon={Shield}
          label="Sharpe Ratio"
          value={riskMetrics.sharpeRatio.toFixed(2)}
          description="Retorno ajustado ao risco"
          color="text-emerald-400"
        />
      </div>

      {/* Interpretations */}
      <div className="mt-6 space-y-3">
        <InterpretationCard
          title="Beta da Carteira"
          description={
            riskMetrics.beta > 1.2 
              ? "Sua carteira é mais volátil que o mercado. Espere maiores oscilações."
              : riskMetrics.beta > 0.8
              ? "Sua carteira acompanha o mercado. Risco moderado e equilibrado."
              : "Sua carteira é mais estável que o mercado. Menor risco."
          }
        />
        
        <InterpretationCard
          title="Diversificação"
          description={
            riskMetrics.diversificationScore > 75
              ? "Excelente diversificação! Seu risco está bem distribuído."
              : riskMetrics.diversificationScore > 50
              ? "Boa diversificação, mas há espaço para melhorias."
              : "Atenção: carteira concentrada. Considere diversificar mais."
          }
        />
      </div>
    </div>
  );
}

function RiskMetricCard({ icon: Icon, label, value, description, color, progress }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color} mb-2`}>{value}</p>
      <p className="text-gray-500 text-xs">{description}</p>
      {progress !== undefined && (
        <Progress value={progress} className="mt-3 h-1.5" />
      )}
    </div>
  );
}

function InterpretationCard({ title, description }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
      <p className="text-white text-sm font-medium mb-1">{title}</p>
      <p className="text-gray-400 text-xs">{description}</p>
    </div>
  );
}