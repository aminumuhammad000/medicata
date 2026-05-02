import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function CheckoutScreen() {
  const router = useRouter();
  const { amount, type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    initializeCheckout();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const initializeCheckout = async () => {
    try {
      const res = await api.initializeCheckout({
        amount: parseInt(amount as string),
        type: type as string,
      });
      if (res.data) {
        setSession(res.data);
      } else {
        throw new Error('Failed to initialize checkout');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to initialize checkout');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Setting up secure payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount to Pay</Text>
          <Text style={styles.summaryAmount}>₦{parseInt(amount as string).toLocaleString()}</Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={styles.timerText}>Expires in {formatTime(timeLeft)}</Text>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Bank Transfer Instruction</Text>
          <Text style={styles.instructionText}>
            Please transfer exactly <Text style={styles.boldText}>₦{parseInt(amount as string).toLocaleString()}</Text> to the virtual account below.
          </Text>

          <View style={styles.accountDetails}>
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{session?.bank_name || 'PalmPay (VTStack)'}</Text>
              </View>
              <Ionicons name="business" size={24} color="#64748B" />
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.accountNumberText}>{session?.account_number || '0000000000'}</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(session?.account_number, 'Account number')}>
                <Ionicons name="copy-outline" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>Account Name</Text>
                <Text style={styles.detailValue}>{session?.account_name || 'Medicata Checkout'}</Text>
              </View>
              <Ionicons name="person" size={24} color="#64748B" />
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.warningText}>
              This account is valid for this transaction only and expires in 30 minutes.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => {
            Alert.alert('Payment Verification', 'We are waiting for the bank to confirm your transfer. This usually takes 1-5 minutes.', [
              { text: 'Okay', onPress: () => router.push('/wallet' as any) }
            ]);
          }}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.gradientButton}
          >
            <Text style={styles.confirmButtonText}>I have made the transfer</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  timerText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '700',
  },
  instructionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  accountDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountNumberText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    lineHeight: 18,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
