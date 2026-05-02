import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LabRequisitionCard() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [labTest, setLabTest] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [meRes, labRes] = await Promise.all([
        api.getMyProfile(),
        api.getLabTest(id),
      ]);
      
      if (meRes.data) setUser(meRes.data);
      if (labRes.data) setLabTest(labRes.data);
    } catch (error) {
      console.error('Failed to load lab test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    // In a real app, this would generate a PDF and share it
    // For now, we'll just show an alert
    alert('Share functionality would generate a PDF here');
  };

  const handlePrint = () => {
    alert('Print functionality would open print dialog here');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!labTest) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Lab test not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Requisition Card</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* The Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.logoSection}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.logoBadge}>
                <Ionicons name="flask" size={24} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.brandName}>MEDICATA</Text>
                <Text style={styles.brandSubtitle}>Health System</Text>
              </View>
            </View>
            <View style={styles.requisitionBadge}>
              <Text style={styles.requisitionLabel}>REQUISITION</Text>
              <Text style={styles.requisitionCode}>{labTest.requisition_code || 'LAB-XXXX-XXXX'}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Patient Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>PATIENT INFORMATION</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{labTest.patient_name || 'Patient Name'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Requisition Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(labTest.requested_at || labTest.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Requesting Physician */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>REQUESTING PHYSICIAN</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Doctor Name</Text>
                <Text style={styles.infoValue}>{labTest.doctor_name || 'Dr. Name'}</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          {/* Tests Requested */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>TESTS REQUESTED</Text>
            <View style={styles.testsContainer}>
              {labTest.tests?.map((test: any, index: number) => (
                <View key={index} style={styles.testRow}>
                  <View style={styles.testCheckbox}>
                    <Text style={styles.checkboxText}>☐</Text>
                  </View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testNumber}>{index + 1}.</Text>
                    <View>
                      <Text style={styles.testName}>{test.name}</Text>
                      <Text style={styles.testCategory}>{test.category || 'Laboratory Test'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Clinical Instructions */}
          {labTest.instructions && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionLabel}>CLINICAL INSTRUCTIONS</Text>
              <View style={styles.instructionsBox}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.instructionsText}>{labTest.instructions}</Text>
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer Info */}
          <View style={styles.cardFooter}>
            <View style={styles.labInfo}>
              <Ionicons name="location" size={16} color="#64748B" />
              <Text style={styles.labInfoText}>Present this card at any accredited laboratory</Text>
            </View>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={60} color="#CBD5E1" />
              <Text style={styles.qrText}>Scan for digital tracking</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="share-outline" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handlePrint}>
            <View style={[styles.actionIconBg, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="print-outline" size={22} color="#22C55E" />
            </View>
            <Text style={styles.actionText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/consultations/chat/[id]', params: { id: labTest.consultation_id } })}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FDF4FF' }]}>
              <Ionicons name="chatbubbles-outline" size={22} color="#A855F7" />
            </View>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Status Info */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(labTest.status) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(labTest.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(labTest.status) }]}>
                {getStatusLabel(labTest.status)}
              </Text>
            </View>
          </View>
          
          {labTest.status === 'completed' && (
            <View style={styles.resultNote}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.resultNoteText}>Results are available. Check the Clinical Desk.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#F59E0B';
    case 'in_progress': return '#3B82F6';
    case 'completed': return '#22C55E';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  requisitionBadge: {
    alignItems: 'flex-end',
  },
  requisitionLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 1,
  },
  requisitionCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  signatureBox: {
    marginTop: 16,
  },
  signatureLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  signatureLine: {
    height: 1,
    backgroundColor: '#CBD5E1',
    width: '60%',
  },
  testsContainer: {
    gap: 12,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  testCheckbox: {
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  testInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  testNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    width: 20,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  testCategory: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  instructionsBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 8,
  },
  labInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  labInfoText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  qrText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 24,
    marginBottom: 20,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  resultNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resultNoteText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
});
