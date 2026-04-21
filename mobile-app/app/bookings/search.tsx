import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';

export default function DoctorSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState((params.specialty as string) || '');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDoctors();
  }, [params.specialty]);

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (specialty) params.specialty = specialty;
      const response = await api.searchDoctors(params);
      setDoctors(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadDoctors();
  };

  const renderDoctor = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push({ pathname: '/bookings/doctor/[id]', params: { id: item.id } })}
    >
      <View style={styles.doctorInfo}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={30} color="#ccc" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.full_name || item.name || 'Doctor'}</Text>
          <Text style={styles.specialty}>{item.specialty || 'General'}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color="#ff9800" />
              <Text style={styles.statText}>{item.rating || 'N/A'}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time" size={14} color="#666" />
              <Text style={styles.statText}>{item.years_of_experience || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.bookButton}>
        <Text style={styles.bookText}>Book</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Doctor</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput 
          style={styles.input}
          placeholder="Search specialty or doctor name"
          value={specialty}
          onChangeText={setSpecialty}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#4a90e2" />
        </TouchableOpacity>
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
          data={doctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No doctors found</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  searchButton: {
    padding: 8,
  },
  list: {
    padding: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }
    }),
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  specialty: {
    fontSize: 14,
    color: '#4a90e2',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookText: {
    color: '#fff',
    fontWeight: 'bold',
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
