import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

export default function PharmacySearchScreen() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'location' | 'drug'>('drug');
  const [query, setQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPharmacies();
  }, [searchType]);

  const loadPharmacies = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (query) {
        if (searchType === 'location') params.location = query;
        else params.drug_name = query;
      }
      const response = await api.searchPharmacies(params);
      setPharmacies(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    loadPharmacies();
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)} layout={Layout.springify()}>
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/pharmacy/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.address}>{item.address || 'Address not listed'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>{item.is_verified ? 'Verified' : 'Active'}</Text>
          </View>
        </View>
        
        {searchType === 'drug' && item.drug_price && (
          <View style={styles.inventoryRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Available Price</Text>
              <Text style={styles.priceValue}>₦{(item.drug_price / 100).toLocaleString()}</Text>
            </View>
            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Instock</Text>
              <Text style={styles.stockValue}>{item.drug_quantity} units</Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="location" size={14} color="#64748B" />
            <Text style={styles.footerText}>{item.city || 'Lagos'}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time" size={14} color="#64748B" />
            <Text style={styles.footerText}>{item.opening_hours || '8:00 AM - 9:00 PM'}</Text>
          </View>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>Order Now</Text>
            <Ionicons name="chevron-forward" size={14} color="#4A90E2" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Pharmacies</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.tabs}>
              <TouchableOpacity 
                style={[styles.tab, searchType === 'drug' && styles.activeTab]} 
                onPress={() => setSearchType('drug')}
              >
                <Ionicons name="medical" size={16} color={searchType === 'drug' ? '#0D1B3A' : '#fff'} />
                <Text style={[styles.tabText, searchType === 'drug' && styles.activeTabText]}>Find Drug</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, searchType === 'location' && styles.activeTab]} 
                onPress={() => setSearchType('location')}
              >
                <Ionicons name="location" size={16} color={searchType === 'location' ? '#0D1B3A' : '#fff'} />
                <Text style={[styles.tabText, searchType === 'location' && styles.activeTabText]}>By Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput 
                style={styles.input}
                placeholder={searchType === 'drug' ? "Search for medicine name..." : "Enter city or state..."}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); loadPharmacies(); }}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPharmacies}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pharmacies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No pharmacies matched your search</Text>
              <Text style={styles.emptySubtext}>Try searching for a different drug or location</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSection: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  activeTabText: {
    color: '#0D1B3A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  address: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inventoryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2,
  },
  stockContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4A90E2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0D1B3A',
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
