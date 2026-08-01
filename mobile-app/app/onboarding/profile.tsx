import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, FlatList, Pressable, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ProgressBar from '../../components/onboarding/ProgressBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  selectedValue: string;
  title: string;
  unit: string;
}

function SelectionModal({ visible, onClose, onSelect, options, selectedValue, title, unit }: PickerModalProps) {
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (visible && selectedValue) {
      const index = options.indexOf(selectedValue);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
        }, 100);
      }
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <View style={styles.selectionIndicator} />
            <FlatList
              ref={flatListRef}
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
              contentContainerStyle={{ paddingVertical: 100 }}
              getItemLayout={(_, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.optionItem} 
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    item === selectedValue && styles.optionTextActive
                  ]}>
                    {item} <Text style={styles.unitText}>{unit}</Text>
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data, updateData, submitPatientProfile, submitDoctorBio, loading, error } = useOnboarding();
  
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [bodyType, setBodyType] = useState('Average');
  const [hospital, setHospital] = useState('');
  const [languages, setLanguages] = useState('');

  const [pickingHeight, setPickingHeight] = useState(false);
  const [pickingWeight, setPickingWeight] = useState(false);

  // Ranges
  const heightOptions = Array.from({ length: 151 }, (_, i) => (i + 100).toString()); // 100 to 250
  const weightOptions = Array.from({ length: 181 }, (_, i) => (i + 40).toString()); // 40 to 220

  const handleNext = async () => {
    if (data.userType === 'patient') {
      updateData({ bio, height, weight, bodyType });
      const success = await submitPatientProfile({
        bio,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        body_type: bodyType,
        address: data.address,
      });
      if (success) router.push('/onboarding/terms');
    } else if (data.userType === 'doctor') {
      updateData({ bio, affiliation: hospital, languages: languages.split(',').map(l => l.trim()) });
      const success = await submitDoctorBio();
      if (success) router.push('/onboarding/terms');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <ProgressBar 
              currentStep={data.userType === 'patient' ? 6 : 7} 
              totalSteps={data.userType === 'patient' ? 7 : 8} 
              label="Biography" 
            />
          </View>

          <View style={styles.titleSection}>
            <View style={styles.iconBadge}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
                <Ionicons name="document-text-outline" size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>
              {data.userType === 'patient' ? 'Profile & Body Info' : 'Bio & Affiliation'}
            </Text>
            <Text style={styles.subtitle}>
              {data.userType === 'patient' 
                ? 'Tell us more about yourself for better health tracking' 
                : 'Add a professional bio and your hospital affiliation'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Bio</Text>
              <View style={styles.textAreaBox}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us a bit about yourself..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
            </View>

            {data.userType === 'patient' ? (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      style={styles.inputBox}
                      onPress={() => setPickingHeight(true)}
                    >
                      <Text style={styles.valueText}>{height} cm</Text>
                      <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      style={styles.inputBox}
                      onPress={() => setPickingWeight(true)}
                    >
                      <Text style={styles.valueText}>{weight} kg</Text>
                      <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Body Type</Text>
                  <View style={styles.chipRow}>
                    {['Slim', 'Athletic', 'Average', 'Heavy'].map((t) => (
                      <TouchableOpacity 
                        key={t}
                        style={[styles.chip, bodyType === t && styles.chipActive]}
                        onPress={() => setBodyType(t)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, bodyType === t && styles.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hospital Affiliation</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="General Hospital Lagos"
                      placeholderTextColor="#94A3B8"
                      value={hospital}
                      onChangeText={setHospital}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Languages Spoken</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="English, Hausa, Yoruba"
                      placeholderTextColor="#94A3B8"
                      value={languages}
                      onChangeText={setLanguages}
                    />
                  </View>
                </View>
              </>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#4A90E2', '#2572D9']}
              style={styles.buttonGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <SelectionModal
          visible={pickingHeight}
          onClose={() => setPickingHeight(false)}
          onSelect={setHeight}
          options={heightOptions}
          selectedValue={height}
          title="Select Height"
          unit="cm"
        />

        <SelectionModal
          visible={pickingWeight}
          onClose={() => setPickingWeight(false)}
          onSelect={setWeight}
          options={weightOptions}
          selectedValue={weight}
          title="Select Weight"
          unit="kg"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 4,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  iconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'left',
    lineHeight: 20,
    maxWidth: '90%',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  input: {
    fontSize: 15,
    color: '#0F172A',
  },
  textAreaBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 16,
    minHeight: 120,
  },
  textArea: {
    fontSize: 15,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#2572D9',
    borderColor: '#2572D9',
  },
  chipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonGrad: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: SCREEN_HEIGHT * 0.45,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '500',
  },
  optionTextActive: {
    fontSize: 24,
    color: '#2572D9',
    fontWeight: '800',
  },
  unitText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
});
