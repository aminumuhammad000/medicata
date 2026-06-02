import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Image, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // WebSocket for real-time
  const { connected, sendMessage } = useWebSocket((msg) => {
    if (msg.consultation_id !== id) return;

    if (msg.type === 'chat') {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Send read receipt if we're viewing
      if (msg.user_id !== user?.id) {
          sendMessage({
              type: 'read_receipt',
              consultation_id: id,
              user_id: user?.id,
              message_id: msg.id
          });
      }
    } else if (msg.type === 'typing' && msg.user_id !== user?.id) {
      setIsOtherTyping(msg.is_typing);
    }
  });

  useEffect(() => {
    loadUserAndData();
  }, [id]);

  const loadUserAndData = async () => {
    try {
      const me = await api.getMyProfile();
      if (me.data) setUser(me.data);

      const historyRes = await api.getChatHistory(id);
      if (historyRes.data) setMessages(historyRes.data);
      
      const listRes = await api.getMyConsultations();
      if (listRes.data) {
        const item = listRes.data.find((c: any) => c.id === id);
        if (item) setConsultation(item);
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = user?.role === 'doctor';

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Broadcast typing status
    if (connected && user) {
        sendMessage({
            type: 'typing',
            consultation_id: id,
            user_id: user.id,
            is_typing: text.length > 0
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to stop typing after 3 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
            sendMessage({
                type: 'typing',
                consultation_id: id,
                user_id: user.id,
                is_typing: false
            });
        }, 3000);
    }
  };

  const handleSendChat = () => {
    if (!inputText.trim() || !user) return;
    const msg = {
      type: 'chat',
      consultation_id: id,
      user_id: user.id,
      content: inputText.trim(),
    };
    sendMessage(msg);
    setInputText('');
    
    // Explicitly stop typing status
    sendMessage({
        type: 'typing',
        consultation_id: id,
        user_id: user.id,
        is_typing: false
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const msg = {
        type: 'chat',
        consultation_id: id,
        user_id: user.id,
        content: '[Image Shared]',
        image_url: result.assets[0].uri,
      };
      sendMessage(msg);
    }
  };

  const renderChatItem = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.user_id === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isMe && (!prevMsg || prevMsg.user_id !== item.user_id);
    
    return (
      <Animated.View 
        entering={isMe ? SlideInRight : SlideInLeft}
        style={[styles.messageWrapper, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start', paddingLeft: 40 }]}
      >
        {showAvatar && (
            <View style={styles.bubbleAvatar}>
                 <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.miniAvatarGradient}>
                    <Text style={styles.miniAvatarText}>
                        {(isDoctor ? 'P' : 'D')}
                    </Text>
                 </LinearGradient>
            </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.messageImage} resizeMode="cover" />
          )}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <View style={styles.timeRow}>
            <Text style={[styles.messageTime, isMe ? styles.myTimeText : styles.theirTimeText]}>
              {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.6)" />}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0D1B3A" />
    </View>
  );

  const displayName = isDoctor ? consultation?.patient_name : (consultation?.doctor_name ? `Dr. ${consultation.doctor_name}` : 'Medical Specialist');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{displayName}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: connected ? '#22C55E' : '#EF4444' }]} />
                <Text style={styles.headerSubtitle}>{connected ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/consultation/video', params: { consultationId: id, mode: 'audio' } } as any)} style={styles.headerBtn}>
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push({ pathname: '/consultation/video', params: { consultationId: id, mode: 'video' } } as any)} style={styles.headerBtn}>
                <Ionicons name="videocam" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? -10 : 20}>
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderChatItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.chatScrollContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          />
          
          {isOtherTyping && (
             <Animated.View entering={FadeIn} style={styles.typingIndicator}>
                <Text style={styles.typingText}>{isDoctor ? 'Patient is typing...' : 'Doctor is typing...'}</Text>
             </Animated.View>
          )}

          <View style={styles.chatInputContainer}>
            <View style={styles.chatInputInner}>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
                <Ionicons name="add" size={26} color="#4A90E2" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleInputChange}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSendChat}
                disabled={!inputText.trim()}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#94A3B8']}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topSection: { paddingBottom: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 10 },
  chatContainer: { flex: 1 },
  chatScrollContent: { padding: 20, paddingBottom: 40 },
  messageWrapper: { marginBottom: 12, width: '100%', position: 'relative' },
  bubbleAvatar: { position: 'absolute', left: -40, bottom: 2, width: 32, height: 32 },
  miniAvatarGradient: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  myMessage: { backgroundColor: '#0D1B3A', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#1E293B' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10, fontWeight: '500' },
  myTimeText: { color: 'rgba(255, 255, 255, 0.55)' },
  theirTimeText: { color: '#94A3B8' },
  messageImage: { width: width * 0.7, height: width * 0.7, borderRadius: 14, marginBottom: 8 },
  typingIndicator: { paddingHorizontal: 24, paddingVertical: 8 },
  typingText: { fontSize: 12, color: '#64748B', fontStyle: 'italic' },
  chatInputContainer: { padding: 16, backgroundColor: '#fff', paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  chatInputInner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 28, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  attachBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  textInput: { flex: 1, fontSize: 15, color: '#1E293B', maxHeight: 120, paddingVertical: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
  sendBtnDisabled: { opacity: 0.6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
});
