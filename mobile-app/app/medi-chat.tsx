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
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setMessage('');
    saveMessageHistory(newMessages);
    
    try {
      // TODO: Send message via WebSocket
      // ws.current?.send(JSON.stringify({
      //   type: 'message',
      //   content: message,
      //   timestamp: new Date().toISOString(),
      // }));
      
      // Placeholder for actual WebSocket send
      console.log('Sending message:', message);
      
      // Simulate AI response for demo
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: 'I understand. Based on your symptoms, I recommend booking a consultation with a General Practitioner. Would you like me to find one for you?',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        saveMessageHistory([...newMessages, aiResponse]);
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
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
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
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
