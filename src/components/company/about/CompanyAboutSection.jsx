import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompanyAboutSection({ stock }) {
  if (!stock?.description) return null;

  return (
    <Card className="bg-gray-900 border-gray-800 p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <img 
          src={stock?.logo_url || "https://via.placeholder.com/120x120"}
          alt={stock?.company_name}
          className="h-24 w-24 rounded-lg object-contain bg-gray-800 p-2"
        />
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Sobre a Empresa</h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {stock.description}
          </p>
          
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-gray-400 text-sm">Média de avaliações dos usuários</span>
            <Button variant="outline" className="border-gray-700 text-gray-400 hover:text-white ml-auto">AVALIE</Button>
            <Button variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
              <Heart className="h-4 w-4 mr-2" /> SEGUIR
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}