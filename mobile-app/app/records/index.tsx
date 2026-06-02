import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RecordsScreen() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getMyConsultations();
      // Filter for consultations that have notes, prescriptions, or labs
      setConsultations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summaryStats}>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{consultations.length}</Text>
             <Text style={styles.statLabel}>Visits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{consultations.filter(c => c.status === 'completed').length}</Text>
             <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>History</Text>

        {consultations.length > 0 ? (
          consultations.map((item, index) => (
            <Animated.View 
                key={item.id} 
                entering={FadeInDown.delay(index * 100)}
                style={styles.recordCard}
            >
              <View style={styles.cardTop}>
                <View style={styles.doctorAvatar}>
                   <Text style={styles.avatarText}>{(item.doctor_name || 'D').charAt(0)}</Text>
                </View>
                <View style={styles.recordMain}>
                  <Text style={styles.doctorName}>Dr. {item.doctor_name}</Text>
                  <Text style={styles.recordDate}>{new Date(item.scheduled_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: item.mode === 'video' ? '#EEF2FF' : '#ECFDF5' }]}>
                   <Ionicons name={item.mode === 'video' ? 'videocam' : 'chatbubbles'} size={14} color={item.mode === 'video' ? '#4F46E5' : '#10B981'} />
                </View>
              </View>

              <View style={styles.recordDetails}>
                 <Text style={styles.reasonLabel}>Diagnosis / Notes</Text>
                 <Text style={styles.reasonText} numberOfLines={2}>
                    {item.notes || item.reason || 'No clinical notes provided yet.'}
                 </Text>
              </View>

              <View style={styles.resourceRow}>
                 {item.prescription_id && (
                    <TouchableOpacity style={styles.resourceBtn}>
                       <Ionicons name="document-text" size={16} color="#4A90E2" />
                       <Text style={styles.resourceText}>Prescription</Text>
                    </TouchableOpacity>
                 )}
                 {item.status === 'completed' && (
                    <TouchableOpacity style={[styles.resourceBtn, { backgroundColor: '#F0FDF4' }]}>
                       <Ionicons name="flask" size={16} color="#10B981" />
                       <Text style={[styles.resourceText, { color: '#10B981' }]}>Lab Results</Text>
                    </TouchableOpacity>
                 )}
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={60} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Records Yet</Text>
            <Text style={styles.emptySubtitle}>Your medical history and consultations will appear here automatically.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryStats: { flexDirection: 'row', backgroundColor: '#0D1B3A', borderRadius: 24, padding: 24, marginBottom: 32, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  recordCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#4A90E2' },
  recordMain: { flex: 1, marginLeft: 16 },
  doctorName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  recordDate: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  typeBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recordDetails: { marginBottom: 16 },
  reasonLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 },
  reasonText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  resourceRow: { flexDirection: 'row', gap: 12 },
  resourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  resourceText: { fontSize: 12, fontWeight: '800', color: '#4A90E2' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
