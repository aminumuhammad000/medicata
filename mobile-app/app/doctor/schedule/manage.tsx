import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageSchedule() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [activeDays, setActiveDays] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await api.getSchedules();
      if (res.data) {
        setSchedule(res.data);
        const active: Record<number, boolean> = {};
        res.data.forEach((s: any) => {
          active[s.day_of_week] = s.is_available;
        });
        setActiveDays(active);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = async (dayIndex: number) => {
    const isCurrentlyActive = activeDays[dayIndex];
    setActiveDays({ ...activeDays, [dayIndex]: !isCurrentlyActive });
    
    // Auto-save logic
    try {
      if (!isCurrentlyActive) {
        // Default 9 AM to 5 PM
        await api.createSchedule({
          day_of_week: dayIndex,
          start_time: "09:00",
          end_time: "17:00",
          slot_duration_minutes: 30
        });
      } else {
        // Find schedule ID to delete
        const existing = schedule.find(s => s.day_of_week === dayIndex);
        if (existing) {
          await api.deleteSchedule(existing.id);
        }
      }
      fetchSchedule(); // Refresh data
    } catch (err) {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Work Schedule</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.headerSubtitle}>Set your weekly availability for patient bookings</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#0EA5E9" />
          <Text style={styles.infoText}>
            Patients can only book consultations during your active hours. Default hours are 9:00 AM - 5:00 PM.
          </Text>
        </View>

        <View style={styles.daysList}>
          {DAYS.map((day, index) => {
            const isActive = activeDays[index];
            const daySchedule = schedule.find(s => s.day_of_week === index);
            
            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayName, isActive && styles.dayNameActive]}>{day}</Text>
                  {isActive && daySchedule && (
                    <Text style={styles.timeRange}>
                      {daySchedule.start_time} - {daySchedule.end_time} • {daySchedule.slot_duration_minutes}m slots
                    </Text>
                  )}
                  {!isActive && <Text style={styles.offlineText}>Unavailable</Text>}
                </View>
                <Switch
                  value={!!isActive}
                  onValueChange={() => toggleDay(index)}
                  trackColor={{ false: '#E2E8F0', true: '#0D1B3A' }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : ''}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.advancedBtn}>
          <Ionicons name="settings-outline" size={20} color="#0D1B3A" />
          <Text style={styles.advancedBtnText}>Edit Detailed Time Slots</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  content: {
    padding: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
    fontWeight: '500',
  },
  daysList: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  dayNameActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  timeRange: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  offlineText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  advancedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
  },
  advancedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1B3A',
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#0D1B3A',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
