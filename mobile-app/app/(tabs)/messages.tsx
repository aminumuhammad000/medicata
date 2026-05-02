import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [filteredChats, setFilteredChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const filtered = chats.filter(chat => {
      const name = userRole === 'doctor' ? chat.patient_name : chat.doctor_name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             chat.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredChats(filtered);
  }, [searchQuery, chats, userRole]);

  const fetchChats = async () => {
    try {
      const role = await api.getUserRole();
      setUserRole(role?.toLowerCase() || 'patient');

      const res = await api.getMyConsultations();
      if (res.data) {
        // Only show chats for accepted or completed consultations
        const activeChats = (res.data as any[]).filter(c => 
          c.status === 'accepted' || c.status === 'completed' || c.status === 'pending'
        );
        
        // Sort by scheduled_at desc
        activeChats.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
        
        setChats(activeChats);
        setFilteredChats(activeChats);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const name = userRole === 'doctor' ? item.patient_name : (item.doctor_name ? `Dr. ${item.doctor_name}` : 'Medical Specialist');
    const isPending = item.status === 'pending';
    
    return (
      <TouchableOpacity 
        style={styles.chatCard} 
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } })}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#4A90E2', '#2572D9']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{(name || 'A').charAt(0)}</Text>
          </LinearGradient>
          {isPending && <View style={styles.pendingDot} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.chatName} numberOfLines={1}>{name}</Text>
            <Text style={styles.chatTime}>
              {new Date(item.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          
          <View style={styles.chatMessageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {isPending ? '[Awaiting Approval]' : (item.reason || 'Click to start consultation')}
            </Text>
            {item.status === 'completed' && (
              <Ionicons name="checkmark-done" size={16} color="#22C55E" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0D1B3A" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} tintColor="#0D1B3A" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="chatbubbles-outline" size={60} color="#E2E8F0" />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                {userRole === 'doctor' 
                  ? 'Your active consultations and patient discussions will appear here.'
                  : 'Start a consultation with a doctor to begin messaging.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pendingDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    borderWidth: 3,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 4,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
