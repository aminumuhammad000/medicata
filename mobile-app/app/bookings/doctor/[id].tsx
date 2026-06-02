import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('video');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [id]);

  useEffect(() => {
    loadAvailability();
  }, [selectedDate]);

  const loadDoctor = async () => {
    try {
      const response = await api.getDoctorById(id as string);
      setDoctor(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  const loadAvailability = async () => {
    setSlotsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await api.getAvailability(id as string, dateStr);
      setSlots(res.data || []);
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const modes = [
    { id: 'video', name: 'Video', icon: 'videocam', color: '#7C3AED' },
    { id: 'audio', name: 'Audio', icon: 'mic', color: '#10B981' },
    { id: 'chat', name: 'Chat', icon: 'chatbubbles', color: '#3B82F6' },
  ];

  const handleBook = async () => {
    if (!reason || !selectedSlot) return;
    
    setLoading(true);
    try {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.start_time.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const response = await api.bookConsultation({
        doctor_id: id as string,
        scheduled_at: scheduledAt.toISOString(),
        mode: mode,
        reason: reason,
        symptoms: reason,
      });

      if (response.data) {
        alert('Booking request sent successfully!');
        router.replace('/(tabs)');
      } else {
          alert('Failed to book appointment. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to book consultation');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Doctor Profile</Text>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="heart-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileBrief}>
              <View style={styles.avatarContainer}>
                  <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.avatarGradient}>
                    <Text style={styles.avatarText}>{(doctor?.full_name || 'D').charAt(0)}</Text>
                  </LinearGradient>
                  <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
              </View>
              <View style={styles.briefInfo}>
                  <Text style={styles.name}>{doctor?.full_name}</Text>
                  <Text style={styles.specialty}>{doctor?.specialty || 'Medical Specialist'}</Text>
                  <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{doctor?.rating || '4.9'} ({doctor?.review_count || 48} reviews)</Text>
                  </View>
              </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>{doctor?.bio || "Dr. " + (doctor?.full_name || "Specialist") + " is a highly experienced medical professional dedicated to providing exceptional patient care with modern clinical approaches."}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Consultation Mode</Text>
          <View style={styles.modesRow}>
            {modes.map((m) => (
              <TouchableOpacity 
                key={m.id} 
                style={[styles.modeCard, mode === m.id && { borderColor: m.color, backgroundColor: m.color + '10' }]}
                onPress={() => setMode(m.id)}
              >
                <View style={[styles.modeIconBg, { backgroundColor: mode === m.id ? m.color : '#F1F5F9' }]}>
                    <Ionicons name={m.icon as any} size={20} color={mode === m.id ? '#fff' : '#64748B'} />
                </View>
                <Text style={[styles.modeName, mode === m.id && { color: m.color, fontWeight: '800' }]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
               <Ionicons name="calendar-outline" size={16} color="#4A90E2" />
               <Text style={styles.datePickerBtnText}>
                  {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
               </Text>
            </TouchableOpacity>
          </View>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.slotsContainer}>
            {slotsLoading ? (
               <ActivityIndicator color="#4A90E2" size="small" />
            ) : slots.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotsScroll}>
                    {slots.map((slot) => (
                        <TouchableOpacity 
                            key={slot.id}
                            disabled={slot.is_booked}
                            style={[
                                styles.slotChip, 
                                selectedSlot?.id === slot.id && styles.activeSlotChip,
                                slot.is_booked && styles.bookedSlotChip
                            ]}
                            onPress={() => setSelectedSlot(slot)}
                        >
                            <Text style={[
                                styles.slotText, 
                                selectedSlot?.id === slot.id && styles.activeSlotText,
                                slot.is_booked && styles.bookedSlotText
                            ]}>
                                {slot.start_time.substring(0, 5)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.noSlotsText}>No available slots for this date.</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Appointment</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell the doctor what's bothering you..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />
        </Animated.View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.feeInfo}>
            <Text style={styles.feeLabel}>Total Fee</Text>
            <Text style={styles.feeValue}>₦{doctor?.consultation_fee?.toLocaleString() || '15,000'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, (!reason || !selectedSlot || loading) && styles.bookBtnDisabled]} 
          onPress={handleBook}
          disabled={!reason || !selectedSlot || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Book Now</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerSection: { paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  profileBrief: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 24, alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatarGradient: { width: 70, height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#0D1B3A', justifyContent: 'center', alignItems: 'center' },
  briefInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#fff' },
  specialty: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  aboutText: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  modesRow: { flexDirection: 'row', gap: 12 },
  modeCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 2, borderColor: '#F1F5F9', backgroundColor: '#fff' },
  modeIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modeName: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 12 },
  datePickerBtnText: { fontSize: 13, fontWeight: '700', color: '#4A90E2' },
  slotsContainer: { minHeight: 60, justifyContent: 'center' },
  slotsScroll: { gap: 12 },
  slotChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' },
  activeSlotChip: { backgroundColor: '#0D1B3A', borderColor: '#0D1B3A' },
  bookedSlotChip: { backgroundColor: '#F1F5F9', opacity: 0.5 },
  slotText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  activeSlotText: { color: '#fff' },
  bookedSlotText: { color: '#94A3B8', textDecorationLine: 'line-through' },
  noSlotsText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' },
  textArea: { backgroundColor: '#fff', borderRadius: 20, padding: 16, fontSize: 14, color: '#1E293B', minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#F1F5F9' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  feeInfo: { flex: 1 },
  feeLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  feeValue: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  bookBtn: { flex: 1.5, height: 56, borderRadius: 18, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginLeft: 20, shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  bookBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  bookBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
});
