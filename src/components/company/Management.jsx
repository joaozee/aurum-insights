import { Users, Award } from "lucide-react";

const mockManagement = {
  ceo: {
    name: "João Silva Santos",
    position: "Presidente do Conselho e CEO",
    bio: "Engenheiro com 25 anos de experiência no setor"
  },
  cfo: {
    name: "Maria Oliveira Costa",
    position: "Diretora Financeira",
    bio: "Contadora, especializada em gestão financeira internacional"
  },
  officers: [
    { name: "Pedro Martins", position: "Diretor de Operações" },
    { name: "Ana Paula Silva", position: "Diretora de Recursos Humanos" },
    { name: "Carlos Eduardo", position: "Diretor de Tecnologia" }
  ]
};

const mockControllers = [
  { name: "Família Silva", percentage: 28.5 },
  { name: "Fundo de Pensão XYZ", percentage: 15.2 },
  { name: "Banco Investidor ABC", percentage: 12.8 },
  { name: "Tesouro Federal", percentage: 8.5 }
];

export default function Management() {
  return (
    <div className="space-y-8">
      {/* Administração */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5 text-amber-400" />
          <h3 className="text-xl font-semibold text-white">Administração</h3>
        </div>

        {/* CEO */}
        <div className="mb-6 pb-6 border-b border-gray-800">
          <p className="text-amber-400 font-semibold text-sm mb-2">Presidente Executivo</p>
          <p className="text-white font-semibold text-lg mb-1">{mockManagement.ceo.name}</p>
          <p className="text-gray-400 text-sm">{mockManagement.ceo.bio}</p>
        </div>

        {/* CFO */}
        <div className="mb-6 pb-6 border-b border-gray-800">
          <p className="text-blue-400 font-semibold text-sm mb-2">Diretor Financeiro</p>
          <p className="text-white font-semibold text-lg mb-1">{mockManagement.cfo.name}</p>
          <p className="text-gray-400 text-sm">{mockManagement.cfo.bio}</p>
        </div>

        {/* Outros Diretores */}
        <div>
          <p className="text-emerald-400 font-semibold text-sm mb-4">Diretoria</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockManagement.officers.map((officer, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <p className="text-white font-medium text-sm">{officer.name}</p>
                <p className="text-gray-400 text-xs mt-1">{officer.position}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controladores */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Principais Acionistas</h3>
        </div>

        <div className="space-y-3">
          {mockControllers.map((controller, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <span className="text-gray-300 font-medium">{controller.name}</span>
              <div className="text-right">
                <p className="text-white font-bold">{controller.percentage.toFixed(1)}%</p>
                <div className="h-2 bg-gray-700 rounded-full mt-1 w-32">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${controller.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}