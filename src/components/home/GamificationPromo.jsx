import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Trophy, Award, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GamificationPromo() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-950/50 via-purple-900/30 to-gray-900 rounded-2xl border border-violet-500/20 p-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Sistema de Pontos e Conquistas</h3>
            <p className="text-gray-400 text-sm">Ganhe pontos ao aprender e engaje com a comunidade</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:border-violet-500/30 transition-all">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <Star className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-xs font-medium text-gray-300">10 XP por aula</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:border-violet-500/30 transition-all">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-400 text-lg">💬</span>
            </div>
            <p className="text-xs font-medium text-gray-300">5 XP por post</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:border-violet-500/30 transition-all">
            <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-pink-400 text-lg">❤️</span>
            </div>
            <p className="text-xs font-medium text-gray-300">1 XP por curtida</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={createPageUrl("Profile")} className="flex-1">
            <Button variant="outline" className="w-full border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 hover:border-violet-500/50">
              <Award className="h-4 w-4 mr-2" />
              Meu Progresso
            </Button>
          </Link>
          <Link to={createPageUrl("Leaderboard")} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/30 group">
              <Trophy className="h-4 w-4 mr-2" />
              Ver Ranking
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}