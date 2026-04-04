import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const categories = [
    { id: 1, name: 'General', icon: 'medical' },
    { id: 2, name: 'Cardiology', icon: 'heart' },
    { id: 3, name: 'Pediatrics', icon: 'person' },
    { id: 4, name: 'Neurology', icon: 'flash' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, User</Text>
            <Text style={styles.subGreeting}>How are you feeling today?</Text>
          </View>
          <TouchableOpacity style={styles.profilePic}>
            <Ionicons name="person-circle" size={40} color="#4a90e2" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search doctors, specialties..." 
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/bookings/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="calendar" size={24} color="#4a90e2" />
              </View>
              <Text style={styles.actionLabel}>Book Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/pharmacy/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#f3e5f5' }]}>
                <Ionicons name="cart" size={24} color="#9c27b0" />
              </View>
              <Text style={styles.actionLabel}>Pharmacy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="document-text" size={24} color="#4caf50" />
              </View>
              <Text style={styles.actionLabel}>Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconBg, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="chatbubble" size={24} color="#ff9800" />
              </View>
              <Text style={styles.actionLabel}>Medi AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <Ionicons name={cat.icon as any} size={24} color="#4a90e2" />
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityType}>Upcoming Consultation</Text>
              <Text style={styles.activityDetail}>Dr. Smith - June 15, 10:00 AM</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  seeAll: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  categoriesScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  activityDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
