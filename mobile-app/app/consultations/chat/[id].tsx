import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // WebSocket for real-time
  const { connected, sendMessage } = useWebSocket((msg) => {
    if (msg.consultation_id !== id) return;

    if (msg.type === 'chat') {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } else if (msg.type === 'webrtc_offer' && user?.id !== msg.user_id) {
      setIncomingCall(msg);
    } else if (msg.type === 'webrtc_answer' && user?.id !== msg.user_id) {
      alert('Call accepted. Establishing connection...');
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

  const handleStartCall = (isVideo: boolean) => {
    if (!consultation || !user) return;
    router.push({ pathname: '/consultations/call/[id]', params: { id } });
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const isMe = item.user_id === user?.id;
    return (
      <View style={[styles.messageWrapper, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
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
      </View>
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
              <TouchableOpacity onPress={() => handleStartCall(false)} style={styles.headerBtn}>
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleStartCall(true)} style={styles.headerBtn}>
                <Ionicons name="videocam" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderChatItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.chatScrollContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
          <View style={styles.chatInputContainer}>
            <View style={styles.chatInputInner}>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
                <Ionicons name="add" size={26} color="#4A90E2" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              {!inputText.trim() && (
                <TouchableOpacity style={styles.micBtn}>
                  <Ionicons name="mic-outline" size={22} color="#64748B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSendChat}
                disabled={!inputText.trim()}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#94A3B8']}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={18} color="#fff" />
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  topSection: { paddingBottom: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  chatContainer: { flex: 1 },
  chatScrollContent: { padding: 16, paddingBottom: 32 },
  messageWrapper: { marginBottom: 10, width: '100%' },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 18, elevation: 1 },
  myMessage: { backgroundColor: '#0D1B3A', borderBottomRightRadius: 2 },
  theirMessage: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#1E293B' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10 },
  myTimeText: { color: 'rgba(255, 255, 255, 0.6)' },
  theirTimeText: { color: '#94A3B8' },
  messageImage: { width: width * 0.65, height: width * 0.65, borderRadius: 12, marginBottom: 8 },
  chatInputContainer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  chatInputInner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  attachBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, fontSize: 15, color: '#1E293B', maxHeight: 100 },
  micBtn: { paddingHorizontal: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  sendGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', paddingLeft: 3 },
  sendBtnDisabled: { opacity: 0.6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
});
