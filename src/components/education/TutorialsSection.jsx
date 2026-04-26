import { useState } from "react";
import { Lightbulb, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TutorialsSection({ tutorials }) {
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  if (tutorials.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <Lightbulb className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Nenhum Tutorial Disponível</h3>
        <p className="text-gray-400">Tutoriais interativos serão adicionados em breve</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tutorials.map(tutorial => (
        <Dialog key={tutorial.id} onOpenChange={(open) => !open && setCurrentStep(0)}>
          <DialogTrigger asChild>
            <div 
              onClick={() => setSelectedTutorial(tutorial)}
              className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30 border border-gray-800 rounded-2xl p-6 hover:border-violet-500/30 cursor-pointer transition-all hover:shadow-xl hover:shadow-violet-500/10 group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                  <Lightbulb className="h-6 w-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <Badge className="mb-2 bg-violet-500/10 text-violet-400 border-violet-500/20">
                    {tutorial.category}
                  </Badge>
                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-violet-400 transition-colors">
                    {tutorial.title}
                  </h3>
                </div>
              </div>

              {tutorial.short_description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {tutorial.short_description}
                </p>
              )}

              {tutorial.steps && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {tutorial.steps.length} passos
                  </span>
                  <ChevronRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">{tutorial.title}</DialogTitle>
            </DialogHeader>

            {tutorial.steps && tutorial.steps.length > 0 && (
              <div className="mt-4">
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progresso</span>
                    <span className="text-violet-400 font-medium">
                      {currentStep + 1} de {tutorial.steps.length}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {tutorial.steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full flex-1 transition-colors ${
                          i <= currentStep ? 'bg-violet-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Current Step */}
                <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                      <span className="text-violet-400 font-bold">{currentStep + 1}</span>
                    </div>
                    <h4 className="text-white font-semibold text-lg">
                      {tutorial.steps[currentStep].title}
                    </h4>
                  </div>

                  {tutorial.steps[currentStep].image_url && (
                    <img
                      src={tutorial.steps[currentStep].image_url}
                      alt={tutorial.steps[currentStep].title}
                      className="w-full rounded-lg mb-4 border border-gray-700"
                    />
                  )}

                  <p className="text-gray-300 leading-relaxed">
                    {tutorial.steps[currentStep].description}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="border-gray-700 text-gray-300"
                  >
                    Anterior
                  </Button>

                  {currentStep < tutorial.steps.length - 1 ? (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Concluído
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}