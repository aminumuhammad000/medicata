import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [recentConsultation, setRecentConsultation] = useState<any>(null);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [recentPrescription, setRecentPrescription] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Check if we already have some user data to show something immediately
    try {
      const user = await api.getUserData();
      setUserData(user);
      // Save fresh data to storage so it persists and matches what the server has
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      setUserRole(user.role);
      setLoading(false); // Show UI with cached data first
    } catch (error) {
      setLoading(true);
    }
    
    await fetchData();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      // Fetch fresh user data from server
      const meRes = await api.getMe();
      const user = meRes.data;
      
      if (user) {
        setUserData(user);
        setUserRole(user.role);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        await AsyncStorage.setItem('user_role', user.role);
      }
      
      const role = user?.role || await api.getUserRole();

      // Fetch consultations (Skip for Pharmacy as they do not manage consultations)
      if (role !== 'Pharmacy' && role !== 'pharmacy') {
        try {
          const consultationsRes = await api.getMyConsultations();
          const consultations = consultationsRes.data || [];
          
          if (role === 'Patient' || role === 'patient' || !role) {
          const upcoming = consultations
            .filter(c => c.status === 'scheduled' || c.status === 'pending')
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          setRecentConsultation(upcoming[0] || consultations[0]);
        } else if (role === 'Doctor') {
          const today = new Date().toDateString();
          const todaysAppointments = consultations.filter(c => new Date(c.scheduled_at).toDateString() === today);
          const pending = consultations.filter(c => c.status === 'pending');
          const completed = consultations.filter(c => c.status === 'completed');
          
          setStats((prev: any) => ({
            ...prev,
            today: todaysAppointments.length,
            pending: pending.length,
            earnings: completed.length * 5000
          }));
          
          const nextAppt = consultations
            .filter(c => c.status === 'pending' || c.status === 'accepted')
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
          setRecentConsultation(nextAppt);
        }
      } catch (e) {
        console.error('Failed to fetch consultations:', e);
      }
      }

      // Fetch orders if applicable
      if (role === 'Pharmacy' || role === 'Patient' || !role) {
        try {
          const ordersRes = await api.getMyOrders();
          const orders = ordersRes.data || [];
          
          if (role === 'Pharmacy') {
            const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing');
            const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
            
            setStats((prev: any) => ({
              ...prev,
              total: orders.length,
              pending: pending.length,
              revenue: completed.length * 3500
            }));
            
            setRecentOrder(orders[0]);
          } else {
            // For patients - get most recent order
            const pendingOrders = orders.filter((o: any) => ['pending', 'processing', 'ready_for_pickup'].includes(o.status?.toLowerCase()));
            setStats((prev: any) => ({
              ...prev,
              pendingOrders: pendingOrders.length,
              totalOrders: orders.length
            }));
            setRecentOrder(orders[0]);
          }
        } catch (e) {
          console.error('Failed to fetch orders:', e);
        }
      }

      // Fetch prescriptions for patients
      if (role === 'Patient' || !role) {
        try {
          const prescriptionsRes = await api.getMyPrescriptions();
          const prescriptions = prescriptionsRes.data || [];
          const activePrescriptions = prescriptions.filter((p: any) => !p.is_dispensed && new Date(p.expiry_date) > new Date());
          setStats((prev: any) => ({
            ...prev,
            activePrescriptions: activePrescriptions.length
          }));
          setRecentPrescription(prescriptions[0]);
        } catch (e) {
          console.error('Failed to fetch prescriptions:', e);
        }
      }

      // Fetch notifications
      try {
        const notifRes = await api.getMyNotifications();
        if (notifRes.data) {
          const unread = notifRes.data.filter((n: any) => !n.is_read).length;
          setUnreadNotifications(unread);
        }
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // Patient Dashboard
  const PatientDashboard = () => {
    const categories = [
      { id: 1, name: 'General', icon: 'medical' },
      { id: 2, name: 'Cardiology', icon: 'heart' },
      { id: 3, name: 'Pediatrics', icon: 'person' },
      { id: 4, name: 'Neurology', icon: 'flash' },
    ];

    const getStatusStyle = (status: string) => {
      const normalized = status?.toLowerCase().replace(/_/g, '');
      switch (normalized) {
        case 'pending': return { bg: '#FFFBEB', text: '#F59E0B' };
        case 'processing': return { bg: '#EFF6FF', text: '#3B82F6' };
        case 'readyforpickup': return { bg: '#ECFDF5', text: '#10B981' };
        case 'pickedup':
        case 'delivered':
        case 'completed': return { bg: '#F1F5F9', text: '#64748B' };
        default: return { bg: '#FFFBEB', text: '#F59E0B' };
      }
    };

    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.subGreeting}>Welcome back,</Text>
            <Text style={styles.greeting}>{userData?.full_name?.split(' ')[0] || 'Patient'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.notifBtn}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profilePic}
              onPress={() => router.push('/profile' as any)}
            >
              <LinearGradient
                colors={['#e3f2fd', '#f8f9fa']}
                style={styles.profilePicGradient}
              >
                <Ionicons name="person" size={24} color="#4a90e2" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Stats */}
        <View style={styles.patientStatsRow}>
          <View style={styles.patientStatCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.patientStatValue}>{stats.pendingOrders || 0}</Text>
            <Text style={styles.patientStatLabel}>Pending Orders</Text>
          </View>
          <View style={styles.patientStatCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text" size={20} color="#10B981" />
            </View>
            <Text style={styles.patientStatValue}>{stats.activePrescriptions || 0}</Text>
            <Text style={styles.patientStatLabel}>Active Scripts</Text>
          </View>
        </View>
 
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#4a90e2" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search doctors, clinics..." 
            placeholderTextColor="#999"
          />
        </View>
 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Services</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/bookings/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EBF4FF' }]}>
                <Ionicons name="add-circle" size={28} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>Book Doctor</Text>
              <Text style={styles.actionSubLabel}>Find specialists</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/pharmacy/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="medical" size={28} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Pharmacy</Text>
              <Text style={styles.actionSubLabel}>Order meds</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/prescriptions/index')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="document-text" size={28} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Health Records</Text>
              <Text style={styles.actionSubLabel}>View history</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/medi-chat')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="sparkles" size={28} color="#D97706" />
              </View>
              <Text style={styles.actionLabel}>Medi AI</Text>
              <Text style={styles.actionSubLabel}>AI assistance</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consultation Categories</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/bookings/search', params: { specialty: cat.name } })}
              >
                <View style={styles.catIconBg}>
                  <Ionicons name={cat.icon as any} size={20} color="#4a90e2" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentConsultation ? (
            <TouchableOpacity 
              style={styles.activityCard}
              onPress={() => router.push('/explore')}
            >
              <View style={styles.activityStatusIndicator} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>
                  {recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending' ? 'Upcoming Appointment' : 'Latest Session'}
                </Text>
                <Text style={styles.activityDetail}>
                  {recentConsultation.doctor_name || 'Doctor'} • {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBD'} at {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="calendar-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No recent activity yet</Text>
            </View>
          )}
        </View>

        {/* My Consultations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Consultations</Text>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentConsultation ? (
            <TouchableOpacity 
              style={styles.consultationCard}
              onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: recentConsultation.id } } as any)}
            >
              <View style={styles.consultationHeader}>
                <View style={[styles.consultationIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="medical" size={20} color="#4F46E5" />
                </View>
                <View style={styles.consultationInfo}>
                  <Text style={styles.consultationDoctor}>{recentConsultation.doctor_name || 'Doctor'}</Text>
                  <Text style={styles.consultationSpecialty}>{recentConsultation.specialty || 'General'}</Text>
                </View>
                <View style={[styles.consultationStatusBadge, { backgroundColor: recentConsultation.status === 'completed' ? '#ECFDF5' : '#FFFBEB' }]}>
                  <Text style={[styles.consultationStatusText, { color: recentConsultation.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                    {recentConsultation.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.consultationFooter}>
                <View style={styles.consultationDetail}>
                  <Ionicons name="calendar" size={14} color="#64748B" />
                  <Text style={styles.consultationDetailText}>
                    {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                  </Text>
                </View>
                <View style={styles.consultationDetail}>
                  <Ionicons name="time" size={14} color="#64748B" />
                  <Text style={styles.consultationDetailText}>
                    {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="calendar-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No consultations yet</Text>
              <TouchableOpacity 
                style={styles.orderNowBtn}
                onPress={() => router.push('/bookings/search')}
              >
                <Text style={styles.orderNowBtnText}>Book a Doctor</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Prescriptions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Prescriptions</Text>
            <TouchableOpacity onPress={() => router.push('/prescriptions/index' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentPrescription ? (
            <TouchableOpacity 
              style={styles.prescriptionCard}
              onPress={() => router.push({ pathname: '/prescriptions/index', params: { id: recentPrescription.id } } as any)}
            >
              <View style={styles.prescriptionHeader}>
                <View style={[styles.prescriptionIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="document-text" size={20} color="#10B981" />
                </View>
                <View style={styles.prescriptionInfo}>
                  <Text style={styles.prescriptionDoctor}>{recentPrescription.doctor_name || 'Dr. Unknown'}</Text>
                  <Text style={styles.prescriptionDate}>
                    Issued: {new Date(recentPrescription.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {new Date(recentPrescription.expiry_date) < new Date() ? (
                  <View style={[styles.prescriptionBadge, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.prescriptionBadgeText, { color: '#EF4444' }]}>EXPIRED</Text>
                  </View>
                ) : (
                  <View style={[styles.prescriptionBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.prescriptionBadgeText, { color: '#10B981' }]}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.prescriptionFooter}>
                <Text style={styles.prescriptionExpiry}>
                  {new Date(recentPrescription.expiry_date) < new Date() 
                    ? 'Expired on: ' 
                    : 'Expires: '}
                  {new Date(recentPrescription.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                {new Date(recentPrescription.expiry_date) < new Date() && (
                  <TouchableOpacity style={styles.buyAgainBtn}>
                    <Text style={styles.buyAgainBtnText}>Buy Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="document-text-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No prescriptions yet</Text>
            </View>
          )}
        </View>

        {/* Upcoming Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
            <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.remindersCard}>
            {recentConsultation && (recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') && (
              <View style={styles.reminderItem}>
                <View style={[styles.reminderIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="calendar" size={18} color="#4F46E5" />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle}>Upcoming Appointment</Text>
                  <Text style={styles.reminderText}>
                    {recentConsultation.doctor_name || 'Doctor'} at {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                  </Text>
                </View>
              </View>
            )}
            {recentPrescription && new Date(recentPrescription.expiry_date) > new Date() && new Date(recentPrescription.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
              <View style={styles.reminderItem}>
                <View style={[styles.reminderIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="alert-circle" size={18} color="#D97706" />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle}>Prescription Expiring Soon</Text>
                  <Text style={styles.reminderText}>
                    Expires in {Math.ceil((new Date(recentPrescription.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </Text>
                </View>
              </View>
            )}
            {recentOrder && ['pending', 'processing', 'ready_for_pickup'].includes(recentOrder.status?.toLowerCase()) && (
              <View style={styles.reminderItem}>
                <View style={[styles.reminderIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="cube" size={18} color="#10B981" />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTitle}>Order Update</Text>
                  <Text style={styles.reminderText}>
                    Order status: {recentOrder.status?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            )}
            {(!recentConsultation || recentConsultation.status === 'completed') && (!recentPrescription || new Date(recentPrescription.expiry_date) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) && (!recentOrder || !['pending', 'processing', 'ready_for_pickup'].includes(recentOrder.status?.toLowerCase())) && (
              <View style={styles.emptyReminder}>
                <Ionicons name="notifications-off-outline" size={24} color="#CBD5E1" />
                <Text style={styles.emptyReminderText}>No upcoming reminders</Text>
              </View>
            )}
          </View>
        </View>

        {/* My Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Orders</Text>
            <TouchableOpacity onPress={() => router.push('/orders' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrder ? (
            <TouchableOpacity 
              style={styles.orderCard}
              onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: recentOrder.id } } as any)}
            >
              <View style={styles.orderCardHeader}>
                <View style={styles.orderPharmacyInfo}>
                  <View style={[styles.orderIconBg, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="medical" size={20} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={styles.orderPharmacyName}>{recentOrder.pharmacy_name || 'Pharmacy'}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(recentOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.orderStatusBadge, { backgroundColor: getStatusStyle(recentOrder.status).bg }]}>
                  <Text style={[styles.orderStatusText, { color: getStatusStyle(recentOrder.status).text }]}>
                    {recentOrder.status?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.orderCardFooter}>
                <Text style={styles.orderTotalLabel}>Total</Text>
                <Text style={styles.orderTotalValue}>₦{(recentOrder.total_amount || 0).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="cart-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No orders yet</Text>
              <TouchableOpacity 
                style={styles.orderNowBtn}
                onPress={() => router.push('/pharmacy/search')}
              >
                <Text style={styles.orderNowBtnText}>Order Medications</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </>
    );
  };

  // Doctor Dashboard
  const DoctorDashboard = () => {
    const doctorStats = [
      { label: 'Today', value: stats.today || '0', icon: 'today', color: '#2196f3', bg: '#EEF2FF' },
      { label: 'Pending', value: stats.pending || '0', icon: 'time', color: '#F59E0B', bg: '#FFFBEB' },
      { label: 'Total', value: stats.total_appointments || '0', icon: 'calendar', color: '#4F46E5', bg: '#F5F3FF' },
      { label: 'Earnings', value: `₦${(stats.earnings || 0).toLocaleString()}`, icon: 'wallet', color: '#10B981', bg: '#ECFDF5' },
    ];

    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.subGreeting}>Welcome back,</Text>
            <Text style={styles.greeting}>Dr. {userData?.full_name?.split(' ')[0] || 'Doctor'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.notifBtn}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profilePic}
              onPress={() => router.push('/profile' as any)}
            >
              <LinearGradient
                colors={['#e3f2fd', '#f8f9fa']}
                style={styles.profilePicGradient}
              >
                <Ionicons name="person" size={24} color="#4a90e2" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor Stats */}
        <View style={styles.doctorStatsRow}>
          {doctorStats.map((s, i) => (
            <View key={i} style={styles.doctorStatCard}>
              <View style={[styles.doctorStatIconBg, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={styles.doctorStatValue}>{s.value}</Text>
              <Text style={styles.doctorStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentConsultation && recentConsultation.status !== 'completed' ? (
            <TouchableOpacity 
              style={styles.appointmentCard}
              onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: recentConsultation.id } } as any)}
            >
              <View style={styles.appointmentHeader}>
                <View style={[styles.appointmentAvatar, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={styles.appointmentAvatarText}>
                    {(recentConsultation.patient_name || 'P').charAt(0)}
                  </Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentPatientName}>{recentConsultation.patient_name || 'Patient'}</Text>
                  <Text style={styles.appointmentReason}>{recentConsultation.reason || 'Consultation'}</Text>
                </View>
                <View style={[styles.appointmentStatusBadge, { 
                  backgroundColor: recentConsultation.status === 'scheduled' ? '#ECFDF5' : '#FFFBEB' 
                }]}>
                  <Text style={[styles.appointmentStatusText, { 
                    color: recentConsultation.status === 'scheduled' ? '#10B981' : '#F59E0B' 
                  }]}>
                    {recentConsultation.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.appointmentFooter}>
                <View style={styles.appointmentDetail}>
                  <Ionicons name="time" size={14} color="#64748B" />
                  <Text style={styles.appointmentDetailText}>
                    {recentConsultation.scheduled_at ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                  </Text>
                </View>
                <View style={styles.appointmentDetail}>
                  <Ionicons name="videocam" size={14} color="#64748B" />
                  <Text style={styles.appointmentDetailText}>
                    {recentConsultation.mode || 'Video'}
                  </Text>
                </View>
              </View>
              {recentConsultation.status === 'pending' && (
                <View style={styles.appointmentActions}>
                  <TouchableOpacity style={styles.acceptBtn}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
              {recentConsultation.status === 'scheduled' && (
                <TouchableOpacity style={styles.startConsultationBtn}>
                  <Text style={styles.startConsultationBtnText}>Start Consultation</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="calendar-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No appointments for today</Text>
            </View>
          )}
        </View>

        {/* Recent Prescriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
            <TouchableOpacity onPress={() => router.push('/prescriptions/index' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentPrescription ? (
            <TouchableOpacity 
              style={styles.docPrescriptionCard}
              onPress={() => router.push({ pathname: '/prescriptions/index', params: { id: recentPrescription.id } } as any)}
            >
              <View style={styles.docPrescriptionHeader}>
                <View style={[styles.docPrescriptionIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="document-text" size={20} color="#10B981" />
                </View>
                <View style={styles.docPrescriptionInfo}>
                  <Text style={styles.docPrescriptionPatient}>{recentPrescription.patient_name || 'Patient'}</Text>
                  <Text style={styles.docPrescriptionDate}>
                    Issued: {new Date(recentPrescription.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.docPrescriptionBadge, { 
                  backgroundColor: recentPrescription.is_dispensed ? '#ECFDF5' : '#FFFBEB' 
                }]}>
                  <Text style={[styles.docPrescriptionBadgeText, { 
                    color: recentPrescription.is_dispensed ? '#10B981' : '#F59E0B' 
                  }]}>
                    {recentPrescription.is_dispensed ? 'FILLED' : 'PENDING'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="document-text-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No prescriptions issued yet</Text>
            </View>
          )}
        </View>

        {/* New Patient Bookings Notifications */}
        {stats.pending > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Booking Requests</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{stats.pending} NEW</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.newBookingCard}>
              <View style={[styles.newBookingIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="person-add" size={24} color="#D97706" />
              </View>
              <View style={styles.newBookingInfo}>
                <Text style={styles.newBookingTitle}>Pending Appointments</Text>
                <Text style={styles.newBookingText}>
                  You have {stats.pending} appointment request(s) awaiting your response
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/doctor/prescription/create')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="document-text" size={24} color="#4caf50" />
              </View>
              <Text style={styles.actionLabel}>Prescribe</Text>
              <Text style={styles.actionSubLabel}>Create prescription</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/explore')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="calendar" size={24} color="#4a90e2" />
              </View>
              <Text style={styles.actionLabel}>Appointments</Text>
              <Text style={styles.actionSubLabel}>View schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/bookings/search')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="people" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>My Patients</Text>
              <Text style={styles.actionSubLabel}>Patient history</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/doctor/analytics')}
            >
              <View style={[styles.iconBg, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="stats-chart" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Analytics</Text>
              <Text style={styles.actionSubLabel}>Track progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // Pharmacy Dashboard — aligned with UserJourney.md Step 2:
  // View new prescriptions, track pending/completed orders, see notifications
  const PharmacyDashboard = () => {
    const isProfileIncomplete = !userData?.pharmacy_name || !userData?.pharmacy_contact_info || !userData?.pharmacy_address;

    const pharmacyStats = [
      { label: 'Pending', value: stats.pending || '0', icon: 'time-outline', color: '#F59E0B' },
      { label: 'Total Orders', value: stats.total || '0', icon: 'cart-outline', color: '#3B82F6' },
      { label: 'Revenue', value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: 'wallet-outline', color: '#10B981' },
    ];

    return (
      <View style={styles.pharmacyDashboard}>
        <LinearGradient
          colors={['#0D1B3A', '#1E3A5F']}
          style={styles.pharmacyHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.subGreeting, { color: 'rgba(255,255,255,0.7)' }]}>Welcome back,</Text>
            <Text style={[styles.greeting, { color: '#FFFFFF' }]}>{userData?.pharmacy_name || userData?.full_name || 'Pharmacy'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profilePic, { borderColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => router.push('/profile' as any)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.profilePicGradient}
            >
              <Ionicons name="business-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Profile Completion Prompt — User Friendly setup */}
        {isProfileIncomplete && (
          <TouchableOpacity 
            style={styles.setupCard}
            onPress={() => router.push('/onboarding/pharmacy-info')}
          >
            <LinearGradient
              colors={['#FFF7ED', '#FFFBEB']}
              style={styles.setupGradient}
            >
              <View style={styles.setupIconBg}>
                <Ionicons name="rocket-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.setupInfo}>
                <Text style={styles.setupTitle}>Complete your setup</Text>
                <Text style={styles.setupSubTitle}>Fill in your business details to start receiving orders.</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#F59E0B" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {pharmacyStats.map((s, i) => (
            <View key={i} style={[styles.statCard, styles.pharmacyStatCard]}>
              <View style={[styles.statIconCircle, { backgroundColor: `${s.color}22` }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* New Prescriptions — Step 2: "View new prescriptions sent by doctors/patients" */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Prescriptions</Text>
            <TouchableOpacity onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentOrder ? (
            <TouchableOpacity
              style={styles.pharmacyActivityCard}
              onPress={() => router.push({ pathname: '/pharmacy/order/[id]', params: { id: recentOrder.id } } as any)}
            >
              <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.pharmacyActivityGradient}>
                <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF', marginRight: 16 }]}>
                  <Ionicons name="document-text-outline" size={22} color="#4F46E5" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityDetail}>From: {recentOrder.patient_name || 'Customer'}</Text>
                  <Text style={styles.activitySubDetail}>
                    {new Date(recentOrder.created_at).toLocaleDateString()} • Status: {recentOrder.status}
                  </Text>
                </View>
                <View style={[styles.orderBadge, { marginBottom: 0 }]}>
                  <Text style={styles.orderBadgeText}>{recentOrder.status?.toUpperCase()}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="notifications-off-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyActivityText}>No new prescriptions</Text>
            </View>
          )}
        </View>

        {/* Quick Actions — Step 3 & 4 shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/explore' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="cart-outline" size={26} color="#4F46E5" />
              </View>
              <Text style={styles.actionLabel}>Orders</Text>
              <Text style={styles.actionSubLabel}>Manage queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/scan' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="qr-code-outline" size={26} color="#10B981" />
              </View>
              <Text style={styles.actionLabel}>Dispense</Text>
              <Text style={styles.actionSubLabel}>Scan QR code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/two' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="cube-outline" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Stock</Text>
              <Text style={styles.actionSubLabel}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.pharmacyActionCard]}
              onPress={() => router.push('/(tabs)/reputation' as any)}
            >
              <View style={[styles.iconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="stats-chart-outline" size={26} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Insights</Text>
              <Text style={styles.actionSubLabel}>Performance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


  if (loading && !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={{ marginTop: 10, color: '#64748B' }}>Loading your dashboard...</Text>
          
          <TouchableOpacity 
            style={{ marginTop: 40, padding: 10 }}
            onPress={() => loadDashboardData()}
          >
            <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>Retry Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 20, padding: 10 }}
            onPress={async () => {
              await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_role']);
              router.replace('/login');
            }}
          >
            <Text style={{ color: '#f44336' }}>Sign Out & Restart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4a90e2"]} />
        }
      >
        {(userRole?.toLowerCase() === 'patient' || !userRole) && <PatientDashboard />}
        {userRole?.toLowerCase() === 'doctor' && <DoctorDashboard />}
        {userRole?.toLowerCase() === 'pharmacy' && <PharmacyDashboard />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  profilePicGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.03)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
      }
    }),
  },
  searchInput: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
    color: '#0F172A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  seeAll: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
      }
    }),
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  categoriesScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  catIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  pharmacyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pharmacyRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pharmacyRatingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
      }
    }),
  },
  activityStatusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityDetail: {
    fontSize: 16,
    color: '#0F172A',
    marginTop: 4,
    fontWeight: '700',
  },
  emptyActivityCard: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyActivityText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 10px rgba(15, 23, 42, 0.05)',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }
    }),
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  // Pharmacy Specific Styles
  pharmacyDashboard: {
    flex: 1,
    marginHorizontal: -24,
    marginTop: -24,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  pharmacyHeaderGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  pharmacyStatCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 0,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyActivityCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pharmacyActivityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  orderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  activitySubDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  pharmacyActionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  setupCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(249, 115, 22, 0.08)' },
      default: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }
    }),
  },
  setupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  setupIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupInfo: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9A3412',
  },
  setupSubTitle: {
    fontSize: 12,
    color: '#C2410C',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  // Patient Dashboard Styles
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  patientStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  patientStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  patientStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderPharmacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderPharmacyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  orderTotalLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
  },
  orderNowBtn: {
    marginTop: 16,
    backgroundColor: '#0D1B3A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  orderNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Consultation Card Styles
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  consultationIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  consultationDoctor: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  consultationSpecialty: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  consultationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consultationStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  consultationFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  consultationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consultationDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  // Prescription Card Styles
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prescriptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  prescriptionDoctor: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  prescriptionDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  prescriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prescriptionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  prescriptionExpiry: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  buyAgainBtn: {
    backgroundColor: '#0D1B3A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Reminders Styles
  remindersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  reminderText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  emptyReminder: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyReminderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Doctor Dashboard Styles
  doctorStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  doctorStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorStatIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  doctorStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  // Appointment Card Styles
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4F46E5',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  appointmentReason: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  appointmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  appointmentFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  declineBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  startConsultationBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  startConsultationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Doctor Prescription Card
  docPrescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  docPrescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docPrescriptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docPrescriptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docPrescriptionPatient: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  docPrescriptionDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  docPrescriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docPrescriptionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  // New Booking Styles
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  newBookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  newBookingIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  newBookingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  newBookingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});
