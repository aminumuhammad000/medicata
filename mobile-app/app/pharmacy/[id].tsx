import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PharmacyOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [delivery, setDelivery] = useState(true);
  const [address, setAddress] = useState('12 Main St, Lagos');

  const handleOrder = () => {
    // In a real app, send API request
    router.replace('/(tabs)'); // Redirect to dashboard
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Medicines</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pharmacyCard}>
          <Text style={styles.pharmacyName}>Medicare Pharmacy</Text>
          <Text style={styles.pharmacyAddress}>12 Main St, Lagos • 1.2 km away</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription</Text>
          <View style={styles.prescriptionBox}>
            <Ionicons name="document-text" size={24} color="#4a90e2" />
            <View style={styles.prescriptionInfo}>
              <Text style={styles.prescriptionName}>Prescription #MED-9922</Text>
              <Text style={styles.prescriptionDetail}>Amoxicillin 500mg • Dr. Connor</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Home Delivery</Text>
            <Switch 
              value={delivery} 
              onValueChange={setDelivery}
              trackColor={{ false: '#eee', true: '#4a90e2' }}
            />
          </View>
          
          {delivery ? (
            <View style={styles.addressBox}>
              <Text style={styles.label}>Delivery Address</Text>
              <TextInput 
                style={styles.input} 
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          ) : (
            <View style={styles.pickupBox}>
              <Text style={styles.pickupText}>You will pick up your order at the pharmacy address above.</Text>
            </View>
          )}
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Medicine Total</Text>
            <Text style={styles.priceValue}>₦4,500</Text>
          </View>
          {delivery && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>₦500</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₦{delivery ? '5,000' : '4,500'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleOrder}>
          <Text style={styles.confirmButtonText}>Confirm & Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  pharmacyCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 24,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  prescriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d0e3ff',
    gap: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  prescriptionDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressBox: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickupBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pickupText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  priceSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
