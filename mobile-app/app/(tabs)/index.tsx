import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
// RefreshControl is now imported from react-native above
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function HomeScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentConsultation, setRecentConsultation] = useState<any>(null);
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [recentPrescription, setRecentPrescription] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [stats, setStats] = useState<any>({
    today: 0,
    pending: 0,
    earnings: 0,
    total: 0,
    revenue: 0,
    pendingOrders: 0,
    activePrescriptions: 0
  });

  useEffect(() => {
    // Initial load
    loadDashboardData();
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    try {
      if (Platform.OS === 'web') {
        console.log('Push notifications are not supported on web.');
        return;
      }
      
      // Dynamically import to avoid crashing in Expo Go (SDK 53+)
      const Device = require('expo-device');
      const Constants = require('expo-constants').default;

      // Skip if not a real device or running in Expo Go
      if (!Device.isDevice || Constants.appOwnership === 'expo') {
        console.log('Skipping push notifications: Expo Go or simulator detected');
        return;
      }

      const Notifications = require('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      console.log('Push Token:', token);
      await api.savePushToken(token);
    } catch (error) {
      console.log('Push notifications not available:', error);
    }
  }

  // Use a navigation focus hook logic instead
  const navigation = Platform.OS !== 'web' ? require('@react-navigation/native').useNavigation() : null;
  
  useEffect(() => {
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchData(); // Refresh everything when screen comes into focus
      });
      return unsubscribe;
    }
  }, [navigation]);

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
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [calendarMonth, setCalendarMonth] = React.useState(new Date());

    const [activeTab, setActiveTab] = useState<'activity' | 'consults' | 'orders' | 'prescriptions' | 'reminders'>('activity');

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['S','M','T','W','T','F','S'];
    const today = new Date();

    const getCalendarDays = () => {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: (number | null)[] = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let d = 1; d <= daysInMonth; d++) days.push(d);
      return days;
    };

    const prevMonth = () => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    const nextMonth = () => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

    const isToday = (d: number) => {
      return d === today.getDate() && calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear();
    };
    const isSelected = (d: number) => {
      return d === selectedDate.getDate() && calendarMonth.getMonth() === selectedDate.getMonth() && calendarMonth.getFullYear() === selectedDate.getFullYear();
    };

    const hasAppointment = (d: number) => {
      if (!recentConsultation?.scheduled_at) return false;
      const apptDate = new Date(recentConsultation.scheduled_at);
      return d === apptDate.getDate() && calendarMonth.getMonth() === apptDate.getMonth() && calendarMonth.getFullYear() === apptDate.getFullYear();
    };


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

    const dashboardTabs = [
      { id: 'activity', name: 'Activity', icon: 'flash' },
      { id: 'consults', name: 'Waitlist', icon: 'people' },
      { id: 'orders', name: 'Orders', icon: 'cart' },
      { id: 'prescriptions', name: 'Scripts', icon: 'receipt' },
      { id: 'reminders', name: 'Alerts', icon: 'notifications' },
    ];

    return (
      <View style={{ flex: 1 }}>

        {/* Calendar Modal */}
        {showCalendar && (
          <View style={styles.calendarOverlay}>
            <TouchableOpacity style={styles.calendarBackdrop} onPress={() => setShowCalendar(false)} />
            <View style={styles.calendarSheet}>
              <View style={styles.calendarHandle} />
              <View style={styles.calendarNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                  <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                  <Ionicons name="chevron-forward" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <View style={styles.calDayRow}>
                {dayNames.map((d, i) => (
                  <Text key={i} style={styles.calDayName}>{d}</Text>
                ))}
              </View>
              <View style={styles.calGrid}>
                {getCalendarDays().map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.calDayCell}
                    onPress={() => {
                      if (d) {
                        setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
                        setShowCalendar(false);
                      }
                    }}
                    disabled={!d}
                  >
                    {d ? (
                      <View style={[
                        styles.calDayNum,
                        isSelected(d) && styles.calDaySelected,
                        !isSelected(d) && isToday(d) && styles.calDayToday,
                      ]}>
                        <Text style={[
                          styles.calDayText,
                          isSelected(d) && styles.calDayTextSelected,
                          !isSelected(d) && isToday(d) && styles.calDayTextToday,
                        ]}>{d}</Text>
                        {hasAppointment(d) && !isSelected(d) && <View style={styles.calApptDot} />}
                      </View>
                    ) : <View style={styles.calDayNum} />}
                  </TouchableOpacity>
                ))}
              </View>
              {recentConsultation?.scheduled_at && (
                <View style={styles.calLegend}>
                  <View style={styles.calLegendDot} />
                  <Text style={styles.calLegendText}>Upcoming appointment</Text>
                </View>
              )}
              <TouchableOpacity style={styles.calTodayBtn} onPress={() => { setCalendarMonth(new Date()); setSelectedDate(new Date()); setShowCalendar(false); }}>
                <Text style={styles.calTodayBtnText}>Go to Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hi, {userData?.full_name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.greetingDate}>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.headerRightClose}>
            <TouchableOpacity
              style={styles.notifBtnSmall}
              onPress={() => router.push('/bookings/search')}
            >
              <Ionicons name="search" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notifBtnSmall}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications" size={16} color="#0F172A" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadgeSmall}>
                  <Text style={styles.notifBadgeTextSmall}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notifBtnSmall}
              onPress={() => router.push('/pharmacy/cart' as any)}
            >
              <Ionicons name="cart" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Services Icons */}
        <View style={styles.section}>
          <View style={styles.servicesRow}>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/bookings/search')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F0F7FF' }]}>
                <Ionicons name="medical" size={18} color="#2563EB" />
              </View>
              <Text style={styles.serviceLabel}>Book</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/orders')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F0FDF4' }]}>
                {stats.pendingOrders > 0 && (
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{stats.pendingOrders}</Text>
                  </View>
                )}
                <Ionicons name="cart" size={18} color="#16A34A" />
              </View>
              <Text style={styles.serviceLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/prescriptions')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#EEF2FF' }]}>
                {stats.activePrescriptions > 0 && (
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{stats.activePrescriptions}</Text>
                  </View>
                )}
                <Ionicons name="receipt" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.serviceLabel}>Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/medi-chat')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </View>
              <Text style={styles.serviceLabel}>AI Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/wallet')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="wallet" size={18} color="#9333EA" />
              </View>
              <Text style={styles.serviceLabel}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/patient/reminders')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alarm" size={18} color="#DC2626" />
              </View>
              <Text style={styles.serviceLabel}>Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        {/* Horizontal Category Chips */}
        <View style={styles.sectionCompact}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/bookings/search', params: { specialty: cat.name } })}
              >
                <View style={styles.catIconBg}>
                  <Ionicons name={cat.icon as any} size={14} color="#3B82F6" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Inner Dashboard Navigation System */}
        <View style={styles.dashboardNavContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dashboardNavScroll}>
            {dashboardTabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.dashboardNavTab, activeTab === tab.id && styles.dashboardNavTabActive]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={14} 
                  color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} 
                />
                <Text style={[styles.dashboardNavTabText, activeTab === tab.id && styles.dashboardNavTabTextActive]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Content Display */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'activity' && (
            <View>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              {recentConsultation ? (
                <TouchableOpacity
                  style={styles.appointmentCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/explore')}
                >
                  <View style={[
                    styles.appointmentAccent,
                    { backgroundColor: (recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') ? '#3B82F6' : '#10B981' }
                  ]} />
                  <View style={styles.appointmentBody}>
                    <View style={styles.appointmentTopRow}>
                      <View style={[styles.appointmentAvatarCircle, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.appointmentAvatarText, { color: '#3B82F6' }]}>
                          {(recentConsultation.doctor_name || 'D').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentPatientName}>
                          {recentConsultation.doctor_name ? `Dr. ${recentConsultation.doctor_name}` : 'Doctor'}
                        </Text>
                        <Text style={styles.appointmentReason} numberOfLines={1}>
                          {recentConsultation.reason || 'General Consultation'}
                        </Text>
                      </View>
                      <View style={[styles.appointmentStatusBadge, {
                        backgroundColor: (recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') ? '#EFF6FF' : '#ECFDF5'
                      }]}>
                        <Text style={[styles.appointmentStatusText, {
                          color: (recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') ? '#1D4ED8' : '#059669'
                        }]}>
                          {(recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') ? '● Upcoming' : '● Done'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.appointmentChipsRow}>
                      <View style={styles.appointmentChip}>
                        <Ionicons name="calendar-outline" size={12} color="#64748B" />
                        <Text style={styles.appointmentChipText}>
                          {recentConsultation.scheduled_at
                            ? new Date(recentConsultation.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : 'Date TBD'}
                        </Text>
                      </View>
                      <View style={styles.appointmentChip}>
                        <Ionicons name="time-outline" size={12} color="#64748B" />
                        <Text style={styles.appointmentChipText}>
                          {recentConsultation.scheduled_at
                            ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Time TBD'}
                        </Text>
                      </View>
                      {recentConsultation.mode && (
                        <View style={styles.appointmentChip}>
                          <Ionicons
                            name={recentConsultation.mode === 'video' ? 'videocam-outline' : recentConsultation.mode === 'audio' ? 'call-outline' : 'chatbubbles-outline'}
                            size={12}
                            color="#64748B"
                          />
                          <Text style={styles.appointmentChipText}>
                            {recentConsultation.mode?.charAt(0).toUpperCase() + recentConsultation.mode?.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ justifyContent: 'center', paddingRight: 14 }}>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyActivityCard}>
                  <Ionicons name="flash-outline" size={32} color="#E2E8F0" />
                  <Text style={styles.emptyActivityText}>No recent activity yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'consults' && (
            <View>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionTitle}>Consultations</Text>
                <TouchableOpacity onPress={() => router.push('/explore' as any)}>
                  <Text style={styles.seeAll}>History</Text>
                </TouchableOpacity>
              </View>
              {recentConsultation ? (
                <TouchableOpacity
                  style={styles.appointmentCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: recentConsultation.id } } as any)}
                >
                  <View style={[
                    styles.appointmentAccent,
                    { backgroundColor: recentConsultation.status === 'completed' ? '#10B981' : '#F59E0B' }
                  ]} />
                  <View style={styles.appointmentBody}>
                    <View style={styles.appointmentTopRow}>
                      <View style={[styles.appointmentAvatarCircle, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={[styles.appointmentAvatarText, { color: '#4F46E5' }]}>
                          {(recentConsultation.doctor_name || 'D').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentPatientName}>
                          {recentConsultation.doctor_name ? `Dr. ${recentConsultation.doctor_name}` : 'Doctor'}
                        </Text>
                        <Text style={styles.appointmentReason} numberOfLines={1}>
                          {recentConsultation.specialty || recentConsultation.reason || 'General Consultation'}
                        </Text>
                      </View>
                      <View style={[styles.appointmentStatusBadge, {
                        backgroundColor: recentConsultation.status === 'completed' ? '#ECFDF5' : '#FFFBEB'
                      }]}>
                        <Text style={[styles.appointmentStatusText, {
                          color: recentConsultation.status === 'completed' ? '#059669' : '#D97706'
                        }]}>
                          {recentConsultation.status === 'completed' ? '● Done' : '● Pending'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.appointmentChipsRow}>
                      <View style={styles.appointmentChip}>
                        <Ionicons name="calendar-outline" size={12} color="#64748B" />
                        <Text style={styles.appointmentChipText}>
                          {recentConsultation.scheduled_at
                            ? new Date(recentConsultation.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Date TBD'}
                        </Text>
                      </View>
                      <View style={styles.appointmentChip}>
                        <Ionicons name="time-outline" size={12} color="#64748B" />
                        <Text style={styles.appointmentChipText}>
                          {recentConsultation.scheduled_at
                            ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Time TBD'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ justifyContent: 'center', paddingRight: 14 }}>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyActivityCard}>
                  <Ionicons name="calendar-outline" size={32} color="#E2E8F0" />
                  <Text style={styles.emptyActivityText}>No pending consults</Text>
                  <TouchableOpacity 
                    style={styles.orderNowBtn}
                    onPress={() => router.push('/bookings/search')}
                  >
                    <Text style={styles.orderNowBtnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'orders' && (
            <View>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionTitle}>My Orders</Text>
                <TouchableOpacity onPress={() => router.push('/orders' as any)}>
                  <Text style={styles.seeAll}>View All</Text>
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
                    <Text style={styles.orderNowBtnText}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'prescriptions' && (
            <View>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionTitle}>Prescriptions</Text>
                <TouchableOpacity onPress={() => router.push('/prescriptions' as any)}>
                  <Text style={styles.seeAll}>History</Text>
                </TouchableOpacity>
              </View>
              {recentPrescription ? (
                <TouchableOpacity 
                  style={styles.prescriptionCard}
                  onPress={() => router.push({ pathname: '/prescriptions/[id]', params: { id: recentPrescription.id } } as any)}
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
                  </View>
                  <View style={styles.prescriptionFooter}>
                    <Text style={styles.prescriptionExpiry}>
                      Expires: {new Date(recentPrescription.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyActivityCard}>
                  <Ionicons name="document-text-outline" size={32} color="#E2E8F0" />
                  <Text style={styles.emptyActivityText}>No scripts found</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'reminders' && (
            <View>
              <View style={styles.sectionHeaderCompact}>
                <Text style={styles.sectionTitle}>Upcoming Alerts</Text>
              </View>
              <View style={styles.remindersCard}>
                {recentConsultation && (recentConsultation.status === 'scheduled' || recentConsultation.status === 'pending') && (
                  <View style={styles.reminderItem}>
                    <View style={[styles.reminderIcon, { backgroundColor: '#EEF2FF' }]}>
                      <Ionicons name="calendar" size={18} color="#4F46E5" />
                    </View>
                    <View style={styles.reminderInfo}>
                      <Text style={styles.reminderTitle}>Appointment</Text>
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
                      <Text style={styles.reminderTitle}>Expiring Script</Text>
                      <Text style={styles.reminderText}>Expires in {Math.ceil((new Date(recentPrescription.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</Text>
                    </View>
                  </View>
                )}
                {(!recentConsultation || recentConsultation.status === 'completed') && (!recentPrescription || new Date(recentPrescription.expiry_date) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) && (
                  <View style={styles.emptyReminder}>
                    <Ionicons name="notifications-off-outline" size={24} color="#CBD5E1" />
                    <Text style={styles.emptyReminderText}>No alerts</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Doctor Dashboard
  const DoctorDashboard = () => {
    const doctorStats = [
      { label: 'Today', value: stats.today || '0', icon: 'today', color: '#3B82F6', bg: '#EFF6FF' },
      { label: 'Pending', value: stats.pending || '0', icon: 'time', color: '#F59E0B', bg: '#FFF7ED' },
      { label: 'Total Appts', value: stats.total || '0', icon: 'calendar', color: '#8B5CF6', bg: '#F5F3FF' },
    ];

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hi, Dr. {userData?.full_name?.split(' ')[0] || 'Doctor'}</Text>
          </View>
          <View style={styles.headerRightClose}>
            <TouchableOpacity 
              style={[styles.notifBtnSmall, { width: 'auto', paddingHorizontal: 10, flexDirection: 'row', gap: 4 }]}
              onPress={() => router.push('/wallet' as any)}
            >
              <Ionicons name="wallet-outline" size={16} color="#10B981" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                ₦{(stats.earnings || 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notifBtnSmall}
              onPress={() => router.push('/bookings/search')}
            >
              <Ionicons name="search" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notifBtnSmall}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications" size={16} color="#0F172A" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadgeSmall}>
                  <Text style={styles.notifBadgeTextSmall}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Alert for Doctors */}
        {!userData?.is_verified && (
          <TouchableOpacity 
            style={[
              styles.verificationAlert, 
              userData?.verification_status === 'pending' && { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }
            ]}
            onPress={() => userData?.verification_status !== 'pending' && router.push('/doctor/verification' as any)}
            disabled={userData?.verification_status === 'pending'}
          >
            <View style={[
              styles.alertIconBg,
              userData?.verification_status === 'pending' && { backgroundColor: '#FFEDD5' }
            ]}>
              <Ionicons 
                name={userData?.verification_status === 'pending' ? "time-outline" : "shield-outline"} 
                size={24} 
                color={userData?.verification_status === 'pending' ? "#D97706" : "#EF4444"} 
              />
            </View>
            <View style={styles.alertContent}>
              <Text style={[
                styles.alertTitle,
                userData?.verification_status === 'pending' && { color: '#92400E' }
              ]}>
                {userData?.verification_status === 'pending' ? 'Verification Pending' : 'Account Not Verified'}
              </Text>
              <Text style={[
                styles.alertDescription,
                userData?.verification_status === 'pending' && { color: '#B45309' }
              ]}>
                {userData?.verification_status === 'pending' 
                  ? 'Your documents are being reviewed by our medical board.' 
                  : 'Upload your medical license to unlock full features.'}
              </Text>
            </View>
            {userData?.verification_status !== 'pending' && (
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            )}
          </TouchableOpacity>
        )}

        {/* Doctor Stats Grid */}
        <View style={styles.doctorStatsRow}>
          {doctorStats.map((s, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.doctorStatCard}
              onPress={() => s.label === 'Earnings' && router.push('/wallet' as any)}
            >
              <View style={[styles.doctorStatIconBg, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.doctorStatValue}>{s.value}</Text>
              <Text style={styles.doctorStatLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Appointments Section */}
        <View style={styles.sectionCompact}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionTitle}>Agenda for Today</Text>
            <TouchableOpacity onPress={() => router.push('/bookings/search')}>
              <Text style={styles.seeAll}>Schedule</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.walletQuickCard}
            onPress={() => router.push('/wallet' as any)}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.walletGradient}
            >
              <View style={styles.walletLeft}>
                <View style={styles.walletIconCircle}>
                  <Ionicons name="wallet" size={18} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.walletTitle}>My Wallet</Text>
                  <Text style={styles.walletSubtitle}>Manage earnings & withdrawals</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFF" opacity={0.6} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionSmallTitle}>Medical Tools</Text>
          <View style={styles.servicesRow}>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/doctor/schedule/manage')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="calendar-clear" size={18} color="#0EA5E9" />
              </View>
              <Text style={styles.serviceLabel}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/explore')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="calendar" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.serviceLabel}>Appointments</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/messages')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="chatbubbles" size={18} color="#D97706" />
              </View>
              <Text style={styles.serviceLabel}>Chats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/medi-chat')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="sparkles" size={18} color="#9333EA" />
              </View>
              <Text style={styles.serviceLabel}>AI Tools</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/doctor/prescription/create')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="document" size={18} color="#22C55E" />
              </View>
              <Text style={styles.serviceLabel}>New Rx</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => router.push('/explore')}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="people" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.serviceLabel}>Patients</Text>
            </TouchableOpacity>
          </View>
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
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/consultations/desk/[id]', params: { id: recentConsultation.id } } as any)}
            >
              {/* Left accent stripe */}
              <View style={[
                styles.appointmentAccent,
                { backgroundColor: recentConsultation.status === 'scheduled' ? '#10B981' : '#F59E0B' }
              ]} />

              <View style={styles.appointmentBody}>
                {/* Top row: avatar + name + status */}
                <View style={styles.appointmentTopRow}>
                  <View style={styles.appointmentAvatarCircle}>
                    <Text style={styles.appointmentAvatarText}>
                      {(recentConsultation.patient_name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentPatientName}>
                      {recentConsultation.patient_name || 'Patient'}
                    </Text>
                    <Text style={styles.appointmentReason} numberOfLines={1}>
                      {recentConsultation.reason || 'General Consultation'}
                    </Text>
                  </View>
                  <View style={[styles.appointmentStatusBadge, {
                    backgroundColor: recentConsultation.status === 'scheduled' ? '#DCFCE7' : '#FEF3C7'
                  }]}>
                    <Text style={[styles.appointmentStatusText, {
                      color: recentConsultation.status === 'scheduled' ? '#166534' : '#92400E'
                    }]}>
                      {recentConsultation.status === 'scheduled' ? '● Scheduled' : '● Pending'}
                    </Text>
                  </View>
                </View>

                {/* Meta chips row */}
                <View style={styles.appointmentChipsRow}>
                  <View style={styles.appointmentChip}>
                    <Ionicons name="time-outline" size={12} color="#64748B" />
                    <Text style={styles.appointmentChipText}>
                      {recentConsultation.scheduled_at
                        ? new Date(recentConsultation.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'TBD'}
                    </Text>
                  </View>
                  <View style={styles.appointmentChip}>
                    <Ionicons
                      name={recentConsultation.mode === 'video' ? 'videocam-outline' : recentConsultation.mode === 'audio' ? 'call-outline' : 'chatbubbles-outline'}
                      size={12}
                      color="#64748B"
                    />
                    <Text style={styles.appointmentChipText}>
                      {recentConsultation.mode?.charAt(0).toUpperCase() + (recentConsultation.mode?.slice(1) || '') || 'Video'}
                    </Text>
                  </View>
                  <View style={styles.appointmentChip}>
                    <Ionicons name="calendar-outline" size={12} color="#64748B" />
                    <Text style={styles.appointmentChipText}>
                      {recentConsultation.scheduled_at
                        ? new Date(recentConsultation.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : 'Today'}
                    </Text>
                  </View>
                </View>

                {/* Join button */}
                {['video', 'audio'].includes(recentConsultation.mode?.toLowerCase()) &&
                 ['scheduled', 'accepted', 'admitted'].includes(recentConsultation.status?.toLowerCase()) && (
                  <TouchableOpacity
                    style={styles.joinVideoBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/consultation/video',
                        params: { consultationId: recentConsultation.id, mode: recentConsultation.mode }
                      } as any);
                    }}
                  >
                    <Ionicons
                      name={recentConsultation.mode === 'audio' ? 'call' : 'videocam'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.joinVideoBtnText}>
                      Join {recentConsultation.mode === 'audio' ? 'Audio' : 'Video'} Call
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyActivityText}>No appointments for today</Text>
            </View>
          )}
        </View>
      </View>
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
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hi, {userData?.pharmacy_name?.split(' ')[0] || userData?.full_name?.split(' ')[0] || 'Pharmacy'}</Text>
          </View>
          <View style={styles.headerRightClose}>
            <TouchableOpacity 
              style={styles.notifBtnSmall}
              onPress={() => router.push('/explore' as any)}
            >
              <Ionicons name="search" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notifBtnSmall}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications" size={16} color="#0F172A" />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadgeSmall}>
                  <Text style={styles.notifBadgeTextSmall}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notifBtnSmall}
              onPress={() => router.push('/profile' as any)}
            >
              <Ionicons name="business" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Completion Prompt */}
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
                <Ionicons name="rocket-outline" size={22} color="#F59E0B" />
              </View>
              <View style={styles.setupInfo}>
                <Text style={styles.setupTitle}>Complete your setup</Text>
                <Text style={styles.setupSubTitle}>Fill in your business details to start receiving orders.</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {pharmacyStats.map((s, i) => (
            <View key={i} style={[styles.statCard, styles.pharmacyStatCard]}>
              <View style={[styles.statIconCircle, { backgroundColor: `${s.color}22` }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* New Prescriptions */}
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
                  <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionSmallTitle}>Business Tools</Text>
          <View style={styles.servicesRow}>
            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => router.push('/explore' as any)}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="cart" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.serviceLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => router.push('/(tabs)/scan' as any)}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="qr-code" size={18} color="#10B981" />
              </View>
              <Text style={styles.serviceLabel}>Dispense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => router.push('/(tabs)/two' as any)}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="cube" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.serviceLabel}>Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItem}
              onPress={() => router.push('/(tabs)/reputation' as any)}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="bar-chart" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.serviceLabel}>Insights</Text>
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
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subGreeting: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profilePic: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    padding: 10,
    borderRadius: 12,
    marginBottom: 24,
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
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
    color: '#0F172A',
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionCompact: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSmallTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAll: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
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
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  serviceItem: {
    alignItems: 'center',
    width: '32%', // Allow wrapping to 3 columns if needed, but flex will try to fit

  },
  serviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  serviceBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  dashboardNavContainer: {
    marginBottom: 20,
  },
  dashboardNavScroll: {
    paddingRight: 24,
    gap: 8,
  },
  dashboardNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dashboardNavTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dashboardNavTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  dashboardNavTabTextActive: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    minHeight: 120,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginLeft: -24,
    paddingLeft: 24,
  },
  categoryCard: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
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
    width: 42,
    height: 42,
    borderRadius: 21,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  patientStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '700',
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderPharmacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderPharmacyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderTotalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  orderTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderNowBtn: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Consultation Card Styles
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  joinVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  joinVideoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  consultationIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consultationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  consultationDoctor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  consultationSpecialty: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  consultationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  consultationStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  consultationFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  consultationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  consultationDetailText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  // Prescription Card Styles
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  prescriptionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  prescriptionDoctor: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  prescriptionDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  prescriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prescriptionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  prescriptionExpiry: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  buyAgainBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
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
  // Verification Alert
  verificationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  alertIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertDescription: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  // Doctor Dashboard Styles
  doctorStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  doctorStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorStatIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  doctorStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '700',
  },
  walletQuickCard: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(79, 70, 229, 0.15)' },
      default: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
      }
    }),
  },
  walletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  walletSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  // Appointment Card Styles
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EEFB',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }
    }),
  },
  appointmentAccent: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  appointmentBody: {
    flex: 1,
    padding: 14,
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  appointmentPatientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  appointmentReason: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  appointmentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  appointmentStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  appointmentChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  appointmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appointmentChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  appointmentFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentDetailText: {
    fontSize: 12,
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
  headerRightClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeSmall: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeTextSmall: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  greetingDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  calendarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  calendarSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  calendarHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  calDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calDayName: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  calDayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calDaySelected: {
    backgroundColor: '#2563EB',
  },
  calDayToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  calDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calDayTextToday: {
    color: '#2563EB',
    fontWeight: '800',
  },
  calApptDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  calLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  calLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  calLegendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  calTodayBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calTodayBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
