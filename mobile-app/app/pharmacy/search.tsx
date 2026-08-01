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
      <View style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.title}>Find Pharmacy</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.tabs}>
              <TouchableOpacity 
                style={[styles.tab, searchType === 'drug' && styles.activeTab]} 
                onPress={() => setSearchType('drug')}
              >
                <Ionicons name="medical" size={14} color={searchType === 'drug' ? '#0F172A' : '#64748B'} />
                <Text style={[styles.tabText, searchType === 'drug' && styles.activeTabText]}>Find Drug</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, searchType === 'location' && styles.activeTab]} 
                onPress={() => setSearchType('location')}
              >
                <Ionicons name="location" size={14} color={searchType === 'location' ? '#0F172A' : '#64748B'} />
                <Text style={[styles.tabText, searchType === 'location' && styles.activeTabText]}>By Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput 
                style={styles.input}
                placeholder={searchType === 'drug' ? "Search medicine name..." : "Enter city or state..."}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); loadPharmacies(); }}>
                  <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
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
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0F172A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  address: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inventoryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  stockContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});
