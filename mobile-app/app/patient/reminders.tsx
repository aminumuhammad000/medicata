import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function MedicationReminders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('Daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async () => {
    if (!newMedName.trim()) {
      Alert.alert('Required', 'Please enter a medication name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const times = newFrequency === 'Twice Daily' ? ['08:00', '20:00'] : ['08:00'];
      
      const res = await api.createReminder({
        medication_name: newMedName,
        dosage: newDosage,
        frequency: newFrequency,
        times: times,
        start_date: new Date().toISOString().split('T')[0],
      });
      
      if (res.data) {
        setReminders([res.data, ...reminders]);
        setShowAddModal(false);
        setNewMedName('');
        setNewDosage('');
        setNewFrequency('Daily');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setReminders(reminders.map((r) => (r.id === id ? { ...r, is_active: !currentStatus } : r)));
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder status');
    }
  };

  const deleteReminder = (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this medication reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteReminder(id);
            setReminders(reminders.filter((r) => r.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete reminder');
          }
        },
      },
    ]);
  };

  const renderReminder = ({ item }: { item: any }) => (
    <View style={[styles.reminderCard, !item.is_active && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.medicationInfo}>
          <View style={[styles.iconBg, { backgroundColor: item.is_active ? '#EFF6FF' : '#F1F5F9' }]}>
            <Ionicons name="medical" size={20} color={item.is_active ? '#2563EB' : '#94A3B8'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.medName, !item.is_active && styles.inactiveText]} numberOfLines={1}>
              {item.medication_name}
            </Text>
            <Text style={styles.medDosage}>{item.dosage || 'No dosage specified'}</Text>
          </View>
        </View>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleReminder(item.id, item.is_active)}
          trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
          thumbColor={item.is_active ? '#2563EB' : '#94A3B8'}
          style={styles.switch}
        />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailChip}>
          <Ionicons name="repeat" size={13} color="#64748B" />
          <Text style={styles.detailText}>{item.frequency}</Text>
        </View>
        <View style={styles.detailChip}>
          <Ionicons name="time-outline" size={13} color="#64748B" />
          <Text style={styles.detailText}>{item.times.join(', ')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteReminder(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={16} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchReminders}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Reminders</Text>
              <Text style={styles.emptyText}>You don't have any active medication reminders set up yet.</Text>
            </View>
          }
        />
      )}

      {/* Add FAB */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>New Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddModal(false)} activeOpacity={1} />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Medication Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Amoxicillin" placeholderTextColor="#94A3B8" value={newMedName} onChangeText={setNewMedName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dosage (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. 500mg" placeholderTextColor="#94A3B8" value={newDosage} onChangeText={setNewDosage} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqRow}>
                {['Daily', 'Twice Daily'].map(f => (
                  <TouchableOpacity 
                    key={f} 
                    style={[styles.freqChip, newFrequency === f && styles.freqChipActive]}
                    onPress={() => setNewFrequency(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.freqChipText, newFrequency === f && styles.freqChipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, (!newMedName.trim() || isSubmitting) && styles.submitBtnDisabled]}
              onPress={handleAddReminder}
              disabled={!newMedName.trim() || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Save Reminder</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Card
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inactiveCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  inactiveText: {
    color: '#64748B',
  },
  medDosage: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  deleteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Footer / FAB
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  fab: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 12,
  },
  freqChip: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  freqChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 2,
  },
  freqChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  freqChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
