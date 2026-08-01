import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPrescriptions = async () => {
    try {
      const response = await api.getMyPrescriptions();
      setPrescriptions(response.data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isVerified = item.is_verified !== false;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push({ pathname: '/prescriptions/[id]', params: { id: item.id } } as any)}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, !isVerified && styles.iconContainerExpired]}>
              <Ionicons 
                name="medical-outline" 
                size={18} 
                color={isVerified ? '#059669' : '#DC2626'} 
              />
            </View>
            <View style={styles.details}>
              <Text style={styles.drugName} numberOfLines={1}>{item.drug_name || 'Verified Medication'}</Text>
              <Text style={styles.doctorName}>Rx Reference: #{item.id}</Text>
              <Text style={styles.date}>
                Issued: {new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.badge, item.is_shared ? styles.badgeShared : styles.badgePrivate]}>
              <Text style={[styles.badgeText, item.is_shared ? styles.badgeTextShared : styles.badgeTextPrivate]}>
                {item.is_shared ? 'Shared' : 'Private'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading prescriptions ledger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <TouchableOpacity style={styles.infoBtn} onPress={onRefresh}>
          <Ionicons name="sync" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPrescriptions}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Prescription Records</Text>
              <Text style={styles.emptySubtitle}>
                You do not have any active prescription records synchronized in your file. 
                Talk to a specialized physician to have an e-prescription added to your account.
              </Text>
              
              <TouchableOpacity 
                style={styles.ctaButton}
                onPress={() => router.push('/bookings/search')}
              >
                <Text style={styles.ctaButtonText}>Consult or Find Doctor</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  infoBtn: {
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerExpired: {
    backgroundColor: '#FEF2F2',
  },
  details: {
    marginLeft: 12,
    flex: 1,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeShared: {
    backgroundColor: '#EFF6FF',
  },
  badgePrivate: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextShared: {
    color: '#2563EB',
  },
  badgeTextPrivate: {
    color: '#475569',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '605',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: { 
    alignItems: 'center', 
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 13, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 18,
    fontWeight: '550',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
