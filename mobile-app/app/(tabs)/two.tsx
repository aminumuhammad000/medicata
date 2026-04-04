import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RecordsScreen() {
  const records = [
    { id: '1', type: 'Consultation', title: 'Cardiology Visit', date: 'June 15, 2026', doctor: 'Dr. Connor' },
    { id: '2', type: 'Prescription', title: 'Amoxicillin 500mg', date: 'May 20, 2026', doctor: 'Dr. John Doe' },
    { id: '3', type: 'Order', title: 'Medicine Pickup', date: 'May 21, 2026', status: 'Delivered' },
  ];

  const renderRecord = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons 
          name={item.type === 'Consultation' ? 'calendar' : item.type === 'Prescription' ? 'medical' : 'cart'} 
          size={24} 
          color="#4a90e2" 
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.meta}>{item.date} {item.doctor ? `• ${item.doctor}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
      </View>
      <FlatList
        data={records}
        renderItem={renderRecord}
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
  headerTitle: {
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 16,
  },
  type: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4a90e2',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
