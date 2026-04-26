import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Award, Download, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CertificateTemplate from "./CertificateTemplate";
import EmptyState from "@/components/shared/EmptyState";

export default function CertificatesList({ userEmail }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadCertificates();
    }
  }, [userEmail]);

  const loadCertificates = async () => {
    try {
      const certs = await base44.entities.Certificate.filter(
        { user_email: userEmail },
        "-completion_date"
      );
      setCertificates(certs);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert);
    setShowCertificate(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <Skeleton className="h-6 w-3/4 bg-gray-800 mb-3" />
            <Skeleton className="h-4 w-1/2 bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="Nenhum certificado ainda"
        description="Complete cursos para ganhar certificados"
      />
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {certificates.map((cert) => (
          <div 
            key={cert.id}
            className="group bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/20 rounded-xl p-6 border border-gray-800 hover:border-violet-500/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-violet-400 transition-colors">
                      {cert.course_title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Concluído em {format(new Date(cert.completion_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {cert.course_duration && (
                    <Badge variant="outline" className="border-gray-700 text-gray-400">
                      {cert.course_duration}h de curso
                    </Badge>
                  )}
                  {cert.final_score && (
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      Nota: {cert.final_score}%
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                    #{cert.certificate_number}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewCertificate(cert)}
                  className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Viewer Dialog */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Seu Certificado</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="flex justify-center">
              <div className="scale-75 origin-top">
                <CertificateTemplate 
                  certificate={selectedCertificate} 
                  onClose={() => setShowCertificate(false)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}