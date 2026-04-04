import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PharmacyDashboard() {
  const router = useRouter();

  const orders = [
    { id: '1', patient: 'John Doe', status: 'Pending', time: '10 mins ago', prescription: 'Amoxicillin' },
    { id: '2', patient: 'Amina Muhammad', status: 'Processing', time: '30 mins ago', prescription: 'Paracetamol' },
  ];

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.patient.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.patientName}>{item.patient}</Text>
            <Text style={styles.orderMeta}>{item.time} • {item.prescription}</Text>
          </View>
        </View>
        <View style={[styles.badge, item.status === 'Processing' && styles.badgeProcessing]}>
          <Text style={[styles.badgeText, item.status === 'Processing' && styles.badgeTextProcessing]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.orderFooter}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Update Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}>
          <Text style={styles.primaryBtnText}>Fulfill</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medicare Pharmacy</Text>
          <Text style={styles.subtitle}>Manage incoming orders</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>5</Text>
          <Text style={styles.statLab}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>12</Text>
          <Text style={styles.statLab}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incoming Orders</Text>
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLab: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#9c27b0',
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff8e1',
  },
  badgeProcessing: {
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffa000',
  },
  badgeTextProcessing: {
    color: '#2196f3',
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  primaryBtn: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
