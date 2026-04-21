import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

export default function DispenseConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  const prescriptionData = JSON.parse(params.prescription as string);
  const [dispensing, setDispensing] = useState(false);

  const handleDispense = async () => {
    setDispensing(true);
    try {
      const response = await api.dispensePrescription(prescriptionData.prescription.id);
      if (response.data) {
        Alert.alert("Success", "Medication has been marked as dispensed.", [
          { text: "Done", onPress: () => router.dismissTo('/(tabs)' as any) }
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to dispense medication.");
      }
    } catch (err: any) {
      Alert.alert("Error", "A network error occurred.");
    } finally {
      setDispensing(false);
    }
  };

  const { prescription, items } = prescriptionData;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1B3A', '#1E3A5F']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Dispensing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.patientCard}>
          <View style={styles.patientInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{prescription.patient_name?.charAt(0) || 'P'}</Text>
            </View>
            <View>
              <Text style={styles.patientName}>{prescription.patient_name || 'Patient'}</Text>
              <Text style={styles.prescriptionId}>ID: {prescription.id.slice(0, 8)}</Text>
            </View>
          </View>
          <View style={styles.doctorInfo}>
            <Ionicons name="medkit-outline" size={16} color="#64748B" />
            <Text style={styles.doctorName}>Issued by Dr. {prescription.doctor_name || 'Assigned Doctor'}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Medications to Dispense</Text>
          {items.map((item: any) => (
            <View key={item.item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.drug.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.item.quantity}</Text>
              </View>
              <Text style={styles.itemDosage}>{item.item.dosage} • {item.item.frequency}</Text>
              <View style={styles.instructionBox}>
                <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />
                <Text style={styles.instructionText}>{item.item.instructions || 'Take as prescribed'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color="#D97706" />
          <Text style={styles.warningText}>
            Ensure all medications are available and verified against the physical labels before confirming.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.dispenseBtn} 
          onPress={handleDispense}
          disabled={dispensing}
        >
          <LinearGradient
            colors={['#4F46E5', '#3B82F6']}
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {dispensing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.btnText}>Confirm & Mark as Dispensed</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)' },
      default: { elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  prescriptionId: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D1B3A',
    marginLeft: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemDosage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
  },
  dispenseBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

