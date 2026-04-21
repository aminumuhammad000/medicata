import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { useWebSocket } from '../../../hooks/useWebSocket';

export default function ConsultationDesk() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [activeTab, setActiveTab] = useState<'desk' | 'chat'>('desk');
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
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
      setMessages(prev => [...prev, msg]);
    } else if (msg.type === 'webrtc_offer' && user?.id !== msg.user_id) {
      setIncomingCall(msg);
    } else if (msg.type === 'webrtc_answer' && user?.id !== msg.user_id) {
      console.log('Received WebRTC Answer:', msg.sdp);
      alert('Patient accepted call. Establishing connection...');
    } else if (msg.type === 'webrtc_ice' && user?.id !== msg.user_id) {
      console.log('Received ICE Candidate');
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
      if (historyRes.data) {
        setMessages(historyRes.data);
      }
      
      const listRes = await api.getMyConsultations();
      if (listRes.data) {
        const item = listRes.data.find((c: any) => c.id === id);
        if (item) {
          setConsultation(item);
          setNotes(item.doctor_notes || '');
        }
      }
    } catch (error) {
      console.error('Failed to load consultation data:', error);
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

  const handleStartVideo = () => {
    if (!consultation || !user) return;
    
    sendMessage({
      type: 'webrtc_offer',
      consultation_id: id,
      user_id: user.id,
      target_id: isDoctor ? consultation.patient_id : consultation.doctor_id,
      sdp: 'OFFER_PLACEHOLDER',
    });
    alert('Call initiated...');
  };

  const handleAcceptCall = () => {
    if (!incomingCall || !user) return;

    sendMessage({
      type: 'webrtc_answer',
      consultation_id: id,
      user_id: user.id,
      target_id: incomingCall.user_id,
      sdp: 'ANSWER_PLACEHOLDER',
    });
    setIncomingCall(null);
    alert('Call connected!');
  };

  const handleComplete = async () => {
    try {
      if (id) {
        await api.updateConsultationStatus(id, 'completed');
        await api.addConsultationNotes(id, diagnosis + "\n\n" + notes);
      }
      router.replace('/doctor/dashboard');
    } catch (error) {
      alert('Failed to complete consultation');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  const renderChatItem = ({ item }: { item: any }) => {
    const isMe = item.user_id === consultation?.doctor_id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Consultation Desk</Text>
          <TouchableOpacity onPress={handleStartVideo}>
            <Ionicons name="videocam" size={24} color="#4a90e2" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'desk' && styles.activeTab]}
            onPress={() => setActiveTab('desk')}
          >
            <Text style={[styles.tabText, activeTab === 'desk' && styles.activeTabText]}>Clinical Desk</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
              {!connected && <View style={styles.offlineDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'desk' ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.patientCard}>
              <View style={styles.patientInfo}>
                <View style={[styles.avatar, { backgroundColor: isDoctor ? '#4a90e2' : '#f0f0f0' }]}>
                  <Text style={[styles.avatarText, !isDoctor && { color: '#666' }]}>
                    {(isDoctor ? consultation?.patient_name : consultation?.doctor_name || 'A').charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.patientName}>
                    {isDoctor ? consultation?.patient_name : `Dr. ${consultation?.doctor_name || 'Medical Specialist'}`}
                  </Text>
                  <Text style={styles.patientMeta}>
                    {consultation?.mode.toUpperCase()} • {consultation?.scheduled_at ? new Date(consultation.scheduled_at).toLocaleDateString() : 'Today'}
                  </Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                <View style={styles.tag}><Text style={styles.tagText}>Reason: {consultation?.reason || 'Fever'}</Text></View>
                <View style={[styles.tag, { borderColor: '#4caf50' }]}>
                  <Text style={[styles.tagText, { color: '#4caf50' }]}>Status: {consultation?.status}</Text>
                </View>
              </View>
            </View>

            {isDoctor && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Diagnosis</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Primary diagnosis..."
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Clinical Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Detailed findings and observations..."
                    multiline
                    numberOfLines={6}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push({ pathname: '/doctor/prescription/create', params: { consultationId: id, patientId: consultation?.patient_id } })}
                  >
                    <Ionicons name="medical" size={20} color="#4a90e2" />
                    <Text style={styles.actionButtonText}>Add Prescription</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="flask" size={20} color="#4a90e2" />
                    <Text style={styles.actionButtonText}>Request Lab Test</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!isDoctor && (
              <View style={styles.patientNotesArea}>
                <Text style={styles.sectionTitle}>Doctor's Notes</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{notes || 'The doctor will add notes during the consultation.'}</Text>
                </View>
                
                {consultation?.status === 'completed' && (
                  <TouchableOpacity 
                    style={styles.prescriptionBtn}
                    onPress={() => {
                        // In a real app, find the prescription ID linked to this consultation
                        alert('Finding your prescription...');
                    }}
                  >
                    <Ionicons name="receipt" size={20} color="#fff" />
                    <Text style={styles.prescriptionBtnText}>View Prescriptions</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderChatItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendChat}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isDoctor && activeTab === 'desk' && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.completeButton, (!notes || !diagnosis) && styles.completeButtonDisabled]} 
              onPress={handleComplete}
              disabled={!notes || !diagnosis}
            >
              <Text style={styles.completeButtonText}>Complete Consultation</Text>
            </TouchableOpacity>
          </View>
        )}

        {incomingCall && (
          <View style={styles.callModal}>
            <View style={styles.callCard}>
              <View style={styles.callAvatar}>
                <Ionicons name="videocam" size={40} color="#fff" />
              </View>
              <Text style={styles.callTitle}>Incoming Video Call</Text>
              <Text style={styles.callSubtitle}>Dr. {consultation?.doctor_name} is calling you</Text>
              
              <View style={styles.callActions}>
                <TouchableOpacity 
                  style={[styles.callBtn, { backgroundColor: '#ff3b30' }]}
                  onPress={() => setIncomingCall(null)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callBtn, { backgroundColor: '#4caf50' }]}
                  onPress={handleAcceptCall}
                >
                  <Ionicons name="checkmark" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  patientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  patientMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tagText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    height: 150,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0e3ff',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  completeButton: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4a90e2',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chatList: {
    padding: 20,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
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
  patientNotesArea: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  notesBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  prescriptionBtn: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
  },
  prescriptionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  callCard: {
    backgroundColor: '#fff',
    width: '80%',
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
  },
  callAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  callSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  callActions: {
    flexDirection: 'row',
    gap: 30,
  },
  callBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }
    }),
  },
});
