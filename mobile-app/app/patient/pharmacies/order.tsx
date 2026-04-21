import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function OrderConfirmation() {
  const router = useRouter();
  const { prescriptionId, pharmacyId, pharmacyName } = useLocalSearchParams<{ 
    prescriptionId: string, 
    pharmacyId: string,
    pharmacyName: string
  }>();
  
  const [isDelivery, setIsDelivery] = useState(true);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!pharmacyId) return;
    if (isDelivery && !address) {
      alert('Please enter a delivery address');
      return;
    }

    setLoading(true);
    try {
      await api.createOrder({
        pharmacy_id: pharmacyId,
        prescription_id: prescriptionId,
        delivery_address: isDelivery ? address : 'Pickup in store',
        contact_info: phone,
        is_delivery: isDelivery,
        preferred_time: preferredTime || undefined
      });
      
      alert('Order placed successfully! You will receive a notification when it is ready.');
      // Navigate to patient dashboard or orders list
      router.replace('/patient/dashboard' as any);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pharmacyCard}>
          <Text style={styles.sectionLabel}>Fulfilling Pharmacy</Text>
          <Text style={styles.pharmacyName}>{pharmacyName}</Text>
          <View style={styles.pharmacyMeta}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.metaText}>Ready in approx. 2-4 hours</Text>
          </View>
        </View>

        <View style={styles.optionSection}>
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Home Delivery</Text>
              <Text style={styles.optionSub}>Get your meds delivered to your door</Text>
            </View>
            <Switch 
              value={isDelivery} 
              onValueChange={setIsDelivery}
              trackColor={{ false: '#ddd', true: '#4a90e2' }}
            />
          </View>
        </View>

        {isDelivery && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your full house address..."
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+234 ..."
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Time (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. After 4 PM"
            value={preferredTime}
            onChangeText={setPreferredTime}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Medications</Text>
            <Text style={styles.summaryValue}>From prescription</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Mode</Text>
            <Text style={styles.summaryValue}>{isDelivery ? 'Delivery' : 'Self Pickup'}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Cost</Text>
            <Text style={styles.totalValue}>Pay on delivery/pickup</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.payButtonDisabled]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Place Order Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  pharmacyCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d0e3ff',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a90e2',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  pharmacyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  optionSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  optionSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    height: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 14,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  payButton: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
