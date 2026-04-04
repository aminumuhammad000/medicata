import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PharmacySearchScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const pharmacies = [
    { id: '1', name: 'Medicare Pharmacy', address: '12 Main St, Lagos', distance: '1.2 km', rating: 4.5, open: true },
    { id: '2', name: 'HealthFirst Drugs', address: '45 Broad Way, Ikeja', distance: '2.5 km', rating: 4.2, open: true },
    { id: '3', name: 'QuickCure Pharmacy', address: '88 Allen Avenue, Ikeja', distance: '3.0 km', rating: 4.8, open: false },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/pharmacy/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <View style={[styles.statusBadge, !item.open && styles.statusBadgeClosed]}>
          <Text style={[styles.statusText, !item.open && styles.statusTextClosed]}>{item.open ? 'Open' : 'Closed'}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.footerText}>{item.distance}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="star" size={14} color="#ff9800" />
          <Text style={styles.footerText}>{item.rating}</Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View & Order</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Pharmacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput 
          style={styles.input}
          placeholder="Search by name or location"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={pharmacies}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e8f5e9',
  },
  statusBadgeClosed: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statusTextClosed: {
    color: '#f44336',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  viewButton: {},
});
