import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DoctorSearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Mock data for UI iteration
  const doctors = [
    { id: '1', name: 'Dr. Sarah Connor', specialty: 'Cardiologist', rating: 4.8, experience: '12 years', hospital: 'General Hospital' },
    { id: '2', name: 'Dr. John Doe', specialty: 'Pediatrician', rating: 4.9, experience: '8 years', hospital: 'Children Clinic' },
    { id: '3', name: 'Dr. Emily Blunt', specialty: 'Neurologist', rating: 4.7, experience: '15 years', hospital: 'State Hospital' },
  ];

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
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color="#ff9800" />
              <Text style={styles.statText}>{item.rating}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time" size={14} color="#666" />
              <Text style={styles.statText}>{item.experience}</Text>
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookText}>Book</Text>
      </TouchableOpacity>
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
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});
