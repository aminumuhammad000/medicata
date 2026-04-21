import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('patient');

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user_data');
      const storedRole = await AsyncStorage.getItem('user_role');
      
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
      if (storedRole) {
        setUserRole(storedRole.toLowerCase());
      }
      
      const profile = await api.getMyProfile();
      setProfileData(profile.data || profile);
      
      // Set form data based on role
      if (storedRole?.toLowerCase() === 'doctor') {
        setFormData({
          bio: profile.data?.bio || '',
          specialty: profile.data?.specialty || '',
          years_of_experience: profile.data?.years_of_experience?.toString() || '',
          clinic_hospital_affiliation: profile.data?.clinic_hospital_affiliation || '',
          languages_spoken: profile.data?.languages_spoken || '',
        });
      } else if (storedRole?.toLowerCase() === 'pharmacy') {
        setFormData({
          pharmacy_name: profile.data?.pharmacy_name || '',
          pharmacy_address: profile.data?.pharmacy_address || '',
          pharmacy_license: profile.data?.pharmacy_license || '',
          opening_hours: profile.data?.opening_hours || '',
          pharmacy_contact_info: profile.data?.pharmacy_contact_info || '',
        });
      } else {
        setFormData({
          bio: profile.data?.bio || '',
          height: profile.data?.height?.toString() || '',
          weight: profile.data?.weight?.toString() || '',
          body_type: profile.data?.body_type || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userRole === 'doctor') {
        await api.updateDoctorProfile({
          bio: formData.bio,
          specialty: formData.specialty,
          years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : undefined,
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
        await api.updatePatientProfile({
          bio: formData.bio,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          body_type: formData.body_type,
        });
      }
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      loadUserData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

// Patient Profile Component
function PatientProfile({ profileData, formData, setFormData, editing, setEditing, saving, handleSave }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={20} color="#4a90e2" />
          </TouchableOpacity>
        )}
      </View>

      {editing ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput style={styles.textArea} multiline numberOfLines={3} value={formData.bio} onChangeText={(text) => setFormData({ ...formData, bio: text })} />
          </View>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.height} onChangeText={(text) => setFormData({ ...formData, height: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.weight} onChangeText={(text) => setFormData({ ...formData, weight: text })} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Type</Text>
            <TextInput style={styles.input} value={formData.body_type} onChangeText={(text) => setFormData({ ...formData, body_type: text })} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Height</Text><Text style={styles.infoValue}>{profileData?.height ? `${profileData.height} cm` : 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Weight</Text><Text style={styles.infoValue}>{profileData?.weight ? `${profileData.weight} kg` : 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Body Type</Text><Text style={styles.infoValue}>{profileData?.body_type || 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Bio</Text><Text style={styles.infoValue}>{profileData?.bio || 'Not set'}</Text></View>
        </>
      )}
    </View>
  );
}

// Doctor Profile Component
function DoctorProfile({ profileData, formData, setFormData, editing, setEditing, saving, handleSave }: any) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={20} color="#4a90e2" />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput style={styles.textArea} multiline numberOfLines={3} value={formData.bio} onChangeText={(text) => setFormData({ ...formData, bio: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialty</Text>
              <TextInput style={styles.input} value={formData.specialty} onChangeText={(text) => setFormData({ ...formData, specialty: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.years_of_experience} onChangeText={(text) => setFormData({ ...formData, years_of_experience: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital/Clinic Affiliation</Text>
              <TextInput style={styles.input} value={formData.clinic_hospital_affiliation} onChangeText={(text) => setFormData({ ...formData, clinic_hospital_affiliation: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Languages Spoken</Text>
              <TextInput style={styles.input} value={formData.languages_spoken} onChangeText={(text) => setFormData({ ...formData, languages_spoken: text })} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Specialty</Text><Text style={styles.infoValue}>{profileData?.specialty || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Experience</Text><Text style={styles.infoValue}>{profileData?.years_of_experience ? `${profileData.years_of_experience} years` : 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Affiliation</Text><Text style={styles.infoValue}>{profileData?.clinic_hospital_affiliation || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Languages</Text><Text style={styles.infoValue}>{profileData?.languages_spoken || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Bio</Text><Text style={styles.infoValue}>{profileData?.bio || 'Not set'}</Text></View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_patients || 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_consultations || 0}</Text>
            <Text style={styles.statLabel}>Consultations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.rating || '4.8'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </>
  );
}

// Pharmacy Profile Component
function PharmacyProfile({ profileData, formData, setFormData, editing, setEditing, saving, handleSave }: any) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={20} color="#4a90e2" />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pharmacy Name</Text>
              <TextInput style={styles.input} value={formData.pharmacy_name} onChangeText={(text) => setFormData({ ...formData, pharmacy_name: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number</Text>
              <TextInput style={styles.input} value={formData.pharmacy_license} onChangeText={(text) => setFormData({ ...formData, pharmacy_license: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={formData.pharmacy_address} onChangeText={(text) => setFormData({ ...formData, pharmacy_address: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opening Hours</Text>
              <TextInput style={styles.input} value={formData.opening_hours} onChangeText={(text) => setFormData({ ...formData, opening_hours: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Info</Text>
              <TextInput style={styles.input} value={formData.pharmacy_contact_info} onChangeText={(text) => setFormData({ ...formData, pharmacy_contact_info: text })} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Pharmacy Name</Text><Text style={styles.infoValue}>{profileData?.pharmacy_name || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>License</Text><Text style={styles.infoValue}>{profileData?.pharmacy_license || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue}>{profileData?.pharmacy_address || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Hours</Text><Text style={styles.infoValue}>{profileData?.opening_hours || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Contact</Text><Text style={styles.infoValue}>{profileData?.pharmacy_contact_info || 'Not set'}</Text></View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_orders || 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_medicines || 0}</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.rating || '4.9'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </>
  );
}

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_data', 'user_role']);
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <View style={[styles.avatar, userRole === 'pharmacy' && styles.pharmacyAvatar]}>
            <Text style={styles.avatarText}>
              {(profileData?.pharmacy_name || userData?.full_name)?.charAt(0).toUpperCase() || 'U'}
            </Text>
            {userData?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profileData?.pharmacy_name || userData?.full_name || 'User'}</Text>
            {userData?.is_verified && (
              <View style={styles.verifiedTextBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                <Text style={styles.verifiedText}>VERIFIED PHARMACY</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{userData?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userData?.role || 'Patient'}</Text>
          </View>
        </View>

        {/* Role-specific profile content */}
        {userRole === 'doctor' ? (
          <DoctorProfile 
            profileData={profileData} 
            formData={formData} 
            setFormData={setFormData}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            handleSave={handleSave}
          />
        ) : userRole === 'pharmacy' ? (
          <PharmacyProfile 
            profileData={profileData}
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            handleSave={handleSave}
          />
        ) : (
          <PatientProfile 
            profileData={profileData}
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            handleSave={handleSave}
          />
        )}

        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings' as any)}
        >
          <Ionicons name="settings-outline" size={20} color="#4a90e2" />
          <Text style={styles.settingsButtonText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Patient Profile Component
function PatientProfile({ profileData, formData, setFormData, editing, setEditing, saving, handleSave }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={20} color="#4a90e2" />
          </TouchableOpacity>
        )}
      </View>

      {editing ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={3}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
            />
          </View>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.height} onChangeText={(text) => setFormData({ ...formData, height: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.weight} onChangeText={(text) => setFormData({ ...formData, weight: text })} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Type</Text>
            <TextInput style={styles.input} value={formData.body_type} onChangeText={(text) => setFormData({ ...formData, body_type: text })} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Height</Text><Text style={styles.infoValue}>{profileData?.height ? `${profileData.height} cm` : 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Weight</Text><Text style={styles.infoValue}>{profileData?.weight ? `${profileData.weight} kg` : 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Body Type</Text><Text style={styles.infoValue}>{profileData?.body_type || 'Not set'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Bio</Text><Text style={styles.infoValue}>{profileData?.bio || 'Not set'}</Text></View>
        </>
      )}
    </View>
  );
}

// Doctor Profile Component
function DoctorProfile({ profileData, formData, setFormData, editing, setEditing, saving, handleSave }: any) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={20} color="#4a90e2" />
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput style={styles.textArea} multiline numberOfLines={3} value={formData.bio} onChangeText={(text) => setFormData({ ...formData, bio: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialty</Text>
              <TextInput style={styles.input} value={formData.specialty} onChangeText={(text) => setFormData({ ...formData, specialty: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.years_of_experience} onChangeText={(text) => setFormData({ ...formData, years_of_experience: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hospital/Clinic Affiliation</Text>
              <TextInput style={styles.input} value={formData.clinic_hospital_affiliation} onChangeText={(text) => setFormData({ ...formData, clinic_hospital_affiliation: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Languages Spoken</Text>
              <TextInput style={styles.input} value={formData.languages_spoken} onChangeText={(text) => setFormData({ ...formData, languages_spoken: text })} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Specialty</Text><Text style={styles.infoValue}>{profileData?.specialty || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Experience</Text><Text style={styles.infoValue}>{profileData?.years_of_experience ? `${profileData.years_of_experience} years` : 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Affiliation</Text><Text style={styles.infoValue}>{profileData?.clinic_hospital_affiliation || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Languages</Text><Text style={styles.infoValue}>{profileData?.languages_spoken || 'Not set'}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Bio</Text><Text style={styles.infoValue}>{profileData?.bio || 'Not set'}</Text></View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_patients || 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.total_consultations || 0}</Text>
            <Text style={styles.statLabel}>Consultations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileData?.rating || '4.8'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pharmacyAvatar: {
    backgroundColor: '#0D1B3A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedTextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  infoValueText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  settingsButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statBox: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
