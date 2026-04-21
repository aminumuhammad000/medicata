import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function PharmacySearch() {
  const router = useRouter();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId: string }>();
  
  const [query, setQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (location: string) => {
    setLoading(true);
    try {
      const res = await api.searchPharmacies({ city: location });
      if (res.data) {
        setPharmacies(res.data);
      }
    } catch (error) {
      console.error('Pharmacy search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPharmacy = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/patient/pharmacies/order' as any,
        params: { prescriptionId, pharmacyId: item.id, pharmacyName: item.full_name }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.tagRow}>
            {item.is_verified && (
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4caf50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            <Text style={styles.distance}>1.2 km away</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call" size={20} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#999" />
          <Text style={styles.address} numberOfLines={1}>{item.address || 'No address provided'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Pharmacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city or area..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={pharmacies}
          renderItem={renderPharmacy}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No pharmacies found in this area</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4caf50',
    textTransform: 'uppercase',
  },
  distance: {
    fontSize: 12,
    color: '#999',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  address: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
});
