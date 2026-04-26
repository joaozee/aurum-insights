import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Search, Send, ArrowLeft, Users, Plus, Image as ImageIcon, Paperclip, Archive, Folder, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import GroupChatView from "@/components/community/GroupChatView";
import CreateGroupDialog from "@/components/community/CreateGroupDialog";
import AudioRecorder from "@/components/messages/AudioRecorder";
import MessageBubble from "@/components/messages/MessageBubble";
import ConversationContextMenu from "@/components/messages/ConversationContextMenu";
import MoveToFolderDialog from "@/components/messages/MoveToFolderDialog";
import { toast } from "sonner";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentUserMember, setCurrentUserMember] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageDate, setOldestMessageDate] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const [conversationMetadata, setConversationMetadata] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [moveToFolderOpen, setMoveToFolderOpen] = useState(false);
  const [conversationToMove, setConversationToMove] = useState(null);
  const [allConversations, setAllConversations] = useState([]);
  const [displayedConversations, setDisplayedConversations] = useState([]);
  const [conversationsPage, setConversationsPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);
  const previousScrollHeight = useRef(0);
  const notificationSoundRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    // Criar elemento de áudio para notificação
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltrzxnMpBSuBzvLajzYIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSh+zPLaizsKFme57+mhSxALSKPi8bppHgU6kdnyzn4tBSV8y/HcjToKFme58OmgSxEMSqTj8rxnHgY7k9rzz34sBSR7y/DdkDsLF2e58OmgShEMTKXk87xnHwY6k9vyz4AuBSN5yvDdkDwMGGi78OqfShAMTKXk9L1oHwY7lNvz0IEuBSR5yfDdk');
    
    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadGroups();
      loadConversationMetadata();
      
      // Check for conversation to open from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const conversationParam = urlParams.get('conversation');
      const emailParam = urlParams.get('email');
      const groupParam = urlParams.get('group');
      
      if (emailParam && !conversationParam) {
        // Create conversation ID from emails if only email is provided
        const conversationId = [user.email, emailParam].sort().join('_');
        setSelectedConversation({
          id: conversationId,
          otherUserEmail: emailParam
        });
        loadMessages(conversationId);
      } else if (conversationParam && emailParam) {
        setSelectedConversation({
          id: conversationParam,
          otherUserEmail: emailParam
        });
        loadMessages(conversationParam);
      } else if (groupParam) {
        // Find and select the group from URL
        const findAndSelectGroup = async () => {
          const memberships = await base44.entities.GroupMember.filter({
            user_email: user.email
          });
          const allGroups = await base44.entities.CommunityGroup.list();
          const group = allGroups.find(g => g.id === groupParam);
          if (group) {
            handleSelectGroup(group);
          }
        };
        findAndSelectGroup();
      }
      
      // Subscribe to real-time updates for messages
      const unsubscribe = base44.entities.DirectMessage.subscribe((event) => {
        if (event.type === 'create') {
          // Refresh conversations for any message involving this user
          if (event.data.receiver_email === user.email || event.data.sender_email === user.email) {
            loadConversations();
            
            // Mostrar notificação se for mensagem recebida e não está visualizando a conversa
            if (event.data.receiver_email === user.email && 
                (!selectedConversation || selectedConversation.id !== event.data.conversation_id)) {
              
              // Tocar som
              if (notificationSoundRef.current) {
                notificationSoundRef.current.play().catch(e => console.log('Erro ao tocar som:', e));
              }
              
              // Mostrar notificação do navegador
              if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification("Nova mensagem no Aurum", {
                  body: `${event.data.sender_email.split('@')[0]}: ${event.data.message?.substring(0, 50) || 'Enviou uma mídia'}`,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg",
                  badge: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6962dc8bf4f8f8a96c5dc36b/e3135d805_WhatsAppImage2026-01-30at190245.jpg",
                  tag: event.data.conversation_id,
                  requireInteraction: false,
                  silent: false
                });
                
                // Redirecionar para conversa ao clicar
                notification.onclick = () => {
                  window.focus();
                  const conversation = {
                    id: event.data.conversation_id,
                    otherUserEmail: event.data.sender_email
                  };
                  handleSelectConversation(conversation);
                  notification.close();
                };
                
                // Auto-fechar após 5 segundos
                setTimeout(() => notification.close(), 5000);
              }
              
              // Mostrar toast como fallback
              toast.info(`Nova mensagem de ${event.data.sender_email.split('@')[0]}`, {
                duration: 4000,
                action: {
                  label: 'Ver',
                  onClick: () => {
                    const conversation = {
                      id: event.data.conversation_id,
                      otherUserEmail: event.data.sender_email
                    };
                    handleSelectConversation(conversation);
                  }
                }
              });
            }
          }
        }
      });
      
      return unsubscribe;
    }
  }, [user]);

  // Separate effect to reload messages when conversation changes
  useEffect(() => {
    if (selectedConversation?.id) {
      const unsubscribe = base44.entities.DirectMessage.subscribe((event) => {
        if (event.type === 'create' && event.data.conversation_id === selectedConversation.id) {
          loadMessages(selectedConversation.id);
        }
      });
      return unsubscribe;
    }
  }, [selectedConversation?.id]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const allMessages = await base44.entities.DirectMessage.filter({
        $or: [
          { sender_email: user.email },
          { receiver_email: user.email }
        ]
      });

      // Group by conversation_id
      const conversationsMap = {};
      const emailsToFetch = new Set();
      
      allMessages.forEach(msg => {
        if (!conversationsMap[msg.conversation_id]) {
          const otherUserEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
          emailsToFetch.add(otherUserEmail);
          conversationsMap[msg.conversation_id] = {
            id: msg.conversation_id,
            otherUserEmail,
            lastMessage: msg.message,
            lastMessageDate: msg.created_date,
            unreadCount: 0
          };
        } else {
          if (new Date(msg.created_date) > new Date(conversationsMap[msg.conversation_id].lastMessageDate)) {
            conversationsMap[msg.conversation_id].lastMessage = msg.message;
            conversationsMap[msg.conversation_id].lastMessageDate = msg.created_date;
          }
        }
        if (!msg.is_read && msg.receiver_email === user.email) {
          conversationsMap[msg.conversation_id].unreadCount++;
        }
      });

      const sortedConversations = Object.values(conversationsMap).sort((a, b) => 
        new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      );

      setAllConversations(sortedConversations);
      
      // Load initial batch of conversations (20)
      const CONVERSATIONS_PER_PAGE = 20;
      const initialConversations = sortedConversations.slice(0, CONVERSATIONS_PER_PAGE);
      setDisplayedConversations(initialConversations);
      setConversationsPage(1);
      setHasMoreConversations(sortedConversations.length > CONVERSATIONS_PER_PAGE);

      // Buscar perfis dos usuários apenas para as conversas visíveis
      const visibleEmails = initialConversations.map(c => c.otherUserEmail);
      const profiles = await base44.entities.UserProfile.filter({
        user_email: { $in: visibleEmails }
      });
      
      const profilesMap = {};
      profiles.forEach(profile => {
        profilesMap[profile.user_email] = profile;
      });
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMoreConversations = async () => {
    if (loadingConversations || !hasMoreConversations) return;

    setLoadingConversations(true);
    try {
      const CONVERSATIONS_PER_PAGE = 20;
      const nextPage = conversationsPage + 1;
      const startIdx = conversationsPage * CONVERSATIONS_PER_PAGE;
      const endIdx = startIdx + CONVERSATIONS_PER_PAGE;
      
      const filtered = getFilteredConversationsList();
      const newConversations = filtered.slice(startIdx, endIdx);
      
      if (newConversations.length > 0) {
        setDisplayedConversations(prev => [...prev, ...newConversations]);
        setConversationsPage(nextPage);
        setHasMoreConversations(endIdx < filtered.length);

        // Buscar perfis dos novos usuários
        const newEmails = newConversations.map(c => c.otherUserEmail).filter(email => !userProfiles[email]);
        if (newEmails.length > 0) {
          const profiles = await base44.entities.UserProfile.filter({
            user_email: { $in: newEmails }
          });
          
          setUserProfiles(prev => {
            const updated = { ...prev };
            profiles.forEach(profile => {
              updated[profile.user_email] = profile;
            });
            return updated;
          });
        }
      } else {
        setHasMoreConversations(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMetadata = async () => {
    try {
      const metadata = await base44.entities.ConversationMetadata.filter({
        user_email: user.email
      });
      
      const metadataMap = {};
      metadata.forEach(m => {
        metadataMap[m.conversation_id] = m;
      });
      setConversationMetadata(metadataMap);
    } catch (error) {
      console.error(error);
    }
  };

  const loadGroups = async () => {
    try {
      const memberships = await base44.entities.GroupMember.filter({
        user_email: user.email
      });

      const allGroups = await base44.entities.CommunityGroup.list();
      const userGroups = allGroups.filter(g => 
        memberships.some(m => m.group_id === g.id)
      );

      setGroups(userGroups);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (conversationId, initialLoad = true) => {
    try {
      const limit = 50;
      const allMessages = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      }, '-created_date', 1000);

      if (initialLoad) {
        // Carregar apenas as 50 mensagens mais recentes e inverter para ordem cronológica
        const recentMessages = allMessages.slice(0, limit).reverse();
        setMessages(recentMessages);
        setHasMoreMessages(allMessages.length > limit);
        if (allMessages.length > 0) {
          setOldestMessageDate(allMessages[Math.min(limit - 1, allMessages.length - 1)].created_date);
        }

        // Mark as read
        const unreadMessages = recentMessages.filter(m => !m.is_read && m.receiver_email === user.email);
        for (const msg of unreadMessages) {
          await base44.entities.DirectMessage.update(msg.id, {
            is_read: true,
            read_at: new Date().toISOString()
          });
        }
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          const messagesContainer = messagesContainerRef.current;
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    try {
      const limit = 50;
      const olderMessages = await base44.entities.DirectMessage.filter({
        conversation_id: selectedConversation.id,
        created_date: { $lt: oldestMessageDate }
      }, '-created_date', limit);

      if (olderMessages.length > 0) {
        previousScrollHeight.current = messagesContainerRef.current?.scrollHeight || 0;
        // Adicionar mensagens antigas no início do array (ordem cronológica)
        setMessages(prev => [...olderMessages.reverse(), ...prev]);
        setOldestMessageDate(olderMessages[0].created_date);
        setHasMoreMessages(olderMessages.length === limit);

        // Manter posição do scroll após carregar mensagens antigas
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current;
          }
        }, 0);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMessagesScroll = (e) => {
    const container = e.target;
    // Debounce scroll event
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Carregar mais quando rolar próximo ao topo (100px do topo)
      if (container.scrollTop < 100 && !loadingMore && hasMoreMessages) {
        loadMoreMessages();
      }
    }, 150);
  };

  const handleConversationsScroll = (e) => {
    const container = e.target;
    // Debounce scroll event
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollHeight = container.scrollHeight;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      // Carregar mais quando rolar próximo ao final (200px do final)
      if (scrollHeight - scrollTop - clientHeight < 200 && !loadingConversations && hasMoreConversations) {
        loadMoreConversations();
      }
    }, 150);
  };

  const createMessageNotification = async (messageData) => {
    try {
      await base44.entities.Notification.create({
        user_email: user.email,
        title: "Nova mensagem",
        message: `${messageData.sender_email.split('@')[0]} enviou uma mensagem`,
        type: "message",
        data: JSON.stringify({ 
          conversation_id: messageData.conversation_id,
          sender_email: messageData.sender_email 
        }),
        is_read: false
      });
      
      // Show browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Nova mensagem no Aurum", {
          body: messageData.message.substring(0, 100),
          icon: "/logo.png",
          badge: "/logo.png"
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setSelectedGroup(null);
    setMessages([]);
    setHasMoreMessages(true);
    setOldestMessageDate(null);
    loadMessages(conversation.id, true);
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
    
    // Load current user's membership
    const memberships = await base44.entities.GroupMember.filter({
      group_id: group.id,
      user_email: user.email
    });
    setCurrentUserMember(memberships[0]);
  };

  const handleSendMessage = async (messageType = "text", attachmentUrl = null) => {
    if ((!newMessage.trim() && !attachmentUrl) || !selectedConversation) return;

    setSending(true);
    try {
      await base44.entities.DirectMessage.create({
        conversation_id: selectedConversation.id,
        sender_email: user.email,
        receiver_email: selectedConversation.otherUserEmail,
        message: newMessage.trim(),
        message_type: messageType,
        attachment_url: attachmentUrl
      });
      setNewMessage("");

      setTimeout(() => {
        const messagesContainer = messagesContainerRef.current;
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
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
      await handleSendMessage("image", file_url);
      toast.success("Imagem enviada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleAudioRecorded = async (audioBlob) => {
    setUploading(true);
    try {
      const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await handleSendMessage("audio", file_url);
      toast.success("Áudio enviado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar áudio");
    } finally {
      setUploading(false);
    }
  };

  const getOrCreateMetadata = async (conversationId) => {
    let metadata = conversationMetadata[conversationId];
    if (!metadata) {
      const existing = await base44.entities.ConversationMetadata.filter({
        user_email: user.email,
        conversation_id: conversationId
      });
      
      if (existing.length > 0) {
        metadata = existing[0];
      } else {
        metadata = await base44.entities.ConversationMetadata.create({
          user_email: user.email,
          conversation_id: conversationId
        });
      }
      setConversationMetadata(prev => ({ ...prev, [conversationId]: metadata }));
    }
    return metadata;
  };

  const handlePinConversation = async (conversation) => {
    try {
      const metadata = await getOrCreateMetadata(conversation.id);
      await base44.entities.ConversationMetadata.update(metadata.id, {
        is_pinned: !metadata.is_pinned
      });
      await loadConversationMetadata();
      toast.success(metadata.is_pinned ? 'Conversa desafixada' : 'Conversa fixada');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fixar conversa");
    }
  };

  const handleArchiveConversation = async (conversation) => {
    try {
      const metadata = await getOrCreateMetadata(conversation.id);
      await base44.entities.ConversationMetadata.update(metadata.id, {
        is_archived: !metadata.is_archived
      });
      await loadConversationMetadata();
      toast.success(metadata.is_archived ? 'Conversa desarquivada' : 'Conversa arquivada');
      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao arquivar conversa");
    }
  };

  const handleMarkUnread = async (conversation) => {
    try {
      const metadata = await getOrCreateMetadata(conversation.id);
      await base44.entities.ConversationMetadata.update(metadata.id, {
        is_marked_unread: true
      });
      await loadConversationMetadata();
      toast.success('Conversa marcada como não lida');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao marcar conversa");
    }
  };

  const handleMuteConversation = async (conversation) => {
    try {
      const metadata = await getOrCreateMetadata(conversation.id);
      await base44.entities.ConversationMetadata.update(metadata.id, {
        muted: !metadata.muted
      });
      await loadConversationMetadata();
      toast.success(metadata.muted ? 'Notificações ativadas' : 'Notificações silenciadas');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao silenciar conversa");
    }
  };

  const handleMoveToFolder = async (conversation, folderName) => {
    try {
      const metadata = await getOrCreateMetadata(conversation.id);
      await base44.entities.ConversationMetadata.update(metadata.id, {
        folder: folderName
      });
      await loadConversationMetadata();
      toast.success(folderName ? `Movida para ${folderName}` : 'Removida da pasta');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao mover conversa");
    }
  };

  const handleDeleteConversation = async (conversation) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const conversationMessages = await base44.entities.DirectMessage.filter({
        conversation_id: conversation.id
      });
      
      for (const msg of conversationMessages) {
        await base44.entities.DirectMessage.delete(msg.id);
      }
      
      const metadata = conversationMetadata[conversation.id];
      if (metadata) {
        await base44.entities.ConversationMetadata.delete(metadata.id);
      }
      
      await loadConversations();
      await loadConversationMetadata();
      
      if (selectedConversation?.id === conversation.id) {
        setSelectedConversation(null);
      }
      
      toast.success('Conversa excluída');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir conversa");
    }
  };

  const getDateLabel = (dateString) => {
    const messageDate = moment(dateString);
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const weekAgo = moment().subtract(7, 'days').startOf('day');

    if (messageDate.isSame(today, 'day')) {
      return 'Hoje';
    } else if (messageDate.isSame(yesterday, 'day')) {
      return 'Ontem';
    } else if (messageDate.isAfter(weekAgo)) {
      const dayName = messageDate.format('dddd');
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    } else {
      return messageDate.format('DD/MM/YYYY');
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const dateLabel = getDateLabel(message.created_date);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(message);
    });
    return groups;
  };

  const getFilteredConversationsList = () => {
    let filtered = allConversations;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const profile = userProfiles[c.otherUserEmail];
        const displayName = profile?.display_name || c.otherUserEmail;
        return displayName.toLowerCase().includes(query) || 
               c.lastMessage?.toLowerCase().includes(query);
      });
    }

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(c => conversationMetadata[c.id]?.folder === selectedFolder);
    }

    // Filter archived
    if (showArchived) {
      filtered = filtered.filter(c => conversationMetadata[c.id]?.is_archived);
    } else {
      filtered = filtered.filter(c => !conversationMetadata[c.id]?.is_archived);
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      const aMetadata = conversationMetadata[a.id];
      const bMetadata = conversationMetadata[b.id];
      
      if (aMetadata?.is_pinned && !bMetadata?.is_pinned) return -1;
      if (!aMetadata?.is_pinned && bMetadata?.is_pinned) return 1;
      
      return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
    });

    return filtered;
  };

  const getFilteredConversations = () => {
    const filtered = getFilteredConversationsList();
    return displayedConversations.filter(dc => 
      filtered.some(fc => fc.id === dc.id)
    );
  };

  // Update displayed conversations when filters change
  useEffect(() => {
    if (allConversations.length > 0) {
      const CONVERSATIONS_PER_PAGE = 20;
      const filtered = getFilteredConversationsList();
      setDisplayedConversations(filtered.slice(0, CONVERSATIONS_PER_PAGE));
      setConversationsPage(1);
      setHasMoreConversations(filtered.length > CONVERSATIONS_PER_PAGE);
    }
  }, [selectedFolder, showArchived, searchQuery, conversationMetadata]);

  const getAvailableFolders = () => {
    const folders = new Set();
    Object.values(conversationMetadata).forEach(m => {
      if (m.folder) folders.add(m.folder);
    });
    return Array.from(folders);
  };

  const getConversationUnreadCount = (conversation) => {
    const metadata = conversationMetadata[conversation.id];
    if (metadata?.is_marked_unread) return 1;
    return conversation.unreadCount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <Skeleton className="h-screen" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-4">
        {/* Back Button */}
        <Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para comunidade
        </Link>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden h-[calc(100vh-140px)]">
          <div className="grid grid-cols-12 h-full overflow-hidden">
            {/* Conversations List */}
            <div className={`col-span-12 md:col-span-4 border-r border-gray-200 dark:border-gray-800 ${selectedConversation || selectedGroup ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mensagens</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCreateGroupOpen(true)}
                    title="Criar grupo"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-100 dark:bg-gray-800 border-0"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    size="sm"
                    variant={!selectedFolder && !showArchived ? "secondary" : "ghost"}
                    onClick={() => { setSelectedFolder(null); setShowArchived(false); }}
                    className="flex-shrink-0"
                  >
                    Todas
                  </Button>
                  {getAvailableFolders().map(folder => (
                    <Button
                      key={folder}
                      size="sm"
                      variant={selectedFolder === folder ? "secondary" : "ghost"}
                      onClick={() => { setSelectedFolder(folder); setShowArchived(false); }}
                      className="flex-shrink-0"
                    >
                      <Folder className="h-3 w-3 mr-1" />
                      {folder}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={showArchived ? "secondary" : "ghost"}
                    onClick={() => { setShowArchived(!showArchived); setSelectedFolder(null); }}
                    className="flex-shrink-0"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Arquivadas
                  </Button>
                </div>
              </div>
              
              <ScrollArea 
                className="h-[calc(100%-120px)]"
                ref={conversationsContainerRef}
                onScroll={handleConversationsScroll}
              >
                {/* Groups */}
                {groups.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Grupos</p>
                    </div>
                    {groups.map((group) => {
                      const iconColors = {
                        blue: "bg-blue-500",
                        purple: "bg-purple-500",
                        emerald: "bg-emerald-500",
                        amber: "bg-amber-500",
                        red: "bg-red-500",
                        pink: "bg-pink-500"
                      };
                      return (
                        <button
                          key={group.id}
                          onClick={() => handleSelectGroup(group)}
                          className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                            selectedGroup?.id === group.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${iconColors[group.color]} flex items-center justify-center flex-shrink-0`}>
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {group.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {group.member_count} membros
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Direct Conversations */}
                {getFilteredConversations().length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Mensagens Diretas</p>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {getFilteredConversations().map((conversation) => {
                        const profile = userProfiles[conversation.otherUserEmail];
                        const metadata = conversationMetadata[conversation.id];
                        const unreadCount = getConversationUnreadCount(conversation);
                        return (
                          <div
                            key={conversation.id}
                            className={`relative group ${
                              selectedConversation?.id === conversation.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleSelectConversation(conversation)}
                              className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  {profile?.profile_image_url ? (
                                    <img 
                                      src={profile.profile_image_url} 
                                      alt={profile.display_name || conversation.otherUserEmail.split('@')[0]}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-violet-500 text-white">
                                      {conversation.otherUserEmail[0].toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {metadata?.is_pinned && (
                                      <Pin className="h-3 w-3 text-violet-500 flex-shrink-0" />
                                    )}
                                    <p className={`font-semibold text-sm text-gray-900 dark:text-white truncate ${
                                      unreadCount > 0 ? 'font-bold' : ''
                                    }`}>
                                      {profile?.display_name || conversation.otherUserEmail.split('@')[0]}
                                    </p>
                                    {unreadCount > 0 && (
                                      <span className="bg-violet-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                        {unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className={`text-xs text-gray-600 dark:text-gray-400 truncate flex-1 ${
                                      unreadCount > 0 ? 'font-semibold' : ''
                                    }`}>
                                      {conversation.lastMessage}
                                    </p>
                                    {metadata?.muted && (
                                      <span className="text-gray-400 text-xs flex-shrink-0">🔕</span>
                                    )}
                                  </div>
                                  {metadata?.folder && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Folder className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{metadata.folder}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                            <div className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ConversationContextMenu
                                conversation={conversation}
                                metadata={metadata}
                                onPin={() => handlePinConversation(conversation)}
                                onArchive={() => handleArchiveConversation(conversation)}
                                onMarkUnread={() => handleMarkUnread(conversation)}
                                onMute={() => handleMuteConversation(conversation)}
                                onMoveToFolder={() => {
                                  setConversationToMove(conversation);
                                  setMoveToFolderOpen(true);
                                }}
                                onDelete={() => handleDeleteConversation(conversation)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {getFilteredConversations().length === 0 && groups.length === 0 && !loadingConversations && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery ? 'Nenhuma conversa encontrada' : showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa ainda'}
                    </p>
                  </div>
                )}

                {/* Loading more conversations indicator */}
                {loadingConversations && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`col-span-12 md:col-span-8 h-full overflow-hidden ${!selectedConversation && !selectedGroup ? 'hidden md:flex' : ''}`}>
              {selectedGroup ? (
                <>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedGroup(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </div>
                  <GroupChatView 
                    group={selectedGroup} 
                    currentUser={user}
                    currentUserMember={currentUserMember}
                  />
                </>
              ) : selectedConversation ? (
                <div className="h-full flex flex-col">
                  {/* Chat Header - fixed */}
                  <div className="shrink-0 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      {userProfiles[selectedConversation.otherUserEmail]?.profile_image_url ? (
                        <img 
                          src={userProfiles[selectedConversation.otherUserEmail].profile_image_url} 
                          alt={userProfiles[selectedConversation.otherUserEmail].display_name || selectedConversation.otherUserEmail.split('@')[0]}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      ) : (
                        <AvatarFallback className="bg-violet-500 text-white">
                          {selectedConversation.otherUserEmail[0].toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {userProfiles[selectedConversation.otherUserEmail]?.display_name || selectedConversation.otherUserEmail.split('@')[0]}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedConversation.otherUserEmail}
                      </p>
                    </div>
                  </div>

                  {/* Messages - grows to fill space with scroll */}
                  <div 
                    ref={messagesContainerRef}
                    id="messages-container" 
                    className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950 min-h-0"
                    onScroll={handleMessagesScroll}
                  >
                    {loadingMore && (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                      </div>
                    )}
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Nenhuma mensagem ainda. Comece a conversa!
                        </p>
                      </div>
                    ) : (
                      Object.entries(groupMessagesByDate(messages)).map(([dateLabel, dateMessages]) => (
                        <div key={dateLabel} className="mb-6">
                          {/* Date Separator */}
                          <div className="flex items-center justify-center mb-4">
                            <div className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-3 py-1 rounded-full">
                              {dateLabel}
                            </div>
                          </div>
                          {/* Messages for this date */}
                          <div className="space-y-4">
                            {dateMessages.map((message) => (
                              <MessageBubble 
                                key={message.id}
                                message={message}
                                isOwn={message.sender_email === user.email}
                                senderProfile={userProfiles[message.sender_email]}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input - fixed at bottom */}
                  <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex gap-2 items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Enviar imagem"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        disabled={uploading}
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={(!newMessage.trim() || sending) && !uploading}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Escolha uma conversa da lista para começar a mensagem
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateGroupDialog 
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSuccess={() => {
          setCreateGroupOpen(false);
          loadGroups();
        }}
        userEmail={user?.email}
      />

      <MoveToFolderDialog
        open={moveToFolderOpen}
        onClose={() => {
          setMoveToFolderOpen(false);
          setConversationToMove(null);
        }}
        folders={getAvailableFolders()}
        currentFolder={conversationToMove ? conversationMetadata[conversationToMove.id]?.folder : null}
        onMove={(folderName) => {
          if (conversationToMove) {
            handleMoveToFolder(conversationToMove, folderName);
          }
        }}
      />
    </div>
  );
}