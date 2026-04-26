import { Target, Eye, Award, Users, TrendingUp, Shield } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero com Logo */}
      <div className="bg-gradient-to-br from-amber-500/10 via-gray-900 to-violet-500/10 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-8 flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg" 
              alt="Aurum Logo" 
              className="h-24 w-24 object-contain"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Aurum Investimentos</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transformando conhecimento em patrimônio através de educação financeira e análises inteligentes
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Nossa História */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-amber-500" />
            <h2 className="text-3xl font-bold text-white">Nossa História</h2>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
            <p className="text-gray-300 text-lg leading-relaxed">
              A Aurum nasceu com o propósito de democratizar o acesso à educação financeira de qualidade no Brasil. 
              Fundada por investidores apaixonados, nossa missão é capacitar pessoas a tomarem decisões financeiras 
              mais inteligentes e construírem patrimônio de forma sustentável.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Combinamos análises profundas de mercado, cursos práticos e uma comunidade ativa para criar o 
              ecossistema completo que o investidor brasileiro precisa para prosperar no mercado financeiro.
            </p>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Missão, Visão e Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Missão */}
            <div className="bg-gradient-to-br from-amber-500/10 to-gray-900 border border-amber-500/30 rounded-2xl p-8">
              <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Missão</h3>
              <p className="text-gray-300 leading-relaxed">
                Empoderar investidores brasileiros através de educação financeira de excelência, 
                análises precisas e uma comunidade colaborativa.
              </p>
            </div>

            {/* Visão */}
            <div className="bg-gradient-to-br from-violet-500/10 to-gray-900 border border-violet-500/30 rounded-2xl p-8">
              <div className="h-14 w-14 rounded-xl bg-violet-500/20 flex items-center justify-center mb-6">
                <Eye className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Visão</h3>
              <p className="text-gray-300 leading-relaxed">
                Ser a plataforma de educação financeira mais confiável e completa do Brasil, 
                transformando milhares de vidas através do conhecimento.
              </p>
            </div>

            {/* Valores */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-gray-900 border border-emerald-500/30 rounded-2xl p-8">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Valores</h3>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>Transparência total</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>Educação de qualidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>Inovação constante</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>Comunidade colaborativa</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Nossos Diferenciais */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">O que nos torna únicos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Comunidade Ativa</h3>
                  <p className="text-gray-400">
                    Conecte-se com milhares de investidores, compartilhe experiências e aprenda em conjunto.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Análises Profissionais</h3>
                  <p className="text-gray-400">
                    Receba análises detalhadas de ações, FIIs e tendências de mercado feitas por especialistas.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Award className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Cursos Práticos</h3>
                  <p className="text-gray-400">
                    Aprenda do básico ao avançado com cursos estruturados e certificados reconhecidos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Tecnologia Avançada</h3>
                  <p className="text-gray-400">
                    Ferramentas inteligentes de análise, gestão de portfólio e acompanhamento em tempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar seus investimentos?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de investidores que já estão construindo patrimônio de forma inteligente com a Aurum.
          </p>
        </section>
      </div>
    </div>
  );
}