import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  suggestion?: string | null;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ─── AI triage logic ────────────────────────────────────────────────────────
function buildAIResponse(userMsg: string): { text: string; suggestion: string | null } {
  const l = userMsg.toLowerCase();
  if (l.includes('heart') || l.includes('chest') || l.includes('palpitation'))
    return { text: 'Based on your symptoms, this could be heart-related. I strongly recommend seeing a Cardiologist as soon as possible.', suggestion: 'Cardiology' };
  if (l.includes('child') || l.includes('baby') || l.includes('kid'))
    return { text: "Since this concerns a minor, I recommend scheduling a consultation with a Pediatrician.", suggestion: 'Pediatrics' };
  if (l.includes('headache') || l.includes('dizzy') || l.includes('migraine') || l.includes('brain'))
    return { text: 'These symptoms may point to neurologic conditions. Consider booking a Neurology consult.', suggestion: 'Neurology' };
  if (l.includes('fever') || l.includes('flu') || l.includes('cold') || l.includes('sick'))
    return { text: 'Looks like a common infection. A General Practitioner can examine you promptly.', suggestion: 'General' };
  if (l.includes('skin') || l.includes('rash') || l.includes('itch') || l.includes('acne'))
    return { text: 'Skin-related symptoms are best evaluated by a Dermatologist.', suggestion: 'Dermatology' };
  if (l.includes('eye') || l.includes('vision') || l.includes('sight') || l.includes('blur'))
    return { text: 'Eye and vision concerns should be reviewed by an Ophthalmologist.', suggestion: 'Ophthalmology' };
  if (l.includes('stomach') || l.includes('digestion') || l.includes('gut') || l.includes('bowel'))
    return { text: 'Digestive issues are commonly handled by a Gastroenterologist.', suggestion: 'Gastroenterology' };
  if (l.includes('bone') || l.includes('joint') || l.includes('knee') || l.includes('back') || l.includes('spine'))
    return { text: 'Joint or bone pain may need an Orthopedic evaluation.', suggestion: 'Orthopedics' };
  return {
    text: "I understand. To help triage your symptoms better, could you share how long you've had them and any other details like pain level or related symptoms?",
    suggestion: null,
  };
}

const STORAGE_KEY = 'medi_chat_sessions';
const WELCOME_MSG: Message = {
  id: 'welcome',
  text: "Hello! I'm Medi, your AI health assistant. Describe your symptoms or health concern and I'll help guide you to the right specialist.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
  suggestion: null,
};

