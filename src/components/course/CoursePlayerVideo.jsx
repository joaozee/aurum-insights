import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

export default function CoursePlayerVideo({ lesson }) {
  if (!lesson) {
    return (
      <Card className="bg-gray-900 border-gray-800 aspect-video flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Nenhuma lição selecionada</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer">
        {lesson.video_url ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <PlayCircle className="h-20 w-20 text-violet-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Vídeo: {lesson.title}</p>
                <p className="text-sm text-gray-500">Vimeo API Integration (Ready)</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <PlayCircle className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Vídeo não disponível</p>
            <p className="text-sm text-gray-500 mt-2">URL do Vimeo será adicionada</p>
          </div>
        )}
      </div>
    </Card>
  );
}