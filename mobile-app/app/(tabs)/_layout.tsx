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

const CustomTabBar = (props: BottomTabBarProps) => {
  return <BottomTabBar {...props} style={(props as any).style} />;
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

    let role = await AsyncStorage.getItem('user_role');
    if (!role) {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        role = user?.role?.toLowerCase() || null;
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

  const commonTabOptions = {
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      height: Platform.OS === 'ios' ? 96 : 76,
      paddingBottom: Platform.OS === 'ios' ? 38 : 16,
      paddingTop: 10,
      elevation: 0,
    },
    tabBarActiveTintColor: '#2563EB',
    tabBarInactiveTintColor: '#94A3B8',
    tabBarLabelStyle: {
      fontWeight: '800' as const,
      fontSize: 9,
    },
    headerShown: false,
    tabBarButton: HapticTab,
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={commonTabOptions}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isPharmacy ? 'Home' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? (isPharmacy ? 'business' : 'home') : (isPharmacy ? 'business-outline' : 'home-outline')}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: isPharmacy ? 'Orders' : isDoctor ? 'Appts' : 'Visits',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? (isPharmacy ? 'cart' : 'calendar') : (isPharmacy ? 'cart-outline' : 'calendar-outline')}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          href: isPharmacy ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={20} 
              name={focused ? "qr-code" : "qr-code-outline"} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: isPharmacy ? 'Stock' : isDoctor ? 'Patients' : 'Records',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? 
                (isPharmacy ? 'cube' : isDoctor ? 'people' : 'folder') : 
                (isPharmacy ? 'cube-outline' : isDoctor ? 'people-outline' : 'folder-outline')
              }
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={20}
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