const QUICK_PROMPTS = [
  { label: 'Headache', icon: 'flash-outline' },
  { label: 'Child has fever', icon: 'thermometer-outline' },
  { label: 'Chest pain', icon: 'heart-outline' },
  { label: 'Skin rash', icon: 'body-outline' },
  { label: 'Eye problem', icon: 'eye-outline' },
  { label: 'Back pain', icon: 'fitness-outline' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function sessionTitle(messages: Message[]): string {
  const first = messages.find((m) => m.sender === 'user');
  if (!first) return 'New chat';
  return first.text.length > 36 ? first.text.slice(0, 34) + '…' : first.text;
}

function groupByDate(sessions: ChatSession[]) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: { label: string; items: ChatSession[] }[] = [];

  const todayItems = sessions.filter((s) => new Date(s.updatedAt).toDateString() === today);
  const yesterdayItems = sessions.filter((s) => new Date(s.updatedAt).toDateString() === yesterday);
  const olderItems = sessions.filter(
    (s) =>
      new Date(s.updatedAt).toDateString() !== today &&
      new Date(s.updatedAt).toDateString() !== yesterday
  );

  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (olderItems.length) groups.push({ label: 'Previous', items: olderItems });
  return groups;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function MediChatScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-280)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        setSessions(parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      }
    } catch (_) {}
  };

  const saveSessions = async (updated: ChatSession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  // Sidebar open/close
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: -280, useNativeDriver: true, bounciness: 0 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  // New chat
  const startNewChat = () => {
    setActiveId('');
    setMessages([WELCOME_MSG]);
    setInput('');
    closeSidebar();
  };

  // Switch to a history session
  const openSession = (session: ChatSession) => {
    setActiveId(session.id);
    setMessages(session.messages);
    closeSidebar();
  };

  // Delete a session
  const deleteSession = async (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    await saveSessions(updated);
    if (id === activeId) startNewChat();
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();

    const userMsg: Message = {
      id: generateId(),
      text: userText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(async () => {
      setIsTyping(false);
      const { text, suggestion } = buildAIResponse(userText);
      const aiMsg: Message = {
        id: generateId(),
        text,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        suggestion,
      };
      const finalMessages = [...nextMessages, aiMsg];
      setMessages(finalMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Persist / update session
      const now = new Date().toISOString();
      let updatedSessions: ChatSession[];
      if (activeId) {
        updatedSessions = sessions.map((s) =>
          s.id === activeId
            ? { ...s, messages: finalMessages, title: sessionTitle(finalMessages), updatedAt: now }
            : s
        );
      } else {
        const newSession: ChatSession = {
          id: generateId(),
          title: sessionTitle(finalMessages),
          messages: finalMessages,
          createdAt: now,
          updatedAt: now,
        };
        setActiveId(newSession.id);
        updatedSessions = [newSession, ...sessions];
      }
      updatedSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSessions(updatedSessions);
      await saveSessions(updatedSessions);
    }, 1400);
  };

  // ── Render message bubble ────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'user';
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        {!isMe && (
          <Image source={require('../assets/images/medi-ai.png')} style={styles.aiAvatar} />
        )}
        <View style={styles.bubbleWrap}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>{time}</Text>
          {item.suggestion && (
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => router.push({ pathname: '/bookings/search', params: { specialty: item.suggestion } } as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={13} color="#2563EB" />
              <Text style={styles.suggestionText}>Book {item.suggestion} Specialist</Text>
              <Ionicons name="arrow-forward" size={12} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const groups = groupByDate(sessions);

  return (
    <View style={styles.root}>
      {/* ── Sidebar ──────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
          </Animated.View>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              {/* Sidebar header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarBrand}>
                  <Image source={require('../assets/images/medi-ai.png')} style={styles.sidebarBrandIcon} />
                  <Text style={styles.sidebarBrandText}>Medi AI</Text>
                </View>
                <TouchableOpacity style={styles.closeSidebarBtn} onPress={closeSidebar}>
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* New Chat Button */}
              <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.newChatBtnText}>New Chat</Text>
              </TouchableOpacity>

              {/* History */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {sessions.length === 0 ? (
                  <View style={styles.noHistoryWrap}>
                    <Ionicons name="chatbubbles-outline" size={36} color="#CBD5E1" />
                    <Text style={styles.noHistoryText}>No history yet</Text>
                    <Text style={styles.noHistoryHint}>Your conversations will appear here</Text>
                  </View>
                ) : (
                  groups.map((group) => (
                    <View key={group.label}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      {group.items.map((s) => (
                        <View key={s.id} style={styles.sessionRow}>
                          <TouchableOpacity
                            style={[styles.sessionItem, s.id === activeId && styles.sessionItemActive]}
                            onPress={() => openSession(s)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="chatbubble-outline"
                              size={14}
                              color={s.id === activeId ? '#2563EB' : '#94A3B8'}
                            />
                            <Text
                              style={[styles.sessionTitle, s.id === activeId && styles.sessionTitleActive]}
                              numberOfLines={1}
                            >
                              {s.title}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => deleteSession(s.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#CBD5E1" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))
                )}
                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Sidebar footer */}
              <View style={styles.sidebarFooter}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
                <Text style={styles.sidebarFooterText}>Responses are for guidance only. Always consult a doctor.</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </>
      )}

      {/* ── Main Chat Area ───────────────────────────────── */}
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Image source={require('../assets/images/medi-ai.png')} style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Medi AI</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle}>Health Assistant</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.headerBtn} onPress={openSidebar}>
              <Ionicons name="time-outline" size={19} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={startNewChat}>
              <Ionicons name="create-outline" size={19} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              <>
                {/* Typing indicator */}
                {isTyping && (
                  <View style={styles.msgRow}>
                    <Image source={require('../assets/images/medi-ai.png')} style={styles.aiAvatar} />
                    <View style={styles.typingBubble}>
                      {[1, 0.6, 0.3].map((op, i) => (
                        <View key={i} style={[styles.typingDot, { opacity: op }]} />
                      ))}
                    </View>
                  </View>
                )}

                {/* Quick prompts (only show before first user message) */}
                {messages.length <= 1 && !isTyping && (
                  <View style={styles.quickSection}>
                    <Text style={styles.quickLabel}>Quick symptoms</Text>
                    <View style={styles.quickGrid}>
                      {QUICK_PROMPTS.map((p, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.quickChip}
                          onPress={() => setInput(p.label)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name={p.icon as any} size={14} color="#2563EB" />
                          <Text style={styles.quickChipText}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            }
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Message Medi AI…"
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Overlay ──────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },

  // ── Sidebar ───────────────────────────────────────────────
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 272,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebarBrandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sidebarBrandText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  closeSidebarBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New chat button
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newChatBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1 },

  // History groups
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 2,
  },
  sessionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sessionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  sessionTitle: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  sessionTitleActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  noHistoryWrap: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 6,
    paddingHorizontal: 20,
  },
  noHistoryText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 6 },
  noHistoryHint: { fontSize: 12, color: '#CBD5E1', textAlign: 'center' },

  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sidebarFooterText: { flex: 1, fontSize: 11, color: '#94A3B8', lineHeight: 16 },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  // ── Chat ─────────────────────────────────────────────────
  chatList: { padding: 16, paddingBottom: 12 },

  msgRow: { flexDirection: 'row', marginBottom: 14, maxWidth: '85%' },
  msgRowMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  msgRowThem: { alignSelf: 'flex-start' },

  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    alignSelf: 'flex-end',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  bubbleWrap: { flex: 1 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTextThem: { color: '#0F172A' },

  timeText: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  timeMe: { color: '#94A3B8', alignSelf: 'flex-end' },
  timeThem: { color: '#94A3B8', alignSelf: 'flex-start', paddingLeft: 2 },

  // Suggestion chip
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
    marginTop: 8,
  },
  suggestionText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },

  // Typing
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#94A3B8' },

  // Quick prompts
  quickSection: { marginTop: 16, marginBottom: 8 },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipText: { fontSize: 12, color: '#334155', fontWeight: '600' },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    maxHeight: 100,
    fontWeight: '500',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
