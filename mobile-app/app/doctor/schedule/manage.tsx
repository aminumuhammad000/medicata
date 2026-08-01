import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ManageSchedule() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
    try {
      if (!isCurrentlyActive) {
        await api.createSchedule({
          day_of_week: dayIndex,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 30,
        });
      } else {
        const existing = schedule.find((s) => s.day_of_week === dayIndex);
        if (existing) await api.deleteSchedule(existing.id);
      }
      fetchSchedule();
    } catch {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const activeDayCount = Object.values(activeDays).filter(Boolean).length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Loading schedule…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Modern flat header ── */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Work Schedule</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar" size={18} color="#2563EB" />
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          Manage your weekly availability for patient bookings
        </Text>

        <View style={styles.statsStrip}>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statPillText}>
              <Text style={styles.statPillValue}>{activeDayCount}</Text>
              {' '}active day{activeDayCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statPill}>
            <View style={[styles.statDot, { backgroundColor: '#CBD5E1' }]} />
            <Text style={styles.statPillText}>
              <Text style={styles.statPillValue}>{7 - activeDayCount}</Text> unavailable
            </Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.statPillText}>30 min slots</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBg}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
          </View>
          <Text style={styles.infoText}>
            Default hours are{' '}
            <Text style={{ fontWeight: '800', color: '#1D4ED8' }}>9:00 AM – 5:00 PM</Text>.
            Toggle a day to activate it.
          </Text>
        </View>

        {/* Day list */}
        <View style={styles.daysList}>
          {DAYS.map((day, index) => {
            const isActive = activeDays[index];
            const daySchedule = schedule.find((s) => s.day_of_week === index);
            const isWeekend = index === 0 || index === 6;

            return (
              <View
                key={day}
                style={[styles.dayRow, index === DAYS.length - 1 && { borderBottomWidth: 0 }]}
              >
                {/* Day abbreviation circle */}
                <View
                  style={[
                    styles.dayAbbr,
                    isActive
                      ? styles.dayAbbrActive
                      : isWeekend
                      ? styles.dayAbbrWeekend
                      : styles.dayAbbrOff,
                  ]}
                >
                  <Text style={[styles.dayAbbrText, isActive && styles.dayAbbrTextActive]}>
                    {DAY_ABBR[index]}
                  </Text>
                </View>

                {/* Day name + time or status */}
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayName, isActive && styles.dayNameActive]}>{day}</Text>
                  {isActive && daySchedule ? (
                    <View style={styles.timeChipRow}>
                      <Ionicons name="time-outline" size={11} color="#0EA5E9" />
                      <Text style={styles.timeRange}>
                        {daySchedule.start_time} – {daySchedule.end_time}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.offlineText}>
                      {isWeekend ? 'Weekend' : 'Unavailable'}
                    </Text>
                  )}
                </View>

                <Switch
                  value={!!isActive}
                  onValueChange={() => toggleDay(index)}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={isActive ? '#2563EB' : '#CBD5E1'}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.advancedBtn}>
          <Ionicons name="settings-outline" size={18} color="#64748B" />
          <Text style={styles.advancedBtnText}>Edit Detailed Time Slots</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Ionicons name="checkmark" size={20} color="#fff" />
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
    backgroundColor: '#F8FAFC',
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statPillValue: {
    color: '#0F172A',
    fontWeight: '800',
  },

  // ── Content ─────────────────────────────────────────────────
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Day List ─────────────────────────────────────────────────
  daysList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      },
    }),
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 14,
  },
  dayAbbr: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayAbbrActive: { backgroundColor: '#DBEAFE' },
  dayAbbrWeekend: { backgroundColor: '#FEF3C7' },
  dayAbbrOff: { backgroundColor: '#F1F5F9' },
  dayAbbrText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dayAbbrTextActive: {
    color: '#2563EB',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 3,
  },
  dayNameActive: {
    color: '#0F172A',
  },
  timeChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeRange: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '700',
  },
  offlineText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  advancedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  advancedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
