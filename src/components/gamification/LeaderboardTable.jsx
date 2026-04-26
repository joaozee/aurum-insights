import { Trophy, TrendingUp, Crown } from "lucide-react";
import { cn } from "@/components/lib/utils";
import { calculateLevel, getLevelTitle } from "./LevelSystem";

export default function LeaderboardTable({ users, currentUserEmail }) {
  const topThree = users.slice(0, 3);
  const others = users.slice(3);

  const getMedalIcon = (rank) => {
    switch(rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pódio com Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 2º lugar */}
          {topThree[1] && (
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-3xl mb-3">
                🥈
              </div>
              <h3 className="font-semibold text-gray-900 text-center">{topThree[1].full_name}</h3>
              <p className="text-2xl font-bold text-gray-500">{topThree[1].points}</p>
              <p className="text-xs text-gray-500">XP</p>
            </div>
          )}

          {/* 1º lugar */}
          {topThree[0] && (
            <div className="flex flex-col items-center md:transform md:scale-110 md:origin-bottom">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-4xl mb-3 shadow-lg">
                🥇
              </div>
              <h3 className="font-bold text-gray-900 text-center text-lg">{topThree[0].full_name}</h3>
              <p className="text-3xl font-bold text-amber-600">{topThree[0].points}</p>
              <p className="text-xs text-amber-600">XP</p>
            </div>
          )}

          {/* 3º lugar */}
          {topThree[2] && (
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-3xl mb-3">
                🥉
              </div>
              <h3 className="font-semibold text-gray-900 text-center">{topThree[2].full_name}</h3>
              <p className="text-2xl font-bold text-orange-600">{topThree[2].points}</p>
              <p className="text-xs text-orange-600">XP</p>
            </div>
          )}
        </div>
      )}

      {/* Tabela com os demais */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Posição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pontos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cursos</th>
              </tr>
            </thead>
            <tbody>
              {topThree.map((user, i) => (
                <tr 
                  key={user.email}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    user.email === currentUserEmail && "bg-blue-50"
                  )}
                >
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600 font-bold">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-semibold">
                          {user.full_name?.[0] || "U"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                          {calculateLevel(user.points).level}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{getLevelTitle(calculateLevel(user.points).level)}</p>
                      </div>
                      {user.email === currentUserEmail && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-900">{user.points}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600">{user.courses_completed}</span>
                  </td>
                </tr>
              ))}
              {others.map((user, i) => (
                <tr 
                  key={user.email}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    user.email === currentUserEmail && "bg-blue-50"
                  )}
                >
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                      {i + 4}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                          {user.full_name?.[0] || "U"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                          {calculateLevel(user.points).level}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{getLevelTitle(calculateLevel(user.points).level)}</p>
                      </div>
                      {user.email === currentUserEmail && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-900">{user.points}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600">{user.courses_completed}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}