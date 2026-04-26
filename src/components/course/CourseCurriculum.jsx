import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, PlayCircle } from "lucide-react";

export default function CourseCurriculum({
  course,
  currentModuleIndex,
  currentLessonIndex,
  onLessonClick,
  completedLessons
}) {
  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Currículo</h3>
      <Accordion 
        type="single" 
        collapsible 
        defaultValue={`module-${currentModuleIndex}`}
        className="space-y-2"
      >
        {course.modules?.map((module, moduleIndex) => (
          <AccordionItem
            key={moduleIndex}
            value={`module-${moduleIndex}`}
            className="border border-gray-800 rounded-lg px-4"
          >
            <AccordionTrigger className="py-3 hover:no-underline group">
              <div className="flex items-center gap-3 text-left flex-1">
                <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-medium text-sm flex-shrink-0">
                  {moduleIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white group-hover:text-violet-400 transition-colors text-sm">
                    {module.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {module.lessons?.length || 0} aulas
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {module.lessons?.map((lesson, lessonIndex) => {
                  const lessonId = `${moduleIndex}-${lessonIndex}`;
                  const isCompleted = completedLessons.includes(lessonId);
                  const isCurrent =
                    moduleIndex === currentModuleIndex &&
                    lessonIndex === currentLessonIndex;

                  return (
                    <button
                      key={lessonIndex}
                      onClick={() => onLessonClick(moduleIndex, lessonIndex)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left text-sm ${
                        isCurrent
                          ? "bg-violet-500/20 border border-violet-500/50"
                          : "hover:bg-gray-800/50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isCurrent ? "text-violet-400" : "text-gray-300"
                        }`}>
                          {lesson.title}
                        </p>
                        {lesson.duration_minutes && (
                          <p className="text-xs text-gray-500">
                            {lesson.duration_minutes} min
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}