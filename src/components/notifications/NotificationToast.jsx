import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationToast({ userEmail }) {
  const [toastNotifications, setToastNotifications] = useState([]);

  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to new notifications
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data.user_email === userEmail) {
        setToastNotifications((prev) => [event.data, ...prev].slice(0, 5));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setToastNotifications((prev) => prev.filter((n) => n.id !== event.data.id));
        }, 5000);
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {toastNotifications.map((notif) => (
        <div
          key={notif.id}
          className={cn(
            "animate-in slide-in-from-right rounded-xl border p-4 shadow-lg max-w-sm",
            notif.severity === "success"
              ? "bg-emerald-950 border-emerald-700 text-emerald-100"
              : notif.severity === "warning"
              ? "bg-amber-950 border-amber-700 text-amber-100"
              : notif.severity === "error"
              ? "bg-red-950 border-red-700 text-red-100"
              : "bg-blue-950 border-blue-700 text-blue-100"
          )}
        >
          <div className="flex gap-3">
            <div className="text-2xl">{getEmoji(notif.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{notif.title}</h4>
              <p className="text-xs opacity-90">{notif.message}</p>
            </div>
            <button
              onClick={() =>
                setToastNotifications((prev) =>
                  prev.filter((n) => n.id !== notif.id)
                )
              }
              className="text-xs opacity-50 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getEmoji(type) {
  const emojis = {
    meta_atingida: "🎯",
    variacao_preco: "📈",
    alerta_gastos: "⚠️",
    lembrete_conta: "📋",
    analise_ia: "🤖",
    lembrete_curso: "📚",
    novo_conteudo: "✨",
    mensagem_direta: "💬",
    resposta_comentario: "💬",
    mencao: "🏷️",
    conquista: "🏆",
    atualizacao_plataforma: "📢",
  };
  return emojis[type] || "🔔";
}