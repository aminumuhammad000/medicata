import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

const SPECIALTIES = [
  { id: 'all', label: 'All Doctors', icon: 'people-outline' },
  { id: 'General', label: 'General', icon: 'medical-outline' },
  { id: 'Cardiology', label: 'Cardiology', icon: 'heart-outline' },
  { id: 'Pediatrics', label: 'Pediatrics', icon: 'woman-outline' },
  { id: 'Neurology', label: 'Neurology', icon: 'git-network-outline' },
  { id: 'Dermatology', label: 'Dermatology', icon: 'sunny-outline' }
];

export default function DoctorSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState((params.specialty as string) || 'all');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDoctors();
  }, [specialty, search]);

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const searchParams: any = {};
      if (specialty && specialty !== 'all') searchParams.specialty = specialty;
      if (search) searchParams.name = search;
      
      const response = await api.searchDoctors(searchParams);
      const resData = response.data || response;
      setDoctors(resData?.doctors || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialty = (id: string) => {
    setSpecialty(id);
    router.setParams({ specialty: id === 'all' ? '' : id });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'D';
    const split = name.replace('Dr. ', '').split(' ');
    if (split.length >= 2) return `${split[0][0]}${split[1][0]}`.toUpperCase();
    return split[0][0].toUpperCase();
  };

  const renderDoctor = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity 
        style={styles.doctorCard}
        onPress={() => router.push({ pathname: '/bookings/doctor/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          {/* Avatar placeholder with initials */}
          <View style={styles.avatarContainer}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.avatarText}>{getInitials(item.full_name || item.name)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
            </View>
          </View>

          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name || item.name || 'Medical Specialist'}</Text>
            <Text style={styles.specialtyText}>{item.specialty || 'General Practitioner'}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Ionicons name="star" size={13} color="#FBBF24" />
                <Text style={styles.metaText}>{item.rating ? Number(item.rating).toFixed(1) : '4.8'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCol}>
                <Ionicons name="ribbon-outline" size={13} color="#64748B" />
                <Text style={styles.metaText}>{item.years_of_experience || '5'}+ yrs exp</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.availabilityRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.availabilityText}>Available Today</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push({ pathname: '/bookings/doctor/[id]', params: { id: item.id } })}
          >
            <Text style={styles.bookButtonText}>Book Appointment</Text>
            <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Medical Specialist</Text>
        <TouchableOpacity style={styles.infoBtn} onPress={loadDoctors}>
          <Ionicons name="sync" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar (High-Density) */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput 
            style={styles.input}
            placeholder="Search by physician name or keyword..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Category/Specialty scrolling selection chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.specialtiesScroll}
        >
          {SPECIALTIES.map((spec) => {
            const isActive = specialty === spec.id;
            return (
              <TouchableOpacity
                key={spec.id}
                style={[styles.specialtyChip, isActive && styles.specialtyChipActive]}
                onPress={() => handleSelectSpecialty(spec.id)}
              >
                <Ionicons name={spec.icon as any} size={13} color={isActive ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.specialtyLabel, isActive && styles.specialtyLabelActive]}>
                  {spec.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Searching medical network...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDoctors}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="search-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No specialists found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search keywords or choosing a different specialty filter.</Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  specialtiesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 4,
    gap: 6,
  },
  specialtyChipActive: {
    backgroundColor: '#2563EB',
  },
  specialtyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  specialtyLabelActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  details: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '550',
  },
});
