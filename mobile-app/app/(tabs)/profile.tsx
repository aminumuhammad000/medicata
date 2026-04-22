import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('user_data');
      const storedRole = await AsyncStorage.getItem('user_role');
      
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
      if (storedRole) {
        setUserRole(storedRole.toLowerCase());
      }
      
      const profile = await api.getMyProfile();
      const data = profile.data || profile;
      setProfileData(data);
      
      // Set form data based on role
      if (storedRole?.toLowerCase() === 'doctor') {
        setFormData({
          bio: data?.bio || '',
          specialty: data?.specialty || '',
          years_of_experience: data?.years_of_experience?.toString() || '',
          clinic_hospital_affiliation: data?.clinic_hospital_affiliation || '',
          languages_spoken: data?.languages_spoken || '',
        });
      } else if (storedRole?.toLowerCase() === 'pharmacy') {
        setFormData({
          pharmacy_name: data?.pharmacy_name || data?.full_name || '',
          pharmacy_address: data?.pharmacy_address || '',
          pharmacy_license: data?.pharmacy_license || '',
          opening_hours: data?.opening_hours || '',
          pharmacy_contact_info: data?.pharmacy_contact_info || data?.phone_number || '',
        });
      } else {
        // Patient - include health info from signup
        setFormData({
          bio: data?.bio || '',
          height: data?.height?.toString() || data?.height_cm?.toString() || '',
          weight: data?.weight?.toString() || data?.weight_kg?.toString() || '',
          body_type: data?.body_type || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (userRole === 'doctor') {
        await api.updateDoctorProfile({
          bio: formData.bio,
          specialty: formData.specialty,
          years_of_experience: parseInt(formData.years_of_experience) || 0,
          clinic_hospital_affiliation: formData.clinic_hospital_affiliation,
          languages_spoken: formData.languages_spoken,
        });
      } else if (userRole === 'pharmacy') {
        await api.updatePharmacyProfile({
          pharmacy_name: formData.pharmacy_name,
          pharmacy_address: formData.pharmacy_address,
          pharmacy_license: formData.pharmacy_license,
          opening_hours: formData.opening_hours,
          pharmacy_contact_info: formData.pharmacy_contact_info,
        });
      } else {
        // Patient - save health info
        await api.updatePatientHealthInfo({
          bio: formData.bio,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          body_type: formData.body_type,
        });
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      await loadUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'auth_token',
              'user_data',
              'user_role',
            ]);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderField = (label: string, value: string, key: string, editable: boolean = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={formData[key] || ''}
          onChangeText={(text) => setFormData({ ...formData, [key]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#94a3b8"
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
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

  const displayData = profileData || userData || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#4a90e2" />
          </View>
          <Text style={styles.name}>{displayData.full_name || displayData.name || 'User'}</Text>
          <Text style={styles.role}>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Patient'}</Text>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.editButton, isEditing && styles.saveButton]}
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={18} color="#fff" />
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'Save' : 'Edit Profile'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {isEditing && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  loadUserData();
                }}
              >
                <Ionicons name="close" size={18} color="#64748b" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderField('Full Name', displayData.full_name || displayData.name || '', 'full_name', false)}
          {renderField('Email', displayData.email || '', 'email', false)}
          {renderField('Phone', displayData.phone_number || displayData.phone || '', 'phone')}
        </View>

        {/* Role-specific Info */}
        {userRole === 'patient' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Information</Text>
            <View style={styles.healthInfoRow}>
              <View style={styles.healthCard}>
                <Ionicons name="resize" size={24} color="#4a90e2" />
                <Text style={styles.healthValue}>{formData.height || '--'} cm</Text>
                <Text style={styles.healthLabel}>Height</Text>
              </View>
              <View style={styles.healthCard}>
                <Ionicons name="scale" size={24} color="#4a90e2" />
                <Text style={styles.healthValue}>{formData.weight || '--'} kg</Text>
                <Text style={styles.healthLabel}>Weight</Text>
              </View>
              <View style={styles.healthCard}>
                <Ionicons name="body" size={24} color="#4a90e2" />
                <Text style={styles.healthValue}>{formData.body_type || '--'}</Text>
                <Text style={styles.healthLabel}>Body Type</Text>
              </View>
            </View>
            
            {isEditing && (
              <>
                {renderField('Height (cm)', formData.height, 'height')}
                {renderField('Weight (kg)', formData.weight, 'weight')}
                {renderField('Body Type', formData.body_type, 'body_type')}
              </>
            )}
            
            {renderField('Bio', formData.bio, 'bio')}
          </View>
        )}

        {userRole === 'doctor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            {renderField('Specialty', formData.specialty, 'specialty')}
            {renderField('Years of Experience', formData.years_of_experience, 'years_of_experience')}
            {renderField('Hospital/Clinic', formData.clinic_hospital_affiliation, 'clinic_hospital_affiliation')}
            {renderField('Languages', formData.languages_spoken, 'languages_spoken')}
            {renderField('Bio', formData.bio, 'bio')}
          </View>
        )}

        {userRole === 'pharmacy' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pharmacy Information</Text>
            {renderField('Pharmacy Name', formData.pharmacy_name, 'pharmacy_name')}
            {renderField('Address', formData.pharmacy_address, 'pharmacy_address')}
            {renderField('License', formData.pharmacy_license, 'pharmacy_license')}
            {renderField('Opening Hours', formData.opening_hours, 'opening_hours')}
            {renderField('Contact Info', formData.pharmacy_contact_info, 'pharmacy_contact_info')}
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  healthInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  healthCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

