import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  const pendingVerifications = [
    { id: '1', name: 'Dr. Emily Blunt', role: 'doctor', license: 'MD-9922' },
    { id: '2', name: 'Medicare Pharmacy', role: 'pharmacy', license: 'PH-1122' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="settings" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>1.2k</Text>
            <Text style={styles.statLab}>Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>45</Text>
            <Text style={styles.statLab}>Pharmacies</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#ffa000' }]}>
            <Text style={[styles.statVal, { color: '#ffa000' }]}>5</Text>
            <Text style={styles.statLab}>Pending</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Requests</Text>
          {pendingVerifications.map((v) => (
            <View key={v.id} style={styles.vCard}>
              <View style={styles.vInfo}>
                <View style={[styles.vIcon, { backgroundColor: v.role === 'doctor' ? '#e3f2fd' : '#f3e5f5' }]}>
                  <Ionicons name={v.role === 'doctor' ? "medical" : "cart"} size={20} color={v.role === 'doctor' ? "#4a90e2" : "#9c27b0"} />
                </View>
                <View>
                  <Text style={styles.vName}>{v.name}</Text>
                  <Text style={styles.vLabel}>License: {v.license}</Text>
                </View>
              </View>
              <View style={styles.vActions}>
                <TouchableOpacity style={styles.vBtnDecline}>
                  <Text style={styles.vBtnDeclineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vBtnApprove}>
                  <Text style={styles.vBtnApproveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout Admin</Text>
        </TouchableOpacity>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '30%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  vCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    marginBottom: 16,
  },
  vInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  vIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  vLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  vActions: {
    flexDirection: 'row',
    gap: 12,
  },
  vBtnDecline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  vBtnDeclineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  vBtnApprove: {
    flex: 1,
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  vBtnApproveText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  },
  logoutText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
});
