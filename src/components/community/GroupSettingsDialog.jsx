import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, Shield, UserX, UserPlus, Camera, Users, Settings as SettingsIcon, Search } from "lucide-react";
import { toast } from "sonner";

export default function GroupSettingsDialog({ group, members, currentUserEmail, currentUserRole, open, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConnections, setLoadingConnections] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && currentUserEmail) {
      loadConnections();
    }
  }, [open, currentUserEmail]);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const follows = await base44.entities.UserFollow.filter({
        follower_email: currentUserEmail
      });
      
      const connectionEmails = follows.map(f => f.following_email);
      const users = await base44.entities.User.list();
      
      const connectionUsers = users
        .filter(u => connectionEmails.includes(u.email))
        .filter(u => !members.some(m => m.user_email === u.email));
      
      setConnections(connectionUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleUpdatePermissions = async (memberId, permissions) => {
    setUpdating(true);
    try {
      await base44.entities.GroupMember.update(memberId, { permissions });
      toast.success("Permissões atualizadas");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar permissões");
    } finally {
      setUpdating(false);
    }
  };

  const handlePromoteToModerator = async (memberId) => {
    setUpdating(true);
    try {
      await base44.entities.GroupMember.update(memberId, {
        role: "moderator",
        permissions: {
          can_post: true,
          can_comment: true,
          can_moderate: true
        }
      });
      toast.success("Membro promovido a moderador");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao promover membro");
    } finally {
      setUpdating(false);
    }
  };

  const handleDemoteToMember = async (memberId) => {
    setUpdating(true);
    try {
      await base44.entities.GroupMember.update(memberId, {
        role: "member",
        permissions: {
          can_post: true,
          can_comment: true,
          can_moderate: false
        }
      });
      toast.success("Moderador rebaixado a membro");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rebaixar moderador");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (memberEmail === currentUserEmail) return;

    setUpdating(true);
    try {
      await base44.entities.GroupMember.delete(memberId);
      await base44.entities.CommunityGroup.update(group.id, {
        member_count: Math.max((group.member_count || 1) - 1, 0)
      });
      toast.success("Membro removido");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover membro");
    } finally {
      setUpdating(false);
    }
  };

  const handleInviteMember = async (userEmail) => {
    if (!userEmail.trim()) {
      toast.error("Selecione um usuário");
      return;
    }

    if (members.some(m => m.user_email === userEmail)) {
      toast.error("Este usuário já é membro do grupo");
      return;
    }

    setUpdating(true);
    try {
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: "group_invite",
        title: "Convite para grupo",
        message: `Você foi convidado para participar do grupo "${group.name}"`,
        severity: "info",
        from_user_email: currentUserEmail,
        metadata: {
          group_id: group.id,
          group_name: group.name,
          inviter_email: currentUserEmail
        }
      });

      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
      setSearchQuery("");
      loadConnections();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar convite");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGroupInfo = async () => {
    if (!groupName.trim()) {
      toast.error("O nome do grupo não pode estar vazio");
      return;
    }

    setUpdating(true);
    try {
      await base44.entities.CommunityGroup.update(group.id, {
        name: groupName,
        description: groupDescription
      });
      toast.success("Informações atualizadas");
      setEditingInfo(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar informações");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.CommunityGroup.update(group.id, {
        icon_url: file_url
      });
      toast.success("Foto do grupo atualizada!");
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const admins = members.filter(m => m.role === "admin");
  const moderators = members.filter(m => m.role === "moderator");
  const regularMembers = members.filter(m => m.role === "member");
  const isAdmin = currentUserRole === "admin";

  const iconColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    pink: "bg-pink-500"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Configurações do Grupo
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="moderation">Moderação</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {/* Group Icon */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <div className={`h-24 w-24 rounded-full ${iconColors[group.color]} flex items-center justify-center`}>
                  {group.icon_url ? (
                    <img src={group.icon_url} alt={group.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <Users className="h-12 w-12 text-white" />
                  )}
                </div>
                {isAdmin && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-violet-600 hover:bg-violet-700"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Group Info */}
            {isAdmin && editingInfo ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Nome do Grupo</Label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Descrição</Label>
                  <Textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="mt-1"
                    rows={4}
                    placeholder="Descreva sobre o que é este grupo..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateGroupInfo}
                    disabled={updating}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingInfo(false);
                      setGroupName(group.name);
                      setGroupDescription(group.description || "");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Nome do Grupo</Label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{group.name}</p>
                </div>
                {group.description && (
                  <div>
                    <Label className="text-sm text-gray-500">Descrição</Label>
                    <p className="text-gray-900 dark:text-white mt-1">{group.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-500">Membros</Label>
                  <p className="text-gray-900 dark:text-white mt-1">{members.length} membros</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setEditingInfo(true)}
                    className="w-full"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Editar Informações
                  </Button>
                )}
              </div>
            )}

            {/* Invite Members (Admin only) */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Convidar Membros
                </h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar suas conexões..."
                    className="pl-9"
                  />
                </div>
                
                {loadingConnections ? (
                  <p className="text-sm text-gray-500 text-center py-4">Carregando conexões...</p>
                ) : connections.length > 0 ? (
                  <ScrollArea className="h-[200px] rounded-lg border border-gray-200 dark:border-gray-800 p-2">
                    <div className="space-y-2">
                      {connections
                        .filter(user => 
                          searchQuery === "" || 
                          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user) => (
                          <div
                            key={user.email}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-violet-500 text-white text-xs">
                                  {user.full_name?.[0] || user.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {user.full_name || user.email.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleInviteMember(user.email)}
                              disabled={updating}
                              className="bg-violet-600 hover:bg-violet-700"
                            >
                              Convidar
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Nenhuma conexão disponível</p>
                    <p className="text-xs">Conecte-se com outros usuários primeiro</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            {/* Admins */}
            {admins.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Administradores ({admins.length})
                </h3>
                <div className="space-y-2">
                  {admins.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-500 text-white">
                            {member.user_name?.[0] || member.user_email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user_name || member.user_email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{member.user_email}</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-400">Admin</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderators */}
            {moderators.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Moderadores ({moderators.length})
                </h3>
                <div className="space-y-2">
                  {moderators.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-500 text-white">
                            {member.user_name?.[0] || member.user_email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user_name || member.user_email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDemoteToMember(member.id)}
                          disabled={updating}
                        >
                          Rebaixar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id, member.user_email)}
                          disabled={updating}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Members */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Membros ({regularMembers.length})
              </h3>
              <div className="space-y-2">
                {regularMembers.map((member) => (
                  <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-500 text-white">
                            {member.user_name?.[0] || member.user_email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user_name || member.user_email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{member.user_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromoteToModerator(member.id)}
                          disabled={updating}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Promover
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id, member.user_email)}
                          disabled={updating}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-2 pl-13 border-l-2 border-gray-200 dark:border-gray-700 ml-5">
                      <div className="flex items-center justify-between pl-3">
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Pode postar</Label>
                        <Switch
                          checked={member.permissions?.can_post !== false}
                          onCheckedChange={(checked) => 
                            handleUpdatePermissions(member.id, { 
                              ...member.permissions, 
                              can_post: checked 
                            })
                          }
                          disabled={updating}
                        />
                      </div>
                      <div className="flex items-center justify-between pl-3">
                        <Label className="text-sm text-gray-600 dark:text-gray-400">Pode comentar</Label>
                        <Switch
                          checked={member.permissions?.can_comment !== false}
                          onCheckedChange={(checked) => 
                            handleUpdatePermissions(member.id, { 
                              ...member.permissions, 
                              can_comment: checked 
                            })
                          }
                          disabled={updating}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Moderadores podem:</p>
              <ul className="mt-2 text-sm space-y-1">
                <li>• Fixar e desafixar posts</li>
                <li>• Remover posts e comentários</li>
                <li>• Aprovar conteúdo em revisão</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}