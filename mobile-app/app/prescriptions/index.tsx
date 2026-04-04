import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrescriptionsScreen() {
  const router = useRouter();

  const prescriptions = [
    { id: '1', doctor: 'Dr. Sarah Connor', date: 'June 15, 2026', drug: 'Amoxicillin', status: 'Active' },
    { id: '2', doctor: 'Dr. John Doe', date: 'May 10, 2026', drug: 'Paracetamol', status: 'Expired' },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/prescriptions/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, item.status === 'Expired' && styles.iconContainerExpired]}>
          <Ionicons name="medical" size={24} color={item.status === 'Active' ? '#4caf50' : '#f44336'} />
        </View>
        <View style={styles.details}>
          <Text style={styles.drugName}>{item.drug}</Text>
          <Text style={styles.doctorName}>Prescribed by {item.doctor}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, item.status === 'Expired' && styles.badgeExpired]}>
          <Text style={[styles.badgeText, item.status === 'Expired' && styles.badgeTextExpired]}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Prescriptions</Text>
      </View>

      <FlatList
        data={prescriptions}
        renderItem={renderItem}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerExpired: {
    backgroundColor: '#ffebee',
  },
  details: {
    marginLeft: 16,
    gap: 2,
  },
  drugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
  },
  badgeExpired: {
    backgroundColor: '#f5f5f5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  badgeTextExpired: {
    color: '#999',
  },
});
