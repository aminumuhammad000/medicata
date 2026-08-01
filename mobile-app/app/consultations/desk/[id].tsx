import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConsultationDesk() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [labTests, setLabTests] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  
  useEffect(() => {
    loadUserAndData();
  }, [id]);

  const loadUserAndData = async () => {
    try {
      const me = await api.getMyProfile();
      if (me.data) setUser(me.data);
      
      const listRes = await api.getMyConsultations();
      let currentId = id;
      if (listRes.data) {
        const item = listRes.data.find((c: any) => c.id === id);
        if (item) {
          setConsultation(item);
          setNotes(item.doctor_notes || '');
          currentId = item.id;
        }
      }
      
      if (currentId && currentId !== '') {
        const [labRes, presRes] = await Promise.all([
          api.getConsultationLabTests(currentId),
          api.getConsultationPrescriptions(currentId),
        ]);
        if (labRes.data) setLabTests(labRes.data);
        if (presRes.data) setPrescriptions(presRes.data);
      }
    } catch (error) {
      console.error('Failed to load consultation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = user?.role === 'doctor';

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await api.updateConsultationStatus(id, newStatus);
      const listRes = await api.getMyConsultations();
      if (listRes.data) {
        const item = listRes.data.find((c: any) => c.id === id);
        if (item) setConsultation(item);
      }
    } catch (error) {
      alert('Failed to update appointment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleComplete = async () => {
    try {
      if (id) {
        await api.updateConsultationStatus(id, 'completed');
        await api.addConsultationNotes(id, diagnosis + "\n\n" + notes);
      }
      // Redirect to the main tab index where the doctor dashboard lives
      router.replace('/(tabs)');
    } catch (error) {
      alert('Failed to complete consultation');
    }
  };

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

  const renderPrescriptionsSection = () => {
    if (prescriptions.length === 0) return null;

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconBg, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="medical" size={20} color="#22C55E" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Prescriptions</Text>
            <Text style={styles.sectionSubtitle}>{prescriptions.length} issued</Text>
          </View>
        </View>
        
        {prescriptions.map((prescription, index) => (
          <View key={prescription.id} style={[styles.prescriptionCard, index === prescriptions.length - 1 && { marginBottom: 0 }]}>
            <View style={styles.prescriptionHeader}>
              <View style={styles.prescriptionIdBadge}>
                <Text style={styles.prescriptionIdText}>RX-{prescription.id?.slice(0, 8).toUpperCase()}</Text>
              </View>
              <Text style={styles.prescriptionDate}>
                {new Date(prescription.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.medicationsList}>
              {prescription.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.medicationItem}>
                  <View style={styles.medicationDot} />
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{item.drug_name}</Text>
                    <Text style={styles.medicationDetails}>
                      {item.dosage} • {item.frequency} • {item.duration_days} days
                    </Text>
                    {item.instructions && (
                      <Text style={styles.medicationNote}>Note: {item.instructions}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.prescriptionStatus}>
              <View style={[styles.statusBadge, { backgroundColor: prescription.is_dispensed ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[styles.statusBadgeText, { color: prescription.is_dispensed ? '#166534' : '#92400E' }]}>
                  {prescription.is_dispensed ? '✓ Dispensed' : '⏳ Active'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLabTestsSection = () => {
    if (labTests.length === 0 && !isDoctor) return null;

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="flask" size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            <Text style={styles.sectionSubtitle}>
              {labTests.filter(lt => lt.status !== 'completed').length} active • {labTests.filter(lt => lt.status === 'completed').length} completed
            </Text>
          </View>
        </View>
        
        {labTests.length === 0 ? (
          isDoctor && (
            <View style={styles.emptyLabState}>
              <Text style={styles.emptyLabText}>No lab tests requested yet</Text>
              <Text style={styles.emptyLabSubtext}>Use the Lab Test button to request tests</Text>
            </View>
          )
        ) : (
          labTests.map((labTest, index) => (
            <View key={labTest.id} style={[styles.labTestCard, index === labTests.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.labTestHeader}>
                <View>
                  <Text style={styles.requisitionCode}>{labTest.requisition_code || 'LAB-XXXX-XXXX'}</Text>
                  <Text style={styles.requestedDate}>
                    Requested {new Date(labTest.requested_at || labTest.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(labTest.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(labTest.status) }]} />
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(labTest.status) }]}>
                    {getStatusLabel(labTest.status)}
                  </Text>
                </View>
              </View>
              
              {labTest.instructions && (
                <View style={styles.instructionsBox}>
                  <Ionicons name="information-circle" size={14} color="#3B82F6" />
                  <Text style={styles.instructionsText}>{labTest.instructions}</Text>
                </View>
              )}
              
              <View style={styles.testsList}>
                {labTest.tests?.map((test: any, idx: number) => (
                  <View key={idx} style={styles.testItem}>
                    <View style={[styles.testCategoryTag, { backgroundColor: getStatusColor(labTest.status) + '15' }]}>
                      <Text style={[styles.testCategoryText, { color: getStatusColor(labTest.status) }]}>
                        {test.category || 'Lab'}
                      </Text>
                    </View>
                    <Text style={styles.testName}>{test.name}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.labTestActions}>
                {isDoctor ? (
                  labTest.status === 'completed' ? (
                    <TouchableOpacity 
                      style={styles.labActionBtn}
                      onPress={() => router.push({
                        pathname: '/doctor/labs/results/[id]',
                        params: { id: labTest.id }
                      })}
                    >
                      <Ionicons name="eye-outline" size={16} color="#22C55E" />
                      <Text style={[styles.labActionText, { color: '#22C55E' }]}>View Results</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.waitingForPatient}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <Text style={styles.waitingForPatientText}>Awaiting Patient Results</Text>
                    </View>
                  )
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.labActionBtn}
                      onPress={() => router.push({
                        pathname: '/doctor/labs/requisition/[id]',
                        params: { id: labTest.id }
                      })}
                    >
                      <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
                      <Text style={[styles.labActionText, { color: '#3B82F6' }]}>View Card</Text>
                    </TouchableOpacity>
                    
                    {(labTest.status === 'pending' || labTest.status === 'in_progress') && (
                      <TouchableOpacity 
                        style={styles.labActionBtn}
                        onPress={() => router.push({ pathname: '/patient/labs/upload/[id]', params: { id: labTest.id } })}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#F59E0B" />
                        <Text style={[styles.labActionText, { color: '#F59E0B' }]}>Upload Results</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
              
              {labTest.result_summary && (
                <View style={styles.resultsBox}>
                  <Text style={styles.resultsLabel}>Doctor's Summary:</Text>
                  <Text style={styles.resultsText}>{labTest.result_summary}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  const handleDirectCheckout = () => {
    // Assuming a standard consultation fee of 5000 if not specified
    const fee = 5000;
    router.push({
      pathname: '/wallet/checkout',
      params: { 
        amount: fee.toString(), 
        type: 'consultation',
        consultation_id: id as string
      }
    });
  };

  const isAccepted = consultation?.status === 'accepted' || consultation?.status === 'completed';
  const isPending = consultation?.status === 'pending';

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Clinical Desk</Text>
              <Text style={styles.headerSubtitle}>Details & Records</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/consultations/chat/[id]', params: { id } } as any)}
              style={styles.headerBtn}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {!isAccepted && isDoctor ? (
          <View style={styles.pendingOverlay}>
            <View style={styles.pendingCard}>
              <View style={styles.pendingIconBg}>
                <Ionicons name="time-outline" size={48} color="#F59E0B" />
              </View>
              <Text style={styles.pendingTitle}>Pending Approval</Text>
              <Text style={styles.pendingSubtitle}>
                Please review and accept this appointment for {consultation?.patient_name} before starting the clinical session.
              </Text>
              <View style={styles.pendingActions}>
                <TouchableOpacity style={[styles.approvalBtn, styles.declineBtn]} onPress={() => handleStatusUpdate('cancelled')} disabled={isUpdatingStatus}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.approvalBtn, styles.acceptBtn]} onPress={() => handleStatusUpdate('accepted')} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>Accept Appointment</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.patientProfileCard}>
              <View style={styles.profileMain}>
                <View style={[styles.profileAvatar, { backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.avatarText}>
                    {(isDoctor ? consultation?.patient_name : consultation?.doctor_name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {isDoctor ? consultation?.patient_name : `Dr. ${consultation?.doctor_name || 'Medical Specialist'}`}
                  </Text>
                  <View style={styles.profileMetaRow}>
                    <Text style={styles.profileMeta}>{consultation?.mode.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileFooter}>
                <View style={styles.reasonTag}>
                  <Text style={styles.reasonLabel}>Chief Complaint</Text>
                  <Text style={styles.reasonValue}>{consultation?.reason || 'Not specified'}</Text>
                </View>
              </View>
            </View>

            {renderPrescriptionsSection()}
            {renderLabTestsSection()}

            {isAccepted && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="videocam" size={20} color="#7C3AED" />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Consultation Session</Text>
                    <Text style={styles.sectionSubtitle}>Start video or voice consultation</Text>
                  </View>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.sessionActionBtn, { backgroundColor: '#4F46E5' }]}
                    onPress={() => router.push(`/consultations/call/${id}`)}
                  >
                    <Ionicons name="videocam" size={20} color="#fff" />
                    <Text style={styles.sessionActionLabel}>Video Call</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sessionActionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => router.push(`/consultations/call/${id}?audioOnly=true`)}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.sessionActionLabel}>Voice Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isDoctor ? (
              <View style={styles.clinicalSections}>
                <View style={styles.clinicalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="clipboard-outline" size={20} color="#0D1B3A" />
                    <Text style={styles.clinicalSectionTitle}>Diagnosis</Text>
                  </View>
                  <TextInput style={styles.clinicalInput} placeholder="Enter primary diagnosis..." value={diagnosis} onChangeText={setDiagnosis} />
                </View>

                <View style={styles.clinicalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="document-text-outline" size={20} color="#0D1B3A" />
                    <Text style={styles.clinicalSectionTitle}>Clinical Findings</Text>
                  </View>
                  <TextInput style={styles.clinicalTextArea} placeholder="Detailed observations, symptoms, and medical notes..." multiline numberOfLines={6} value={notes} onChangeText={setNotes} />
                </View>

                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push({ pathname: '/doctor/prescription/create', params: { consultationId: id, patientId: consultation?.patient_id } })}>
                    <View style={[styles.gridIconBg, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="medical" size={22} color="#22C55E" />
                    </View>
                    <Text style={styles.gridActionLabel}>Prescribe</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push({ pathname: '/doctor/labs/request', params: { consultationId: id, patientId: consultation?.patient_id } })}>
                    <View style={[styles.gridIconBg, { backgroundColor: '#FFF7ED' }]}>
                      <Ionicons name="flask" size={22} color="#F59E0B" />
                    </View>
                    <Text style={styles.gridActionLabel}>Lab Test</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push({ pathname: '/doctor/history/[id]', params: { id: consultation?.patient_id, name: consultation?.patient_name } })}>
                    <View style={[styles.gridIconBg, { backgroundColor: '#F0F9FF' }]}>
                      <Ionicons name="time" size={22} color="#0EA5E9" />
                    </View>
                    <Text style={styles.gridActionLabel}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.patientViewContent}>
                <View style={styles.instructionCard}>
                  <Ionicons name="information-circle" size={24} color="#4A90E2" />
                  <Text style={styles.instructionText}>
                    {isPending 
                      ? "Your consultation request is pending payment. Please proceed to secure checkout to confirm your appointment." 
                      : "Your consultation is active. You can use the discussion tab to message the doctor directly."}
                  </Text>
                </View>

                {isPending && !isDoctor && (
                  <TouchableOpacity 
                    style={[styles.checkoutBtn, { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10, borderRadius: 16 }]} 
                    onPress={handleDirectCheckout}
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.checkoutBtnText}>Secure Checkout (Direct Pay)</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.doctorNotesSection}>
                  <Text style={styles.clinicalSectionTitle}>Doctor's Findings</Text>
                  <View style={styles.notesContainer}>
                    {notes ? <Text style={styles.notesContent}>{notes}</Text> : (
                      <View style={styles.waitingContainer}>
                        <ActivityIndicator color="#64748B" size="small" />
                        <Text style={styles.waitingText}>Doctor is preparing your notes...</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {isDoctor && isAccepted && (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={[styles.submitBtn, (!notes || !diagnosis) && styles.submitBtnDisabled]} onPress={handleComplete} disabled={!notes || !diagnosis}>
              <Text style={styles.submitBtnText}>Complete Clinical Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  topSection: { 
    backgroundColor: '#FFFFFF',
    paddingBottom: 16, 
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  headerBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitleContainer: { 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24 
  },
  pendingCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pendingIconBg: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFF7ED', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  pendingTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginBottom: 8 
  },
  pendingSubtitle: { 
    fontSize: 14, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 24,
    fontWeight: '500',
  },
  pendingActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  approvalBtn: { 
    flex: 1, 
    height: 52, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  declineBtn: { 
    backgroundColor: '#F1F5F9' 
  },
  acceptBtn: { 
    backgroundColor: '#0F172A', 
    flex: 2 
  },
  declineBtnText: { 
    color: '#64748B', 
    fontWeight: '800' 
  },
  acceptBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  scrollContent: { 
    padding: 20 
  },
  patientProfileCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  profileMain: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 16 
  },
  profileAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 18, 
    overflow: 'hidden' 
  },
  avatarGradient: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  avatarText: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#2563EB' 
  },
  profileDetails: { 
    flex: 1 
  },
  profileName: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginBottom: 2 
  },
  profileMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  profileMeta: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileFooter: { 
    borderTopWidth: 1, 
    borderTopColor: '#F8FAFC', 
    paddingTop: 14 
  },
  reasonTag: { 
    gap: 4 
  },
  reasonLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#94A3B8', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonValue: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#0F172A',
    lineHeight: 18,
  },
  clinicalSections: { 
    gap: 16 
  },
  clinicalSection: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12 
  },
  clinicalSectionTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clinicalInput: { 
    fontSize: 14, 
    color: '#0F172A', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    fontWeight: '500',
  },
  clinicalTextArea: { 
    fontSize: 14, 
    color: '#0F172A', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 12, 
    height: 100, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    fontWeight: '500',
  },
  quickActionsGrid: { 
    flexDirection: 'row', 
    gap: 10 
  },
  gridActionBtn: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 14, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  gridIconBg: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  gridActionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  bottomActions: { 
    padding: 20, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  submitBtn: { 
    backgroundColor: '#2563EB', 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  submitBtnDisabled: { 
    backgroundColor: '#E2E8F0' 
  },
  submitBtnText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '900' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  patientViewContent: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16
  },
  checkoutBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#2563EB',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  instructionCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#F0F9FF', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#B9E6FE' 
  },
  instructionText: { 
    flex: 1, 
    fontSize: 12, 
    color: '#0369A1', 
    fontWeight: '700', 
    lineHeight: 18 
  },
  doctorNotesSection: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  notesContainer: { 
    marginTop: 12, 
    minHeight: 80, 
    justifyContent: 'center' 
  },
  notesContent: { 
    fontSize: 14, 
    color: '#0F172A', 
    lineHeight: 22,
    fontWeight: '500',
  },
  waitingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  waitingText: { 
    fontSize: 13, 
    color: '#94A3B8', 
    fontWeight: '700' 
  },
  sectionCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 16 
  },
  sectionIconBg: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '900', 
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: { 
    fontSize: 12, 
    color: '#94A3B8', 
    marginTop: 2,
    fontWeight: '800',
  },
  prescriptionCard: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  prescriptionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  prescriptionIdBadge: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  prescriptionIdText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#4338CA' 
  },
  prescriptionDate: { 
    fontSize: 11, 
    color: '#94A3B8',
    fontWeight: '700',
  },
  medicationsList: { 
    gap: 8 
  },
  medicationItem: { 
    flexDirection: 'row', 
    gap: 8 
  },
  medicationDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#2563EB', 
    marginTop: 5 
  },
  medicationInfo: { 
    flex: 1 
  },
  medicationName: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  medicationDetails: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 1,
    fontWeight: '600',
  },
  medicationNote: { 
    fontSize: 11, 
    color: '#2563EB', 
    fontStyle: 'italic', 
    marginTop: 2,
    fontWeight: '600',
  },
  prescriptionStatus: { 
    marginTop: 10, 
    alignItems: 'flex-start' 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 20 
  },
  statusBadgeText: { 
    fontSize: 10, 
    fontWeight: '900', 
    textTransform: 'uppercase' 
  },
  labTestCard: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  labTestHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 10 
  },
  requisitionCode: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#0F172A' 
  },
  requestedDate: { 
    fontSize: 11, 
    color: '#94A3B8', 
    marginTop: 1,
    fontWeight: '700',
  },
  statusDot: { 
    width: 5, 
    height: 5, 
    borderRadius: 2.5 
  },
  instructionsBox: { 
    flexDirection: 'row', 
    gap: 6, 
    backgroundColor: '#F0F9FF', 
    padding: 10, 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'flex-start' 
  },
  instructionsText: { 
    flex: 1, 
    fontSize: 11, 
    color: '#0369A1', 
    lineHeight: 16,
    fontWeight: '700',
  },
  testsList: { 
    gap: 6 
  },
  testItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  testCategoryTag: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  testCategoryText: { 
    fontSize: 9, 
    fontWeight: '900', 
    textTransform: 'uppercase' 
  },
  testName: { 
    fontSize: 13, 
    color: '#0F172A', 
    fontWeight: '600' 
  },
  waitingForPatient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingVertical: 6 
  },
  waitingForPatientText: { 
    fontSize: 11, 
    color: '#94A3B8', 
    fontStyle: 'italic',
    fontWeight: '700',
  },
  labTestActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 12, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  labActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  labActionText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#2563EB' 
  },
  resultsBox: { 
    backgroundColor: '#F0FDF4', 
    padding: 10, 
    borderRadius: 8, 
    marginTop: 10, 
    borderLeftWidth: 3, 
    borderLeftColor: '#22C55E' 
  },
  resultsLabel: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: '#166534', 
    marginBottom: 4 
  },
  resultsText: { 
    fontSize: 12, 
    color: '#0F172A', 
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyLabState: { 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  emptyLabText: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#64748B' 
  },
  emptyLabSubtext: { 
    fontSize: 11, 
    color: '#94A3B8', 
    marginTop: 3,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  sessionActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  sessionActionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
