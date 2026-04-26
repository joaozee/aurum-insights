import { TrendingUp, Award, MessageSquare, BookOpen } from "lucide-react";
import { cn } from "@/components/lib/utils";

export default function PointsCard({ points, breakdown }) {
  const items = [
    { label: "De Aulas", value: breakdown?.points_from_lessons || 0, icon: BookOpen, color: "text-blue-500" },
    { label: "De Cursos", value: breakdown?.points_from_courses || 0, icon: Award, color: "text-purple-500" },
    { label: "Comunidade", value: breakdown?.points_from_community || 0, icon: MessageSquare, color: "text-green-500" }
  ];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600 text-sm mb-1">Pontos Totais</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-amber-600">{points.toLocaleString('pt-BR')}</span>
            <span className="text-gray-500">XP</span>
          </div>
        </div>
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={cn("h-4 w-4", item.color)} />
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}