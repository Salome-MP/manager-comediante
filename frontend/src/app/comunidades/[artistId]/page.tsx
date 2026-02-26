'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  MessageCircle,
  Pin,
  Send,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Users2,
  LogIn,
  Smile,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import type { CommunityMessage, PaginatedResponse } from '@/types';

const EmojiPicker = dynamic(() => import('@emoji-mart/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-[350px] w-[350px] animate-pulse rounded-xl bg-overlay-light" />,
});
import emojiData from '@emoji-mart/data';

interface ArtistInfo {
  id: string;
  stageName: string;
  slug: string;
  profileImage?: string;
  _count?: { communityMembers: number; communityMessages: number };
}

interface CommunityMemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
}

export default function CommunityViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const artistId = params.artistId as string;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [ready, setReady] = useState(false);

  // Members
  const [members, setMembers] = useState<CommunityMemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<CommunityMessage[]>([]);
  const [announcementsTotal, setAnnouncementsTotal] = useState(0);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  // Chat
  const [chatMessages, setChatMessages] = useState<CommunityMessage[]>([]);
  const [chatTotal, setChatTotal] = useState(0);
  const [chatPage, setChatPage] = useState(1);
  const [loadingChat, setLoadingChat] = useState(true);
  const [refreshingChat, setRefreshingChat] = useState(false);

  // New message + emoji
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Active tab for mobile
  const [mobileTab, setMobileTab] = useState<'chat' | 'announcements'>('chat');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, [loadFromStorage]);

  useEffect(() => {
    if (ready && !user) {
      router.push('/login');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (artistId) {
      api.get(`/community/${artistId}/info`)
        .then(res => setArtist(res.data))
        .catch(() => router.push('/comunidades'));
    }
  }, [artistId, router]);

  useEffect(() => {
    if (artistId) {
      api.get(`/community/${artistId}/members`)
        .then(res => setMembers(res.data))
        .catch(() => {})
        .finally(() => setLoadingMembers(false));
    }
  }, [artistId]);

  const fetchAnnouncements = async (page = 1, append = false) => {
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
  };

  const fetchChat = async (page = 1, prepend = false) => {
    try {
      const { data } = await api.get<PaginatedResponse<CommunityMessage>>(
        `/community/${artistId}/chat?page=${page}&limit=50`
      );
      setChatMessages(prev => prepend ? [...data.data, ...prev] : data.data);
      setChatTotal(data.total);
      setChatPage(page);
    } catch {
      // silent
    } finally {
      setLoadingChat(false);
      setRefreshingChat(false);
    }
  };

  useEffect(() => {
    if (artistId) {
      fetchAnnouncements();
      fetchChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-emoji-picker]') && !target.closest('[data-emoji-trigger]')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);

  const handleRefreshChat = () => {
    setRefreshingChat(true);
    fetchChat(1);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post<CommunityMessage>(`/community/${artistId}/chat`, {
        content: newMessage.trim(),
      });
      setChatMessages(prev => [...prev, data]);
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch {
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage(prev => prev + emoji.native);
    textareaRef.current?.focus();
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

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-surface-deep flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col">
      {/* ═══ Header ═══ */}
      <div className="border-b border-border-default bg-surface-card/80 backdrop-blur-md px-4 py-2.5 sticky top-0 z-20">
        <div className="mx-auto max-w-6xl flex items-center gap-3">
          <Link
            href="/comunidades"
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-overlay-light text-text-dim hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {artist && (
            <div className="flex items-center gap-3 flex-1">
              {artist.profileImage ? (
                <img src={artist.profileImage} alt={artist.stageName} className="h-9 w-9 rounded-full object-cover ring-2 ring-navy-500/30" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-navy-600/20 flex items-center justify-center ring-2 ring-navy-500/30">
                  <span className="text-sm font-bold text-navy-400">{artist.stageName[0]}</span>
                </div>
              )}
              <div>
                <h1 className="text-sm font-semibold text-text-primary leading-tight">{artist.stageName}</h1>
                <p className="text-[11px] text-text-dim">{members.length} miembros</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMembers(!showMembers)}
            className={`text-xs gap-1.5 ${showMembers ? 'bg-navy-600/20 text-navy-600 dark:text-navy-300' : 'text-text-dim hover:text-text-primary'}`}
          >
            <Users2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Miembros</span>
          </Button>
        </div>
      </div>

      {/* ═══ Main layout — single container ═══ */}
      <div className="flex-1 mx-auto w-full max-w-6xl flex overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>

        {/* ─── Sidebar: Announcements (desktop) ─── */}
        <div className="w-[300px] shrink-0 border-r border-border-default bg-surface-card/40 hidden lg:flex flex-col">
          <button
            onClick={() => setShowAnnouncements(!showAnnouncements)}
            className="flex items-center gap-2 px-4 py-3 text-left hover:bg-overlay-light/50 transition-colors"
          >
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-text-primary flex-1">Avisos</span>
            <Badge className="bg-overlay-strong text-text-dim border-0 text-[10px] mr-1">
              {announcementsTotal}
            </Badge>
            <ChevronDown className={`h-3.5 w-3.5 text-text-ghost transition-transform ${showAnnouncements ? '' : '-rotate-90'}`} />
          </button>

          {showAnnouncements && (
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {loadingAnnouncements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="h-8 w-8 text-text-ghost mx-auto mb-2" />
                  <p className="text-sm text-text-dim">No hay avisos todavia</p>
                </div>
              ) : (
                <>
                  {announcements.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3 ${
                        msg.isPinned
                          ? 'bg-amber-500/5 border border-amber-500/20'
                          : 'bg-overlay-light/50'
                      }`}
                    >
                      {msg.isPinned && (
                        <div className="flex items-center gap-1 text-amber-400 text-[10px] font-medium mb-1.5">
                          <Pin className="h-2.5 w-2.5" /> Fijado
                        </div>
                      )}
                      <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">{msg.content}</p>
                      <p className="text-[10px] text-text-ghost mt-2">{formatDate(msg.createdAt)}</p>
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
          )}
        </div>

        {/* ─── Center: Chat area ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(58,90,140,0.015)_30px,rgba(58,90,140,0.015)_31px)]">

          {/* Mobile tabs */}
          <div className="flex lg:hidden border-b border-border-default bg-surface-card/40">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                mobileTab === 'chat' ? 'text-navy-400 border-b-2 border-navy-500' : 'text-text-dim'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5 inline mr-1" />
              Chat
            </button>
            <button
              onClick={() => setMobileTab('announcements')}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
                mobileTab === 'announcements' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-text-dim'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5 inline mr-1" />
              Avisos {announcementsTotal > 0 && `(${announcementsTotal})`}
            </button>
          </div>

          {/* Mobile announcements view */}
          {mobileTab === 'announcements' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 lg:hidden">
              {loadingAnnouncements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="h-8 w-8 text-text-ghost mx-auto mb-2" />
                  <p className="text-sm text-text-dim">No hay avisos todavia</p>
                </div>
              ) : (
                announcements.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-3 ${msg.isPinned ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-overlay-light/50'}`}
                  >
                    {msg.isPinned && (
                      <div className="flex items-center gap-1 text-amber-400 text-[10px] font-medium mb-1.5">
                        <Pin className="h-2.5 w-2.5" /> Fijado
                      </div>
                    )}
                    <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">{msg.content}</p>
                    <p className="text-[10px] text-text-ghost mt-2">{formatDate(msg.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chat messages (always visible on desktop, tab on mobile) */}
          <div className={`flex-1 flex flex-col min-h-0 ${mobileTab !== 'chat' ? 'hidden lg:flex' : ''}`}>
            {/* Refresh bar */}
            <div className="flex items-center justify-end px-4 py-1.5">
              <Button
                variant="ghost" size="sm" onClick={handleRefreshChat} disabled={refreshingChat}
                className="h-6 text-[11px] text-text-ghost hover:text-text-primary px-2"
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${refreshingChat ? 'animate-spin' : ''}`} />
                Actualizar
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
                  <p className="text-sm text-text-dim">Se el primero en escribir en este chat</p>
                </div>
              ) : (
                <>
                  {chatMessages.length < chatTotal && (
                    <div className="text-center py-3">
                      <Button variant="ghost" size="sm" className="text-xs text-text-dim hover:text-navy-400" onClick={() => fetchChat(chatPage + 1, true)}>
                        Cargar mensajes anteriores
                      </Button>
                    </div>
                  )}
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Day divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border-default/50" />
                        <span className="text-[10px] font-medium text-text-ghost bg-surface-deep/80 px-3 py-1 rounded-full">
                          {formatDayDivider(group.messages[0].createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-border-default/50" />
                      </div>
                      {/* Messages for this day */}
                      <div className="space-y-1.5">
                        {group.messages.map((msg) => {
                          const isMe = user?.id === msg.senderId;
                          return (
                            <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : ''}`}>
                              {!isMe && (
                                <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-navy-600/15 text-[10px] font-bold text-navy-400 mt-0.5 self-end">
                                  {getInitials(msg.sender.firstName, msg.sender.lastName)}
                                </div>
                              )}
                              <div className={`max-w-[75%] px-3 py-2 ${
                                isMe
                                  ? 'bg-navy-600/25 rounded-2xl rounded-br-sm'
                                  : 'bg-surface-card/80 rounded-2xl rounded-bl-sm'
                              }`}>
                                {!isMe && (
                                  <p className="text-[11px] font-semibold text-navy-400 mb-0.5">
                                    {msg.sender.firstName} {msg.sender.lastName}
                                  </p>
                                )}
                                <p className="text-[13px] text-text-secondary whitespace-pre-line leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] text-text-ghost mt-0.5 ${isMe ? 'text-right' : ''}`}>{formatTime(msg.createdAt)}</p>
                              </div>
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
            <div className="border-t border-border-default/50 bg-surface-card/40 backdrop-blur-sm p-3">
              {user ? (
                <div className="relative max-w-4xl mx-auto">
                  {showEmojiPicker && (
                    <div data-emoji-picker className="absolute bottom-full right-0 mb-2 z-50">
                      <EmojiPicker
                        data={emojiData}
                        onEmojiSelect={handleEmojiSelect}
                        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                        locale="es"
                        previewPosition="none"
                        skinTonePosition="search"
                        maxFrequentRows={2}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        className="min-h-[42px] max-h-[100px] resize-none border-0 bg-overlay-light/80 text-text-primary placeholder:text-text-ghost focus:ring-1 focus:ring-navy-500/30 rounded-2xl pr-10 text-[13px]"
                      />
                      <button
                        data-emoji-trigger
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ghost hover:text-amber-400 transition-colors"
                      >
                        {showEmojiPicker ? <X className="h-4 w-4" /> : <Smile className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      size="icon"
                      className="shrink-0 bg-navy-600 text-white hover:bg-navy-500 disabled:opacity-30 h-[42px] w-[42px] rounded-full shadow-lg shadow-navy-600/20"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2">
                  <LogIn className="h-4 w-4 text-text-dim" />
                  <p className="text-sm text-text-dim">
                    <Link href="/login" className="text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 font-medium">Inicia sesion</Link>{' '}para chatear
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Sidebar: Members (toggleable) ─── */}
        {showMembers && (
          <div className="w-[220px] shrink-0 border-l border-border-default bg-surface-card/40 hidden lg:flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3">
              <Users2 className="h-4 w-4 text-navy-400" />
              <span className="text-sm font-semibold text-text-primary flex-1">Miembros</span>
              <Badge className="bg-overlay-strong text-text-dim border-0 text-[10px]">
                {members.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-text-dim" />
                </div>
              ) : members.length === 0 ? (
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
