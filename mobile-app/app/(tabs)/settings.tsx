import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    darkMode: false,
    biometricLogin: false,
    locationServices: true,
    dataSaving: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const handleChangePassword = () => {
    router.push('/forgot-password');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'View our privacy policy at medicata.com/privacy');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'View our terms at medicata.com/terms');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#4a90e2" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e2e8f0', true: '#4a90e2' }}
        thumbColor="#fff"
      />
    </View>
  );

  const ActionItem = ({ icon, title, subtitle, onPress, danger }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={22} color={danger ? '#ef4444' : '#4a90e2'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            value={settings.pushNotifications}
            onToggle={(v: boolean) => updateSetting('pushNotifications', v)}
          />
          <SettingItem
            icon="mail"
            title="Email Notifications"
            subtitle="Receive updates via email"
            value={settings.emailNotifications}
            onToggle={(v: boolean) => updateSetting('emailNotifications', v)}
          />
          <SettingItem
            icon="chatbubble"
            title="WhatsApp Notifications"
            subtitle="Receive updates via WhatsApp"
            value={settings.whatsappNotifications}
            onToggle={(v: boolean) => updateSetting('whatsappNotifications', v)}
          />
          <SettingItem
            icon="phone-portrait"
            title="SMS Notifications"
            subtitle="Receive text messages"
            value={settings.smsNotifications}
            onToggle={(v: boolean) => updateSetting('smsNotifications', v)}
          />
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Enable dark theme"
            value={settings.darkMode}
            onToggle={(v: boolean) => updateSetting('darkMode', v)}
          />
          <SettingItem
            icon="wifi"
            title="Data Saving"
            subtitle="Reduce data usage"
            value={settings.dataSaving}
            onToggle={(v: boolean) => updateSetting('dataSaving', v)}
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingItem
            icon="finger-print"
            title="Biometric Login"
            subtitle="Use fingerprint or face ID"
            value={settings.biometricLogin}
            onToggle={(v: boolean) => updateSetting('biometricLogin', v)}
          />
          <SettingItem
            icon="location"
            title="Location Services"
            subtitle="Allow location access"
            value={settings.locationServices}
            onToggle={(v: boolean) => updateSetting('locationServices', v)}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ActionItem
            icon="key"
            title="Change Password"
            subtitle="Update your password"
            onPress={handleChangePassword}
          />
          <ActionItem
            icon="document-text"
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <ActionItem
            icon="shield-checkmark"
            title="Terms of Service"
            onPress={handleTermsOfService}
          />
          <ActionItem
            icon="trash"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Medicata v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#fef2f2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  dangerText: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
