import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DoctorDashboard() {
  const router = useRouter();

  const appointments = [
    { id: '1', patient: 'Amina Muhammad', time: '10:30 AM', reason: 'Flu symptoms', type: 'Video' },
    { id: '2', patient: 'John Doe', time: '11:45 AM', reason: 'Back pain', type: 'Chat' },
  ];

  const stats = [
    { label: 'Today', value: '8', icon: 'calendar', color: '#4a90e2' },
    { label: 'Pending', value: '3', icon: 'time', color: '#ff9800' },
    { label: 'Earnings', value: '₦45k', icon: 'wallet', color: '#4caf50' },
  ];

  const renderAppointment = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: item.id } })}
    >
      <View style={styles.patientInfo}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.patient.charAt(0)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.patientName}>{item.patient}</Text>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>
      </View>
      <View style={styles.timeInfo}>
        <Text style={styles.time}>{item.time}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome, Dr. Connor</Text>
            <Text style={styles.subtitle}>You have 8 appointments today</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.activityText}>Consultation with Jane completed</Text>
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
    marginBottom: 32,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notifBtn: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  },
  seeAll: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  details: {
    marginLeft: 12,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timeInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  typeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  typeText: {
    fontSize: 10,
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#444',
  },
});
