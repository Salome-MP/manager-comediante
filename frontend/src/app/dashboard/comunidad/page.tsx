'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  MessageCircle,
  Pin,
  PinOff,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  Users2,
  ChevronDown,
} from 'lucide-react';
import type { CommunityMessage, PaginatedResponse } from '@/types';

export default function DashboardComunidadPage() {
  const { user } = useAuthStore();
  const artistId = user?.artistId;

  // Announcement form
  const [announcementContent, setAnnouncementContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Announcements list
  const [announcements, setAnnouncements] = useState<CommunityMessage[]>([]);
  const [announcementsTotal, setAnnouncementsTotal] = useState(0);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<CommunityMessage[]>([]);
  const [chatTotal, setChatTotal] = useState(0);
  const [chatPage, setChatPage] = useState(1);
  const [loadingChat, setLoadingChat] = useState(true);

  // Artist chat message
  const [chatContent, setChatContent] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Members
  const [members, setMembers] = useState<{ id: string; firstName: string; lastName: string; joinedAt: string }[]>([]);
  const [showMembers, setShowMembers] = useState(false);

  // Mobile tab
  const [mobileTab, setMobileTab] = useState<'chat' | 'announcements'>('announcements');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAnnouncements = useCallback(async (page = 1, append = false) => {
    if (!artistId) return;
    try {
      const { data } = await api.get<PaginatedResponse<CommunityMessage>>(
        `/community/${artistId}/announcements?page=${page}&limit=20`
      );
      setAnnouncements(prev => append ? [...prev, ...data.data] : data.data);
      setAnnouncementsTotal(data.total);
      setAnnouncementsPage(page);
    } catch {
      // silent
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [artistId]);

  const fetchChat = useCallback(async (page = 1) => {
    if (!artistId) return;
    try {
      const { data } = await api.get<PaginatedResponse<CommunityMessage>>(
        `/community/${artistId}/chat?page=${page}&limit=50`
      );
      setChatMessages(data.data);
      setChatTotal(data.total);
      setChatPage(page);
    } catch {
      // silent
    } finally {
      setLoadingChat(false);
    }
  }, [artistId]);

  const fetchMembers = useCallback(async () => {
    if (!artistId) return;
    try {
      const { data } = await api.get(`/community/${artistId}/members`);
      setMembers(data);
    } catch {
      // silent
    }
  }, [artistId]);

  useEffect(() => {
    fetchAnnouncements();
    fetchChat();
    fetchMembers();
  }, [fetchAnnouncements, fetchChat, fetchMembers]);

  const handlePublishAnnouncement = async () => {
    if (!artistId || !announcementContent.trim()) return;
    setPublishing(true);
    try {
      const { data } = await api.post<CommunityMessage>(
        `/community/${artistId}/announcements`,
        { content: announcementContent.trim() }
      );
      setAnnouncements(prev => [data, ...prev]);
      setAnnouncementsTotal(prev => prev + 1);
      setAnnouncementContent('');
      toast.success('Aviso publicado');
    } catch {
      toast.error('Error al publicar aviso');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteMessage = async (messageId: string, type: 'announcement' | 'chat') => {
    if (!artistId) return;
    try {
      await api.delete(`/community/${artistId}/messages/${messageId}`);
      if (type === 'announcement') {
        setAnnouncements(prev => prev.filter(m => m.id !== messageId));
        setAnnouncementsTotal(prev => prev - 1);
      } else {
        setChatMessages(prev => prev.filter(m => m.id !== messageId));
        setChatTotal(prev => prev - 1);
      }
      toast.success('Mensaje eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSendChat = async () => {
    if (!artistId || !chatContent.trim()) return;
    setSendingChat(true);
    try {
      const { data } = await api.post<CommunityMessage>(`/community/${artistId}/chat`, {
        content: chatContent.trim(),
      });
      setChatMessages(prev => [...prev, data]);
      setChatTotal(prev => prev + 1);
      setChatContent('');
    } catch {
      toast.error('Error al enviar mensaje');
    } finally {
      setSendingChat(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const handleTogglePin = async (messageId: string) => {
    if (!artistId) return;
    try {
      const { data } = await api.patch<CommunityMessage>(
        `/community/${artistId}/messages/${messageId}/pin`
      );
      setAnnouncements(prev =>
        prev.map(m => m.id === messageId ? data : m)
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
      );
      toast.success(data.isPinned ? 'Aviso fijado' : 'Aviso desfijado');
    } catch {
      toast.error('Error al fijar aviso');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-PE', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const formatDayDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  // Group chat messages by day
  const groupedMessages = chatMessages.reduce<{ date: string; messages: CommunityMessage[] }[]>((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && new Date(lastGroup.messages[0].createdAt).toDateString() === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: dateKey, messages: [msg] });
    }
    return groups;
  }, []);

  if (!artistId) return null;

  return (
    <div className="h-full flex flex-col">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">Comunidad</h2>
          <p className="mt-0.5 text-sm text-text-dim">
            Publica avisos y modera el chat de tu comunidad
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMembers(!showMembers)}
          className={`text-xs gap-1.5 w-full sm:w-auto ${showMembers ? 'bg-navy-600/20 text-navy-600 dark:text-navy-300 border-navy-500/30' : ''}`}
        >
          <Users2 className="h-3.5 w-3.5" />
          {members.length} miembros
        </Button>
      </div>

      {/* ═══ Main unified container ═══ */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-border-default bg-surface-card/40" style={{ height: 'calc(100vh - 200px)' }}>

        {/* ─── Left: Announcements ─── */}
        <div className="w-full lg:w-[360px] shrink-0 border-r border-border-default hidden lg:flex flex-col">
          {/* Announcements header */}
          <button
            onClick={() => setShowAnnouncements(!showAnnouncements)}
            className="flex items-center gap-2 px-4 py-3 text-left hover:bg-overlay-light/30 transition-colors border-b border-border-default/50"
          >
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-text-primary flex-1">Avisos</span>
            <Badge className="bg-overlay-strong text-text-dim border-0 text-[10px] mr-1">
              {announcementsTotal}
            </Badge>
            <ChevronDown className={`h-3.5 w-3.5 text-text-ghost transition-transform ${showAnnouncements ? '' : '-rotate-90'}`} />
          </button>

          {showAnnouncements && (
            <>
              {/* Create form */}
              <div className="border-b border-border-default/50 p-3 space-y-2">
                <Textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Escribe un aviso para tu comunidad..."
                  rows={2}
                  maxLength={2000}
                  className="min-h-[56px] max-h-[90px] resize-none border-0 bg-overlay-light/80 text-text-primary placeholder:text-text-ghost focus:ring-1 focus:ring-amber-500/30 text-[13px] rounded-xl"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-ghost">{announcementContent.length}/2000</span>
                  <Button
                    onClick={handlePublishAnnouncement}
                    disabled={publishing || !announcementContent.trim()}
                    size="sm"
                    className="h-7 text-xs bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 rounded-lg"
                  >
                    {publishing ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-3 w-3" />
                    )}
                    Publicar
                  </Button>
                </div>
              </div>

              {/* Announcements list */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2">
                {loadingAnnouncements ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="h-8 w-8 text-text-ghost mx-auto mb-2" />
                    <p className="text-xs text-text-dim">No has publicado avisos</p>
                  </div>
                ) : (
                  <>
                    {announcements.map((msg) => (
                      <div
                        key={msg.id}
                        className={`group rounded-xl p-3 ${
                          msg.isPinned
                            ? 'bg-amber-500/5 border border-amber-500/20'
                            : 'bg-overlay-light/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {msg.isPinned && (
                              <div className="flex items-center gap-1 text-amber-400 text-[10px] font-medium mb-1">
                                <Pin className="h-2.5 w-2.5" /> Fijado
                              </div>
                            )}
                            <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">{msg.content}</p>
                            <p className="text-[10px] text-text-ghost mt-1.5">{formatDate(msg.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1 rounded text-text-dim hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              onClick={() => handleTogglePin(msg.id)}
                              title={msg.isPinned ? 'Desfijar' : 'Fijar'}
                            >
                              {msg.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              className="p-1 rounded text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              onClick={() => handleDeleteMessage(msg.id, 'announcement')}
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {announcements.length < announcementsTotal && (
                      <div className="text-center pt-1">
                        <Button variant="ghost" size="sm" className="text-xs text-text-dim" onClick={() => fetchAnnouncements(announcementsPage + 1, true)}>
                          Cargar mas
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─── Center: Chat ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(58,90,140,0.015)_30px,rgba(58,90,140,0.015)_31px)]">

          {/* Mobile tabs */}
          <div className="flex lg:hidden border-b border-border-default/50">
            <button
              onClick={() => setMobileTab('announcements')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                mobileTab === 'announcements' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-text-dim'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5 inline mr-1" />
              Avisos {announcementsTotal > 0 && `(${announcementsTotal})`}
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                mobileTab === 'chat' ? 'text-navy-400 border-b-2 border-navy-500' : 'text-text-dim'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5 inline mr-1" />
              Chat {chatTotal > 0 && `(${chatTotal})`}
            </button>
          </div>

          {/* Mobile announcements */}
          {mobileTab === 'announcements' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 lg:hidden">
              {/* Create form */}
              <div className="space-y-2 pb-3 border-b border-border-default/50 mb-3">
                <Textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Escribe un aviso..."
                  rows={2}
                  maxLength={2000}
                  className="min-h-[56px] max-h-[90px] resize-none border-0 bg-overlay-light/80 text-text-primary placeholder:text-text-ghost focus:ring-1 focus:ring-amber-500/30 text-[13px] rounded-xl"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-ghost">{announcementContent.length}/2000</span>
                  <Button onClick={handlePublishAnnouncement} disabled={publishing || !announcementContent.trim()} size="sm" className="h-7 text-xs bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 rounded-lg">
                    {publishing ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Send className="mr-1.5 h-3 w-3" />}
                    Publicar
                  </Button>
                </div>
              </div>
              {announcements.map((msg) => (
                <div key={msg.id} className={`group rounded-xl p-3 ${msg.isPinned ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-overlay-light/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {msg.isPinned && <div className="flex items-center gap-1 text-amber-400 text-[10px] font-medium mb-1"><Pin className="h-2.5 w-2.5" /> Fijado</div>}
                      <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">{msg.content}</p>
                      <p className="text-[10px] text-text-ghost mt-1.5">{formatDate(msg.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button className="p-1 rounded text-text-dim hover:text-amber-400" onClick={() => handleTogglePin(msg.id)}>{msg.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</button>
                      <button className="p-1 rounded text-text-dim hover:text-red-400" onClick={() => handleDeleteMessage(msg.id, 'announcement')}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat area */}
          <div className={`flex-1 flex flex-col min-h-0 ${mobileTab !== 'chat' ? 'hidden lg:flex' : ''}`}>
            {/* Refresh bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-default/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-navy-400" />
                <span className="text-xs font-medium text-text-secondary">Chat de fans</span>
                {chatTotal > 0 && <Badge className="bg-overlay-strong text-text-dim border-0 text-[10px]">{chatTotal}</Badge>}
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => { setLoadingChat(true); fetchChat(); }}
                className="h-6 text-[11px] text-text-ghost hover:text-text-primary px-2"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Refrescar
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
              {loadingChat ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-navy-600/10 mb-4">
                    <MessageCircle className="h-8 w-8 text-navy-400/50" />
                  </div>
                  <p className="text-sm text-text-dim">No hay mensajes en el chat</p>
                </div>
              ) : (
                <>
                  {chatMessages.length < chatTotal && (
                    <div className="text-center py-3">
                      <Button variant="ghost" size="sm" className="text-xs text-text-dim hover:text-navy-400" onClick={() => fetchChat(chatPage + 1)}>
                        Cargar mas
                      </Button>
                    </div>
                  )}
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Day divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border-default/50" />
                        <span className="text-[10px] font-medium text-text-ghost bg-surface-card/80 px-3 py-1 rounded-full">
                          {formatDayDivider(group.messages[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-border-default/50" />
                      </div>
                      {/* Messages */}
                      <div className="space-y-1.5">
                        {group.messages.map((msg) => {
                          const isMe = user?.id === msg.senderId;
                          return (
                            <div key={msg.id} className={`group flex gap-2 ${isMe ? 'justify-end' : ''}`}>
                              {/* Avatar (only for others) */}
                              {!isMe && (
                                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-navy-600/15 text-[10px] font-bold text-navy-400 mt-0.5 self-end">
                                  {getInitials(msg.sender.firstName, msg.sender.lastName)}
                                </div>
                              )}
                              <div className={`max-w-[70%] px-3 py-2 ${
                                isMe
                                  ? 'bg-navy-600/25 rounded-2xl rounded-br-sm'
                                  : 'bg-surface-card/80 rounded-2xl rounded-bl-sm'
                              }`}>
                                {!isMe && (
                                  <p className="text-[11px] font-semibold text-navy-400 mb-0.5">
                                    {msg.sender.firstName} {msg.sender.lastName}
                                  </p>
                                )}
                                {isMe && (
                                  <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">Tu</p>
                                )}
                                <p className="text-[13px] text-text-secondary whitespace-pre-line leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] text-text-ghost mt-0.5 ${isMe ? 'text-right' : ''}`}>{formatTime(msg.createdAt)}</p>
                              </div>
                              {/* Delete button */}
                              <button
                                className={`shrink-0 p-1 rounded text-text-ghost opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all mt-1 ${isMe ? 'order-first' : ''}`}
                                onClick={() => handleDeleteMessage(msg.id, 'chat')}
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-border-default/30 bg-surface-card/40 backdrop-blur-sm p-3">
              <div className="flex gap-2 items-end max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <Textarea
                    value={chatContent}
                    onChange={(e) => setChatContent(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="min-h-[42px] max-h-[100px] resize-none border-0 bg-overlay-light/80 text-text-primary placeholder:text-text-ghost focus:ring-1 focus:ring-navy-500/30 rounded-2xl text-[13px]"
                  />
                </div>
                <Button
                  onClick={handleSendChat}
                  disabled={sendingChat || !chatContent.trim()}
                  size="icon"
                  className="shrink-0 bg-navy-600 text-white hover:bg-navy-500 disabled:opacity-30 h-[42px] w-[42px] rounded-full shadow-lg shadow-navy-600/20"
                >
                  {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right: Members ─── */}
        {showMembers && (
          <div className="w-[220px] shrink-0 border-l border-border-default hidden lg:flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default/50">
              <Users2 className="h-4 w-4 text-navy-400" />
              <span className="text-sm font-semibold text-text-primary flex-1">Miembros</span>
              <Badge className="bg-overlay-strong text-text-dim border-0 text-[10px]">
                {members.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 space-y-0.5">
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-text-dim">Sin miembros</p>
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-overlay-light/50 transition-colors">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-600/15 text-[10px] font-bold text-navy-400">
                      {getInitials(m.firstName, m.lastName)}
                    </div>
                    <p className="text-xs font-medium text-text-secondary truncate flex-1">
                      {m.firstName} {m.lastName}
                    </p>
                    <div className="h-2 w-2 rounded-full bg-emerald-500/60 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
