import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const reactions = [
  { type: "like", emoji: "❤️", label: "Curtir" },
  { type: "foguete", emoji: "🚀", label: "Foguete" },
  { type: "alvo", emoji: "🎯", label: "Na mosca" },
  { type: "coracao", emoji: "💚", label: "Amei" },
  { type: "pensativo", emoji: "🤔", label: "Interessante" }
];

export default function ReactionPicker({ onReact }) {
  const [open, setOpen] = useState(false);

  const handleReaction = (reactionType) => {
    onReact(reactionType);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-400 hover:text-violet-400 hover:bg-violet-500/10"
        >
          Reagir
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-gray-900 border-gray-800">
        <div className="flex gap-2">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-gray-800"
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}