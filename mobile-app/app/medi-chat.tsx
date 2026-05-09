import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import WebSocket from 'react-native-websocket';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MediChatScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // const ws = useRef<WebSocket | null>(null);
  // const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket();
    
    // Load message history from local storage
    loadMessageHistory();
    
    return () => {
      cleanup();
    };
  }, []);
  
  const connectWebSocket = async () => {
    try {
      // TODO: Implement WebSocket connection
      // 1. Get auth token from AsyncStorage
      // 2. Connect to WebSocket server (ws://localhost:8080/ws)
      // 3. Handle connection events (open, message, error, close)
      // 4. Implement reconnection logic
      
      console.log('Connecting to WebSocket server...');
      // Placeholder for actual WebSocket implementation
      
      // Simulate connection for demo
      setTimeout(() => {
        setIsConnected(true);
        setMessages([
          { id: '1', text: 'Hello! I am Medi, your AI health assistant. How can I help you today?', sender: 'ai', timestamp: new Date() },
        ]);
      }, 500);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      // Retry connection after delay
      // reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
    }
  };
  
  const loadMessageHistory = async () => {
    try {
      // TODO: Load message history from AsyncStorage or API
      // const history = await AsyncStorage.getItem('chat_history');
      // if (history) {
      //   setMessages(JSON.parse(history));
      // }
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  };
  
  const saveMessageHistory = async (msgs: any[]) => {
    try {
      // TODO: Save message history to AsyncStorage
      // await AsyncStorage.setItem('chat_history', JSON.stringify(msgs));
    } catch (error) {
      console.error('Failed to save message history:', error);
    }
  };
  
  const cleanup = () => {
    // if (reconnectTimeout.current) {
    //   clearTimeout(reconnectTimeout.current);
    // }
    // if (ws.current) {
    //   ws.current.close();
    // }
  };
  
  const handleSend = async () => {
    if (!message || !isConnected) return;
    
    const userMsg = message.trim();
    const newMessage = {
      id: Date.now().toString(),
      text: userMsg,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setMessage('');
    
    try {
      setIsTyping(true);
      
      // Smart Triage Logic for MVP
      // We look for keywords to suggest the right specialist
      setTimeout(() => {
        setIsTyping(false);
        
        let aiText = "I understand. To give you the best advice, could you tell me more about how long you've been feeling this way?";
        let suggestion: string | null = null;
        
        const lowerMsg = userMsg.toLowerCase();
        
        if (lowerMsg.includes('heart') || lowerMsg.includes('chest') || lowerMsg.includes('palpitation')) {
          aiText = "Based on your mention of chest or heart-related symptoms, I recommend speaking with a Cardiologist immediately for a professional evaluation.";
          suggestion = 'Cardiology';
        } else if (lowerMsg.includes('child') || lowerMsg.includes('baby') || lowerMsg.includes('kid')) {
          aiText = "Since this concerns a child, I recommend booking a consultation with a Pediatrician who specializes in children's health.";
          suggestion = 'Pediatrics';
        } else if (lowerMsg.includes('headache') || lowerMsg.includes('dizzy') || lowerMsg.includes('nerve') || lowerMsg.includes('brain')) {
          aiText = "These neurological symptoms (headache/dizziness) suggest you should consult a Neurologist for a detailed check-up.";
          suggestion = 'Neurology';
        } else if (lowerMsg.includes('fever') || lowerMsg.includes('flu') || lowerMsg.includes('cold') || lowerMsg.includes('sick')) {
          aiText = "It sounds like you might have a common infection or flu. A General Practitioner can help diagnose this and provide treatment.";
          suggestion = 'General';
        }

        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: aiText,
          sender: 'ai',
          timestamp: new Date(),
          suggestion: suggestion // Attach specialty suggestion for the UI
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }, 1500);
    } catch (error) {
      console.error('Failed to process AI message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer}>
      <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
      </View>
      {item.suggestion && (
        <TouchableOpacity 
          style={styles.suggestionBtn}
          onPress={() => router.push({ pathname: '/bookings/search', params: { specialty: item.suggestion } })}
        >
          <Ionicons name="calendar" size={16} color="#4F46E5" />
          <Text style={styles.suggestionBtnText}>Book {item.suggestion} Specialist</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.aiAvatar, isConnected && styles.aiAvatarConnected]}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Medi AI Assistant</Text>
            <Text style={styles.connectionStatus}>
              {isConnected ? 'Online' : 'Connecting...'}
            </Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotDelayed]} />
              <View style={[styles.typingDot, styles.typingDotDelayed2]} />
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TextInput 
            style={[styles.input, !isConnected && styles.inputDisabled]} 
            placeholder={isConnected ? "Ask me anything about your health..." : "Connecting..."}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={isConnected}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!isConnected || !message) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!isConnected || !message}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarConnected: {
    backgroundColor: '#ff9800',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#666',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    padding: 12,
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  typingDotDelayed: {
    opacity: 0.7,
  },
  typingDotDelayed2: {
    opacity: 0.4,
  },
  chatList: {
    padding: 20,
    gap: 16,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    gap: 4,
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  userBubble: {
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 8,
    marginLeft: 4,
    ...Platform.select({
      ios: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }) as any,
  },
  suggestionBtnText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#1a1a1a',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
