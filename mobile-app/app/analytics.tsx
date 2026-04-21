import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('patient');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadUserRoleAndAnalytics();
  }, [timeRange]);

  const loadUserRoleAndAnalytics = async () => {
    try {
      const role = await AsyncStorage.getItem('user_role');
      setUserRole(role?.toLowerCase() || 'patient');

      if (role?.toLowerCase() === 'doctor') {
        const response = await api.getDoctorAnalytics();
        if (response.data) {
          setAnalytics(response.data);
        }
      }
      // Pharmacy analytics would be similar
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ChartBar = ({ label, value, max, color }: any) => (
    <View style={styles.chartRow}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartBarContainer}>
        <View style={[styles.chartBar, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.chartValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      </SafeAreaView>
    );
  }

  // Patient View - Limited analytics
  if (userRole === 'patient') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Health Stats</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.patientStats}>
            <StatCard
              title="Total Consultations"
              value="12"
              subtitle="All time"
              icon="calendar"
              color="#4a90e2"
            />
            <StatCard
              title="Prescriptions"
              value="8"
              subtitle="Active prescriptions"
              icon="document-text"
              color="#22c55e"
            />
            <StatCard
              title="Orders"
              value="15"
              subtitle="Pharmacy orders"
              icon="cart"
              color="#f59e0b"
            />
            <StatCard
              title="Saved"
              value="₦24,500"
              subtitle="Total spent"
              icon="wallet"
              color="#8b5cf6"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Doctor View
  if (userRole === 'doctor' && analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeSelector}>
          {['week', 'month', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeButton, timeRange === range && styles.timeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeButtonText, timeRange === range && styles.timeButtonTextActive]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>
          {/* Main Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Appointments"
              value={analytics.today_appointments || 0}
              subtitle="Today"
              icon="calendar"
              color="#4a90e2"
            />
            <StatCard
              title="Pending"
              value={analytics.pending_appointments || 0}
              subtitle="Awaiting approval"
              icon="time"
              color="#f59e0b"
            />
            <StatCard
              title="Total"
              value={analytics.total_appointments || 0}
              subtitle="All time"
              icon="people"
              color="#22c55e"
            />
            <StatCard
              title="Earnings"
              value={`₦${(analytics.total_earnings || 0).toLocaleString()}`}
              subtitle="This month"
              icon="cash"
              color="#8b5cf6"
            />
          </View>

          {/* Monthly Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Performance</Text>
            <View style={styles.chartCard}>
              <ChartBar label="Jan" value={12} max={20} color="#4a90e2" />
              <ChartBar label="Feb" value={18} max={20} color="#4a90e2" />
              <ChartBar label="Mar" value={15} max={20} color="#4a90e2" />
              <ChartBar label="Apr" value={20} max={20} color="#4a90e2" />
              <ChartBar label="May" value={16} max={20} color="#4a90e2" />
              <ChartBar label="Jun" value={analytics.completed_this_month || 0} max={20} color="#22c55e" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/doctor/availability')}>
                <Ionicons name="calendar" size={28} color="#4a90e2" />
                <Text style={styles.actionText}>Set Availability</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/explore')}>
                <Ionicons name="list" size={28} color="#22c55e" />
                <Text style={styles.actionText}>View Patients</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/doctor/prescription/create')}>
                <Ionicons name="create" size={28} color="#f59e0b" />
                <Text style={styles.actionText}>Prescribe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/consultations/bridge')}>
                <Ionicons name="videocam" size={28} color="#8b5cf6" />
                <Text style={styles.actionText}>Start Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pharmacy View
  if (userRole === 'pharmacy') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pharmacy Analytics</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Orders"
              value="48"
              subtitle="This month"
              icon="cart"
              color="#4a90e2"
            />
            <StatCard
              title="Pending"
              value="5"
              subtitle="To fulfill"
              icon="time"
              color="#f59e0b"
            />
            <StatCard
              title="Revenue"
              value="₦125K"
              subtitle="This month"
              icon="cash"
              color="#22c55e"
            />
            <StatCard
              title="Prescriptions"
              value="32"
              subtitle="Received"
              icon="medical"
              color="#8b5cf6"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Selling Medicines</Text>
            <View style={styles.chartCard}>
              <ChartBar label="Paracetamol" value={45} max={50} color="#4a90e2" />
              <ChartBar label="Amoxicillin" value={38} max={50} color="#22c55e" />
              <ChartBar label="Ibuprofen" value={32} max={50} color="#f59e0b" />
              <ChartBar label="Cough Syrup" value={28} max={50} color="#8b5cf6" />
              <ChartBar label="Vitamins" value={20} max={50} color="#ec4899" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timeSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#4a90e2',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  patientStats: {
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    width: 80,
    fontSize: 12,
    color: '#64748b',
  },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartValue: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
  },
});
