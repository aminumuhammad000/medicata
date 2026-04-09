import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function ConsultationsScreen() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      const response = await api.getMyConsultations();
      setConsultations(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, item.status === 'Completed' && styles.iconContainerCompleted]}>
          <Ionicons 
            name={item.mode === 'video' ? 'videocam' : item.mode === 'audio' ? 'mic' : item.mode === 'chat' ? 'chatbubbles' : 'people'} 
            size={24} 
            color={item.status === 'Completed' ? '#999' : '#4a90e2'} 
          />
        </View>
        <View style={styles.details}>
          <Text style={styles.doctorName}>{item.doctor_name || 'Doctor'}</Text>
          <Text style={styles.date}>{new Date(item.scheduled_at).toLocaleString()}</Text>
          <Text style={styles.mode}>{item.mode}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, getStatusStyle(item.status)]}>
          <Text style={[styles.badgeText, getStatusTextStyle(item.status)]}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Scheduled': return styles.badgeScheduled;
      case 'InProgress': return styles.badgeInProgress;
      case 'Completed': return styles.badgeCompleted;
      case 'Cancelled': return styles.badgeCancelled;
      default: return styles.badgeDefault;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Scheduled': return styles.badgeTextScheduled;
      case 'InProgress': return styles.badgeTextInProgress;
      case 'Completed': return styles.badgeTextCompleted;
      case 'Cancelled': return styles.badgeTextCancelled;
      default: return styles.badgeTextDefault;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Consultations</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={consultations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No consultations found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCompleted: {
    backgroundColor: '#f5f5f5',
  },
  details: {
    marginLeft: 16,
    gap: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  mode: {
    fontSize: 12,
    color: '#4a90e2',
    textTransform: 'capitalize',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
  },
  badgeDefault: {
    backgroundColor: '#f5f5f5',
  },
  badgeScheduled: {
    backgroundColor: '#e3f2fd',
  },
  badgeInProgress: {
    backgroundColor: '#fff3e0',
  },
  badgeCompleted: {
    backgroundColor: '#e8f5e9',
  },
  badgeCancelled: {
    backgroundColor: '#ffebee',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  badgeTextDefault: {
    color: '#999',
  },
  badgeTextScheduled: {
    color: '#2196f3',
  },
  badgeTextInProgress: {
    color: '#ff9800',
  },
  badgeTextCompleted: {
    color: '#4caf50',
  },
  badgeTextCancelled: {
    color: '#f44336',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
