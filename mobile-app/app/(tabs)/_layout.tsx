import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CustomTabBar = (props: BottomTabBarProps & { pointerEvents?: any }) => {
  const { ...rest } = props as any;
  const pointerEvents = rest.pointerEvents;
  delete rest.pointerEvents;
  return <BottomTabBar {...rest} style={[rest.style, { pointerEvents: pointerEvents || 'auto' }]} />;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Try the dedicated key first (set on login/register)
    let role = await AsyncStorage.getItem('user_role');

    // Fallback: read from user_data JSON (covers existing logged-in sessions)
    if (!role) {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        role = user?.role?.toLowerCase() || null;
        // Backfill the key so future reads are fast
        if (role) {
          await AsyncStorage.setItem('user_role', role);
        }
      }
    }

    setUserRole(role?.toLowerCase() || 'patient');
    setLoading(false);
  };

  if (loading) return null;

  const isPharmacy = userRole === 'pharmacy';
  const isDoctor = userRole === 'doctor';

  console.log('[Tab Layout] Current Role:', userRole, 'isDoctor:', isDoctor);

  const doctorTabOptions = {
    tabBarStyle: {
      backgroundColor: '#0D1B3A',
      borderTopWidth: 0,
      height: Platform.OS === 'ios' ? 88 : 70,
      paddingBottom: Platform.OS === 'ios' ? 30 : 12,
      paddingTop: 10,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    tabBarActiveTintColor: '#fff',
    tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
    tabBarLabelStyle: {
      fontWeight: '700' as const,
      fontSize: 11,
    },
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: isDoctor ? '#fff' : Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        ...(isDoctor ? doctorTabOptions : {}),
      }}
    >
      {/* ── HOME / DASHBOARD ─────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: isPharmacy ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={24}
              name={isPharmacy ? 'business-outline' : 'home-outline'}
              color={color}
            />
          ),
        }}
      />

      {/* ── ORDERS (pharmacy) / APPOINTMENTS (doctor) / VISITS (patient) ── */}
      <Tabs.Screen
        name="explore"
        options={{
          title: isPharmacy ? 'Orders' : isDoctor ? 'Appointments' : 'Visits',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={24}
              name={isPharmacy ? 'cart-outline' : 'calendar-outline'}
              color={color}
            />
          ),
        }}
      />

      {/* ── DISPENSE (pharmacy-only) ──────────────────────── */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Dispense',
          // Hide for non-pharmacy roles
          href: isPharmacy ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="qr-code-outline" color={color} />,
        }}
      />

      {/* ── STOCK (pharmacy) / PATIENTS (doctor) / RECORDS (patient) ── */}
      <Tabs.Screen
        name="two"
        options={{
          title: isPharmacy ? 'Stock' : isDoctor ? 'Patients' : 'Records',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={24}
              name={
                isPharmacy ? 'cube-outline' : isDoctor ? 'people-outline' : 'folder-outline'
              }
              color={color}
            />
          ),
        }}
      />

      {/* ── MESSAGES TAB ─────────────────────────────── */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={24}
              name="chatbubbles-outline"
              color={color}
            />
          ),
        }}
      />

      {/* ── PROFILE ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={24}
              name="person-outline"
              color={color}
            />
          ),
        }}
      />

      {/* Hide redundant/cluttered tabs */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
