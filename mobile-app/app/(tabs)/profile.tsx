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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);

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
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await api.logout();
        await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_role']);
        router.replace('/login');
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await api.logout(); // Clear the API service token cleanly
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await api.updateProfilePhoto(base64Image);
        
        if (response.error) {
          Alert.alert('Error', response.error);
        } else {
          // Update local user data
          const updatedUser = { ...userData, profile_photo: base64Image };
          setUserData(updatedUser);
          await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
          Alert.alert('Success', 'Profile photo updated');
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
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
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#2563EB" />
            ) : (userData?.profile_photo || profileData?.profile_photo) ? (
              <Image 
                source={{ uri: userData?.profile_photo || profileData?.profile_photo }} 
                style={styles.avatarImage} 
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person-circle" size={80} color="#CBD5E1" />
            )}
            <View style={styles.editPhotoBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
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
                  <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={16} color="#fff" />
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
                <Ionicons name="close" size={16} color="#64748b" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Wallet Section */}
        {!isEditing && (
          <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/wallet')}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.walletGradient}>
               <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Medicata Wallet</Text>
                  <Text style={styles.walletBalance}>₦{(profileData?.wallet_balance || 0).toLocaleString()}</Text>
               </View>
               <View style={styles.walletAction}>
                  <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
               </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

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

        {/* Quick Links Section */}
        {!isEditing && (
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.linkItem} onPress={() => router.push('/records')}>
              <View style={[styles.linkIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="medical" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.linkLabel}>Records</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkItem} onPress={() => router.push('/orders')}>
              <View style={[styles.linkIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="cart" size={20} color="#10B981" />
              </View>
              <Text style={styles.linkLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkItem}>
              <View style={[styles.linkIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="help-circle" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.linkLabel}>Support</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#2563EB',
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  role: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  healthInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  healthCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  healthLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 32,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  walletCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  walletGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  walletAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  linkItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
});

