import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MedicationReminders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.getMyReminders();
      if (res.data) {
        setReminders(res.data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateReminderStatus(id, !currentStatus);
      setReminders(reminders.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder status');
    }
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this medication reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteReminder(id);
              setReminders(reminders.filter(r => r.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          }
        }
      ]
    );
  };

  const renderReminder = ({ item }: { item: any }) => (
    <View style={[styles.reminderCard, !item.is_active && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.medicationInfo}>
          <View style={[styles.iconBg, { backgroundColor: item.is_active ? '#E0F2FE' : '#F1F5F9' }]}>
            <Ionicons name="medical" size={20} color={item.is_active ? '#0EA5E9' : '#94A3B8'} />
          </View>
          <View>
            <Text style={[styles.medName, !item.is_active && styles.inactiveText]}>{item.medication_name}</Text>
            <Text style={styles.medDosage}>{item.dosage || 'No dosage specified'}</Text>
          </View>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleReminder(item.id, item.is_active)}
          trackColor={{ false: '#CBD5E1', true: '#0EA5E9' }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="repeat" size={14} color="#64748B" />
          <Text style={styles.detailText}>{item.frequency}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.detailText}>{item.times.join(', ')}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => deleteReminder(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Medication Reminders</Text>
              <Text style={styles.headerSubtitle}>Never miss a dose</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchReminders}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No medication reminders set.</Text>
              <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.addBtnText}>Go to Home to Add</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => Alert.alert('Coming Soon', 'Manual reminder creation will be added in the next update. For now, reminders are created from prescriptions.')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inactiveCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inactiveText: {
    color: '#94A3B8',
  },
  medDosage: {
    fontSize: 13,
    color: '#64748B',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  deleteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  addBtn: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
});
