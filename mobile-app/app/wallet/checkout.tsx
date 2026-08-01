import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { amount, type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  const [isVerifying, setIsVerifying] = useState(false);
  const { order_id, consultation_id } = useLocalSearchParams();

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

  useEffect(() => {
    let pollInterval: any;

    if (session?.reference && !isVerifying) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.checkPaymentStatus(session.reference);
          if (res.data?.status === 'completed') {
            clearInterval(pollInterval);
            Alert.alert(
              'Payment Verified', 
              'Your bank transfer has been received and confirmed!',
              [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
            );
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [session?.reference]);

  const initializeCheckout = async () => {
    try {
      const res = await api.initializeCheckout({
        amount: parseInt(amount as string),
        type: type as string,
        order_id: order_id as string,
        consultation_id: consultation_id as string,
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

  const handleConfirmTransfer = async () => {
    if (!session?.reference) return;
    
    setIsVerifying(true);
    try {
      const res = await api.checkPaymentStatus(session.reference);
      if (res.data?.status === 'completed') {
        Alert.alert(
          'Payment Verified', 
          'Your bank transfer has been received and confirmed!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert(
          'Verification Pending',
          'We haven\'t detected your transfer yet. If you have sent the funds, please wait a minute and tap verify again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify payment status. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Initializing secure payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount Due</Text>
          <Text style={styles.summaryAmount}>₦{parseInt(amount as string).toLocaleString()}</Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color="#D97706" />
            <Text style={styles.timerText}>Session expires in {formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Transfer Details Card */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Bank Transfer Instructions</Text>
          <Text style={styles.instructionText}>
            Please transfer the exact amount above to the following secure virtual bank account.
          </Text>

          <View style={styles.accountDetails}>
            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>BANK NAME</Text>
                <Text style={styles.detailValue}>{session?.bank_name || 'PalmPay (VTStack)'}</Text>
              </View>
              <Ionicons name="business-outline" size={20} color="#64748B" />
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                <Text style={styles.accountNumberText}>{session?.account_number || '0000000000'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.copyBtnSmall}
                onPress={() => copyToClipboard(session?.account_number, 'Account number')}
              >
                <Ionicons name="copy-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
                <Text style={styles.detailValue}>{session?.account_name || 'Medicata Checkout'}</Text>
              </View>
              <Ionicons name="person-outline" size={20} color="#64748B" />
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
            <Text style={styles.warningText}>
              This virtual account is provisioned for this transaction only. Do not save/reuse.
            </Text>
          </View>
        </View>

        {/* Verification Action */}
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirmTransfer}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>I have made the transfer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 6,
    letterSpacing: -1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timerText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '550',
  },
  accountDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountNumberText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1,
  },
  copyBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
    lineHeight: 15,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '750',
  },
});
