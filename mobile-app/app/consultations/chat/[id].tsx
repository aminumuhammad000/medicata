import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, SlideInRight, SlideInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const { connected, sendMessage } = useWebSocket((msg) => {
    if (msg.consultation_id !== id) return;

    if (msg.type === 'chat') {
      setMessages(prev => {
        if (msg.id && prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
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
    if (connected && user) {
        sendMessage({
            type: 'typing',
            consultation_id: id,
            user_id: user.id,
            is_typing: text.length > 0
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        {!isMe && (
          <View style={styles.avatarPlaceholderCol}>
            {showAvatar && (
              <View style={styles.bubbleAvatar}>
                <Text style={styles.miniAvatarText}>
                  {isDoctor ? 'P' : 'D'}
                </Text>
              </View>
            )}
          </View>
        )}

        <Animated.View 
          entering={isMe ? SlideInRight : SlideInLeft}
          style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}
        >
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
            {isMe && (
              <Ionicons 
                name="checkmark-done" 
                size={14} 
                color="rgba(255, 255, 255, 0.74)" 
                style={styles.checkmarkIcon} 
              />
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Connecting to practitioner...</Text>
    </View>
  );

  const displayName = isDoctor ? consultation?.patient_name : (consultation?.doctor_name ? `Dr. ${consultation.doctor_name}` : 'Clinical Specialist');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.headerSubtitle}>{connected ? 'Connected' : 'Reconnecting'}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/consultation/video', params: { consultationId: id, mode: 'audio' } } as any)} style={styles.headerBtn}>
            <Ionicons name="call" size={17} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/consultation/video', params: { consultationId: id, mode: 'video' } } as any)} style={styles.headerBtn}>
            <Ionicons name="videocam" size={17} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
        {/* Chat Feed */}
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
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>{isDoctor ? 'Patient standard is typing...' : 'Dr. is typing...'}</Text>
              </View>
           </Animated.View>
        )}

        {/* Input area */}
        <View style={styles.chatInputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
            <Ionicons name="camera-outline" size={20} color="#475569" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
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
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitleContainer: { 
    flex: 1, 
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2, 
    gap: 4 
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3 
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '600' 
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 6 
  },
  keyboardContainer: { 
    flex: 1 
  },
  chatScrollContent: { 
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: { 
    flexDirection: 'row',
    marginBottom: 10, 
    width: '100%', 
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperThem: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholderCol: {
    width: 32,
    marginRight: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bubbleAvatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 10, 
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: { 
    color: '#475569', 
    fontSize: 12, 
    fontWeight: '800' 
  },
  messageBubble: { 
    maxWidth: '80%', 
    paddingHorizontal: 14, 
    paddingVertical: 10,
    borderRadius: 16, 
  },
  myMessage: { 
    backgroundColor: '#2563EB', 
    borderBottomRightRadius: 2, 
  },
  theirMessage: { 
    backgroundColor: '#FFFFFF', 
    borderBottomLeftRadius: 2, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  messageText: { 
    fontSize: 14, 
    lineHeight: 20,
    fontWeight: '600',
  },
  myMessageText: { 
    color: '#FFFFFF' 
  },
  theirMessageText: { 
    color: '#1E293B' 
  },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    gap: 4, 
    marginTop: 4 
  },
  messageTime: { 
    fontSize: 9, 
    fontWeight: '600' 
  },
  myTimeText: { 
    color: 'rgba(255, 255, 255, 0.7)' 
  },
  theirTimeText: { 
    color: '#94A3B8' 
  },
  checkmarkIcon: {
    marginLeft: 2,
  },
  messageImage: { 
    width: width * 0.65, 
    height: width * 0.65, 
    borderRadius: 12, 
    marginBottom: 6 
  },
  typingIndicator: { 
    paddingHorizontal: 16, 
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typingText: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '600',
  },
  chatInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderColor: '#E2E8F0',
  },
  attachBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9' 
  },
  textInput: { 
    flex: 1, 
    fontSize: 14, 
    color: '#1E293B', 
    maxHeight: 100, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    marginHorizontal: 10,
    fontWeight: '600',
  },
  sendBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#2563EB',
  },
  sendBtnDisabled: { 
    opacity: 0.4,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});
