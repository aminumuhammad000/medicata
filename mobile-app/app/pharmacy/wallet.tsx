import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

export default function PharmacyWallet() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBankSetup, setShowBankSetup] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Bank setup state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceRes, txRes, meRes] = await Promise.all([
        api.getWalletBalance(),
        api.getWalletTransactions(),
        api.getMe()
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(txRes.data || []);

      if (meRes.data.bank_name) {
        setBankName(meRes.data.bank_name);
        setAccountNumber(meRes.data.account_number);
        setAccountName(meRes.data.account_name);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankName || !accountNumber || !accountName) {
      Alert.alert("Error", "Please fill in all bank details");
      return;
    }
    setSavingBank(true);
    try {
      await api.updatePayoutInfo({
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName
      });
      setShowBankSetup(false);
      Alert.alert("Success", "Payout information updated");
    } catch (err: any) {
      Alert.alert("Error", "Failed to update bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleRequestPayout = () => {
    if (!bankName) {
      Alert.alert("Setup Required", "Please set up your bank details first.", [
        { text: "Later" },
        { text: "Setup Now", onPress: () => setShowBankSetup(true) }
      ]);
      return;
    }
    if (balance < 5000) {
      Alert.alert("Minimum Amount", "Minimum payout threshold is ₦5,000.");
      return;
    }
    Alert.alert("Confirm Payout", `Payout ₦${balance.toLocaleString()} to ${bankName}?`, [
      { text: "Cancel" },
      { text: "Request", onPress: () => Alert.alert("Request Received", "Your payout request has been sent for processing.") }
    ]);
  };

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
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings & Wallet</Text>
        <TouchableOpacity onPress={() => setShowBankSetup(true)} style={styles.bankBtn}>
          <Ionicons name="business" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Earnings</Text>
          <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
          <TouchableOpacity style={styles.payoutBtn} onPress={handleRequestPayout}>
            <LinearGradient
              colors={['#4F46E5', '#3B82F6']}
              style={styles.payoutGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.payoutBtnText}>Request Payout</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₦{(balance * 0.92).toLocaleString()}</Text>
            <Text style={styles.statLab}>Net Profit</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₦{(balance * 0.08).toLocaleString()}</Text>
            <Text style={styles.statLab}>Medicata fee</Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0D1B3A" style={{ marginTop: 20 }} />
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.txItem}>
                <View style={[styles.txIcon, tx.transaction_type === 'credit' ? styles.txCredit : styles.txDebit]}>
                  <Ionicons
                    name={tx.transaction_type === 'credit' ? "arrow-down" : "arrow-up"}
                    size={20}
                    color={tx.transaction_type === 'credit' ? "#10B981" : "#EF4444"}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.description || 'Pharmacy Order'}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, tx.transaction_type === 'credit' ? { color: '#10B981' } : { color: '#EF4444' }]}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showBankSetup && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Settings</Text>
              <TouchableOpacity onPress={() => setShowBankSetup(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Zenith Bank"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10 digits"
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  maxLength={10}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Legal Business Name"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBankBtn, savingBank && { opacity: 0.6 }]}
                onPress={handleSaveBank}
                disabled={savingBank}
              >
                {savingBank ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBankText}>Save Bank Details</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bankBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
  },
  payoutBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  payoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#2563EB',
  },
  payoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLab: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  historySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txCredit: {
    backgroundColor: '#F0FDF4',
  },
  txDebit: {
    backgroundColor: '#FEF2F2',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
    fontWeight: '700',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBankBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBankText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
