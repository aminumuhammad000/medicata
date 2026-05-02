import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface UnifiedRecord {
  id: string;
  type: 'Consultation' | 'Prescription' | 'Order';
  title: string;
  date: string;
  subtitle?: string;
  status?: string;
  timestamp: number;
}

import InventoryScreen from '../pharmacy/inventory';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UnifiedTwoScreen() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      let role = await AsyncStorage.getItem('user_role');
      // Fallback to user_data.role for existing sessions
      if (!role) {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          role = user?.role?.toLowerCase() || null;
          if (role) await AsyncStorage.setItem('user_role', role);
        }
      }
      setUserRole(role?.toLowerCase() || 'patient');
      setInitLoading(false);
    };
    getRole();
  }, []);

  if (initLoading) return null;

  if (userRole === 'pharmacy') {
    return <InventoryScreen isTab={true} />;
  }

  if (userRole === 'doctor') {
    return <DoctorPatientsScreen />;
  }

  return <RecordsScreen />;
}

function DoctorPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await api.getMyConsultations();
      if (res.data) {
        const uniquePatients: any[] = [];
        const seenIds = new Set();
        
        (res.data as any[]).forEach(c => {
          if (c.patient_id && !seenIds.has(c.patient_id)) {
            seenIds.add(c.patient_id);
            uniquePatients.push({
              id: c.patient_id,
              name: c.patient_name || 'Unknown Patient',
              last_visit: new Date(c.scheduled_at).toLocaleDateString(),
              reason: c.reason,
              consultation_id: c.id,
              last_status: c.status
            });
          }
        });
        setPatients(uniquePatients);
        setFilteredPatients(uniquePatients);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const filtered = patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const renderPatient = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.doctorPatientCard} 
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.consultation_id } })}
    >
      <View style={styles.doctorPatientAvatar}>
        <LinearGradient
          colors={['#0D1B3A', '#4A90E2']}
          style={styles.doctorAvatarGradient}
        >
          <Text style={styles.doctorAvatarText}>{(item.name || 'P').charAt(0)}</Text>
        </LinearGradient>
      </View>
      <View style={styles.details}>
        <Text style={styles.doctorPatientName}>{item.name}</Text>
        <View style={styles.doctorPatientMetaRow}>
          <Ionicons name="calendar-outline" size={12} color="#64748B" />
          <Text style={styles.doctorPatientMeta}>Last: {item.last_visit}</Text>
          <View style={styles.dotSeparator} />
          <Text style={[styles.doctorPatientMeta, { color: item.last_status === 'completed' ? '#22C55E' : '#F59E0B' }]}>
            {item.last_status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.doctorPatientReason} numberOfLines={1}>{item.reason}</Text>
      </View>
      <View style={styles.doctorPatientAction}>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.doctorLoadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <View style={styles.doctorContainer}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.doctorHeader}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.doctorHeaderTitle}>Patient Directory</Text>
          <Text style={styles.doctorHeaderSubtitle}>{patients.length} Registered Patients</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or condition..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      <FlatList
        data={filteredPatients}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.doctorList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPatients(); }} tintColor="#0D1B3A" />
        }
        ListEmptyComponent={
          <View style={styles.doctorEmptyContainer}>
            <Ionicons name="people-outline" size={64} color="#E2E8F0" />
            <Text style={styles.doctorEmptyTitle}>{searchQuery ? 'No matching patients' : 'No patients found'}</Text>
            <Text style={styles.doctorEmptySubtitle}>
              {searchQuery ? 'Try searching for a different name or condition.' : 'Your patient list will grow as you complete consultations.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function RecordsScreen() {
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const [consultationsRes, prescriptionsRes, ordersRes] = await Promise.all([
        api.getMyConsultations(),
        api.getMyPrescriptions(),
        api.getMyOrders(),
      ]);

      const unified: UnifiedRecord[] = [];

      // Map Consultations
      if (Array.isArray(consultationsRes.data)) {
        consultationsRes.data.forEach((c: any) => {
          unified.push({
            id: c.id,
            type: 'Consultation',
            title: c.reason || 'General Consultation',
            date: new Date(c.scheduled_at).toLocaleDateString(),
            subtitle: c.doctor_name ? `Dr. ${c.doctor_name}` : 'Doctor Assigned',
            status: c.status,
            timestamp: new Date(c.scheduled_at).getTime(),
          });
        });
      }

      // Map Prescriptions
      if (Array.isArray(prescriptionsRes.data)) {
        prescriptionsRes.data.forEach((p: any) => {
          unified.push({
            id: p.id,
            type: 'Prescription',
            title: 'Prescription Record',
            date: new Date(p.created_at).toLocaleDateString(),
            subtitle: `Verified: ${p.is_verified ? 'Yes' : 'No'}`,
            timestamp: new Date(p.created_at).getTime(),
          });
        });
      }

      // Map Orders
      if (Array.isArray(ordersRes.data)) {
        ordersRes.data.forEach((o: any) => {
          unified.push({
            id: o.id,
            type: 'Order',
            title: o.pharmacy_name || 'Pharmacy Order',
            date: new Date(o.created_at).toLocaleDateString(),
            subtitle: `Status: ${o.status}`,
            status: o.status,
            timestamp: new Date(o.created_at).getTime(),
          });
        });
      }

      // Sort by date descending
      unified.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(unified);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const renderRecord = ({ item }: { item: UnifiedRecord }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[
        styles.iconBox, 
        { backgroundColor: item.type === 'Consultation' ? '#E3F2FD' : item.type === 'Prescription' ? '#F3E5F5' : '#E8F5E9' }
      ]}>
        <Ionicons 
          name={item.type === 'Consultation' ? 'calendar' : item.type === 'Prescription' ? 'medical' : 'cart'} 
          size={24} 
          color={item.type === 'Consultation' ? '#2196F3' : item.type === 'Prescription' ? '#9C27B0' : '#4CAF50'} 
        />
      </View>
      <View style={styles.details}>
        <View style={styles.recordHeader}>
          <Text style={[
            styles.type, 
            { color: item.type === 'Consultation' ? '#2196F3' : item.type === 'Prescription' ? '#9C27B0' : '#4CAF50' }
          ]}>{item.type}</Text>
          {item.status && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.meta}>{item.date} {item.subtitle ? `• ${item.subtitle}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D1B3A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>History of your consultations and orders</Text>
      </View>
      
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D1B3A']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="rgba(13, 27, 58, 0.1)" />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySubtitle}>Your medical history will appear here once you book consultations or order medicine.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  doctorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  doctorLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  doctorHeader: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  doctorHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
  },
  doctorHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  doctorList: {
    padding: 24,
  },
  doctorPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  doctorPatientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    marginRight: 16,
  },
  doctorAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorPatientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  doctorPatientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  doctorPatientMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  doctorPatientReason: {
    fontSize: 12,
    color: '#94A3B8',
  },
  doctorPatientAction: {
    marginLeft: 'auto',
  },
  doctorEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  doctorEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
  },
  doctorEmptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D1B3A',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(13, 27, 58, 0.5)',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...(Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }
    }) as any),
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(13, 27, 58, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D1B3A',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D1B3A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(13, 27, 58, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
