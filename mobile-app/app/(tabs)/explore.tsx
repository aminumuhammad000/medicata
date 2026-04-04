import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ConsultationsScreen() {
  const router = useRouter();

  const consultations = [
    { id: '1', doctor: 'Dr. Sarah Connor', date: 'June 15, 2026', time: '10:00 AM', mode: 'Video', status: 'Pending' },
    { id: '2', doctor: 'Dr. John Doe', date: 'May 20, 2026', time: '02:30 PM', mode: 'Chat', status: 'Completed' },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <Ionicons name="person-circle" size={40} color="#4a90e2" />
          <View style={styles.details}>
            <Text style={styles.doctorName}>{item.doctor}</Text>
            <Text style={styles.dateTime}>{item.date} • {item.time}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.status === 'Completed' && styles.statusBadgeCompleted]}>
          <Text style={[styles.statusText, item.status === 'Completed' && styles.statusTextCompleted]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.modeRow}>
          <Ionicons name={item.mode === 'Video' ? 'videocam' : 'chatbubbles'} size={16} color="#666" />
          <Text style={styles.modeText}>{item.mode} Consultation</Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consultations</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}><Text style={[styles.tabText, styles.tabTextActive]}>Upcoming</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Past</Text></TouchableOpacity>
      </View>

      <FlatList
        data={consultations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color="#eee" />
            <Text style={styles.emptyText}>No consultations found</Text>
          </View>
        }
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tabActive: {
    backgroundColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
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
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  details: {
    gap: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff8e1',
  },
  statusBadgeCompleted: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffa000',
  },
  statusTextCompleted: {
    color: '#4caf50',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    fontSize: 14,
    color: '#666',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 12,
  },
  viewButton: {},
});
