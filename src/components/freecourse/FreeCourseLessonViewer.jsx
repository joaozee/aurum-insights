import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, File, FileText, Video } from "lucide-react";

export default function FreeCourseLessonViewer({ lesson, onComplete }) {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    setCompleted(true);
    onComplete?.();
  };

  const isPDF = lesson?.file_url?.endsWith(".pdf");
  const isVideo = lesson?.video_url && !lesson?.file_url;

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden">
      {/* Lesson Content */}
      <div className="aspect-video bg-black flex items-center justify-center relative">
        {isVideo ? (
          <video
            src={lesson.video_url}
            controls
            className="w-full h-full object-cover"
          />
        ) : isPDF ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <File className="h-10 w-10 text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-2">{lesson.title}</p>
              <p className="text-gray-400 text-sm mb-4">Documento PDF</p>
              <a
                href={lesson.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Abrir PDF
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400">Conteúdo não disponível</p>
          </div>
        )}
      </div>

      {/* Lesson Info */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {lesson.title}
            </h3>
            {lesson.duration_minutes && (
              <p className="text-sm text-gray-400">
                Duração: {lesson.duration_minutes} minutos
              </p>
            )}
          </div>
          {!completed && (
            <Button
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap ml-4"
            >
              Marcar como completa
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {lesson.description && (
          <div className="text-gray-300 text-sm">
            <p>{lesson.description}</p>
          </div>
        )}

        {completed && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm font-medium">
              ✓ Aula completada!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}