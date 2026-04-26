import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Bookmark, Users, Briefcase } from "lucide-react";
import { cn } from "@/components/lib/utils";

export default function MyItemsSidebar({ userProfile }) {
  const items = [
    {
      icon: Bookmark,
      label: "Itens salvos",
      page: "SavedItems",
      color: "text-violet-600"
    },
    {
      icon: Users,
      label: "Grupos",
      page: "MyGroups",
      color: "text-blue-600"
    }
  ];

  // Adicionar carteira apenas se for pública
  if (userProfile?.is_portfolio_public) {
    items.push({
      icon: Briefcase,
      label: "Carteira",
      page: "Portfolio",
      color: "text-emerald-600"
    });
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
        Meus itens
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
          >
            <item.icon className={cn("h-4 w-4", item.color)} />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}