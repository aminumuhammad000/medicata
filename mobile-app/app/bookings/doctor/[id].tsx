import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import DoctorAvatar from '../../../components/DoctorAvatar';

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
  const [isFavourited, setIsFavourited] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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
    { id: 'video', name: 'Video', icon: 'videocam-outline', activeIcon: 'videocam', color: '#7C3AED', bg: '#F5F3FF' },
    { id: 'audio', name: 'Voice', icon: 'mic-outline', activeIcon: 'mic', color: '#059669', bg: '#ECFDF5' },
    { id: 'chat', name: 'Chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble', color: '#2563EB', bg: '#EFF6FF' },
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
        mode,
        reason,
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
    if (date) setTempDate(date);
    // On Android the picker auto-dismisses on selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date) setSelectedDate(date);
    }
  };

  const confirmIOSDate = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(selectedDate); // reset temp to current
    setShowDatePicker(true);
  };

  const canBook = !!reason.trim() && !!selectedSlot && !loading;

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top Navigation Bar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Doctor Profile</Text>
        <TouchableOpacity
          style={[styles.navBtn, isFavourited && styles.navBtnFav]}
          onPress={() => setIsFavourited((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFavourited ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavourited ? '#EF4444' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Doctor Card ── */}
          <View style={styles.doctorCard}>
            {/* Avatar */}
            <DoctorAvatar
              imageUrl={doctor?.profile_photo}
              name={doctor?.full_name || 'Doctor'}
              size={92}
              radius={26}
              verified={!!doctor?.is_verified}
              style={{ marginBottom: 14 }}
            />

            {/* Name & Specialty */}
            <Text style={styles.doctorName}>
              Dr. {doctor?.full_name || 'Medical Specialist'}
            </Text>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>
                {doctor?.specialty || 'General Practice'}
              </Text>
            </View>

            {/* Rating + Experience + Patients row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.statValue}>{doctor?.rating || '4.9'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#2563EB" />
                <Text style={styles.statValue}>{doctor?.review_count || '48'}+</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#10B981" />
                <Text style={styles.statValue}>{doctor?.experience || '5'}yr</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
            </View>
          </View>

          {/* ── About ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBg}>
                <Ionicons name="person-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>About</Text>
            </View>
            <Text style={styles.aboutText}>
              {doctor?.bio ||
                `Dr. ${doctor?.full_name || 'Specialist'} is a highly experienced medical professional dedicated to providing exceptional patient care with modern clinical approaches.`}
            </Text>
          </View>

          {/* ── Consultation Mode ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBg}>
                <Ionicons name="options-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Consultation Type</Text>
            </View>
            <View style={styles.modesGrid}>
              {modes.map((m) => {
                const isActive = mode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.modeCard,
                      isActive && { borderColor: m.color, backgroundColor: m.bg },
                    ]}
                    onPress={() => setMode(m.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.modeIconCircle,
                        { backgroundColor: isActive ? m.color : '#F1F5F9' },
                      ]}
                    >
                      <Ionicons
                        name={(isActive ? m.activeIcon : m.icon) as any}
                        size={20}
                        color={isActive ? '#fff' : '#64748B'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.modeName,
                        isActive && { color: m.color, fontWeight: '700' },
                      ]}
                    >
                      {m.name}
                    </Text>
                    {isActive && (
                      <View style={[styles.modeCheck, { backgroundColor: m.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Availability ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBg}>
                <Ionicons name="calendar-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Select Date & Time</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={openDatePicker}
              >
                <Ionicons name="calendar" size={14} color="#2563EB" />
                <Text style={styles.dateBtnText}>
                  {selectedDate.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Ionicons name="chevron-down" size={13} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Date Picker — Modal on iOS, inline on Android */}
            {Platform.OS === 'ios' ? (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                />
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHandle} />
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={confirmIOSDate}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    style={{ width: '100%' }}
                  />
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )
            )}

            {/* Slots */}
            <View style={styles.slotsArea}>
              {slotsLoading ? (
                <View style={styles.slotsLoader}>
                  <ActivityIndicator color="#2563EB" size="small" />
                  <Text style={styles.slotsLoaderText}>Loading slots…</Text>
                </View>
              ) : slots.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.slotsScroll}
                >
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isBooked = slot.is_booked;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        disabled={isBooked}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipActive,
                          isBooked && styles.slotChipBooked,
                        ]}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isSelected ? '#fff' : isBooked ? '#CBD5E1' : '#64748B'}
                          style={{ marginBottom: 2 }}
                        />
                        <Text
                          style={[
                            styles.slotText,
                            isSelected && styles.slotTextActive,
                            isBooked && styles.slotTextBooked,
                          ]}
                        >
                          {slot.start_time.substring(0, 5)}
                        </Text>
                        {isBooked && (
                          <Text style={styles.slotBooked}>Full</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.noSlots}>
                  <Ionicons name="calendar-clear-outline" size={32} color="#CBD5E1" />
                  <Text style={styles.noSlotsText}>No available slots for this date</Text>
                  <TouchableOpacity onPress={openDatePicker}>
                    <Text style={styles.noSlotsCta}>Pick another date</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ── Reason ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBg}>
                <Ionicons name="document-text-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.cardTitle}>Reason for Visit</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your symptoms or reason for the appointment…"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
            {reason.length > 0 && (
              <Text style={styles.charCount}>{reason.length} / 500</Text>
            )}
          </View>

          {/* ── Booking Summary ── */}
          {selectedSlot && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={15} color="#64748B" />
                <Text style={styles.summaryText}>
                  {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time-outline" size={15} color="#64748B" />
                <Text style={styles.summaryText}>{selectedSlot.start_time.substring(0, 5)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons
                  name={
                    mode === 'video'
                      ? 'videocam-outline'
                      : mode === 'audio'
                      ? 'mic-outline'
                      : 'chatbubble-outline'
                  }
                  size={15}
                  color="#64748B"
                />
                <Text style={styles.summaryText}>
                  {modes.find((m) => m.id === mode)?.name}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Footer ── */}
      <View style={styles.footer}>
        <View style={styles.feeBlock}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>
            ₦{(doctor?.consultation_fee || 15000).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={!canBook}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
  },

  // ── Navbar ───────────────────────────────────────────────
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Doctor Card ──────────────────────────────────────────
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  specialtyPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },

  // ── Generic Card ─────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  // ── About ────────────────────────────────────────────────
  aboutText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },

  // ── Consultation Mode ────────────────────────────────────
  modesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  modeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Date Button ──────────────────────────────────────────
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  // ── Slots ────────────────────────────────────────────────
  slotsArea: {
    minHeight: 70,
  },
  slotsLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  slotsLoaderText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  slotsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  slotChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 64,
  },
  slotChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  slotChipBooked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#F1F5F9',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  slotTextBooked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  slotBooked: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  noSlotsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  noSlotsCta: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 4,
  },

  // ── Reason TextArea ──────────────────────────────────────
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
  },

  // ── Summary Card ─────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  feeBlock: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bookBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Favourite button ─────────────────────────────────────
  navBtnFav: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  // ── Date Picker Modal (iOS) ──────────────────────────────
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    alignItems: 'center' as const,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 4,
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '100%' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerCancel: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  pickerDone: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700' as const,
  },
});
