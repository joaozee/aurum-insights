import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";

export default function MoveToFolderDialog({ open, onClose, folders, currentFolder, onMove }) {
  const [newFolder, setNewFolder] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const handleMove = (folderName) => {
    onMove(folderName);
    onClose();
    setNewFolder("");
    setShowNewFolderInput(false);
  };

  const handleCreateAndMove = () => {
    if (newFolder.trim()) {
      handleMove(newFolder.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover para pasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Existing folders */}
          <div className="space-y-2">
            {folders.length === 0 && !showNewFolderInput && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma pasta criada ainda
              </p>
            )}
            {folders.map((folder) => (
              <Button
                key={folder}
                variant={currentFolder === folder ? "secondary" : "outline"}
                className="w-full justify-start"
                onClick={() => handleMove(folder)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder}
              </Button>
            ))}
          </div>

          {/* Create new folder */}
          {!showNewFolderInput ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewFolderInput(true)}
            >
              + Nova pasta
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Nova pasta</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da pasta"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAndMove()}
                />
                <Button onClick={handleCreateAndMove} disabled={!newFolder.trim()}>
                  Criar
                </Button>
              </div>
            </div>
          )}

          {/* Remove from folder */}
          {currentFolder && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">ou</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleMove(null)}
              >
                Remover da pasta
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}