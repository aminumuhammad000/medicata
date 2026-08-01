import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const loadData = async () => {
    try {
      const [balRes, transRes] = await Promise.all([
        api.getWalletBalance(),
        api.getWalletTransactions()
      ]);
      setBalance(balRes.data);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleTopUp = async () => {
    setTopUpLoading(true);
    try {
      const res = await api.initializeCheckout({
        amount: 500000, // 5000 Naira in kobo
        type: 'topup'
      });
      if (res.data) {
        setCheckoutSession(res.data);
        setShowTopUp(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTopUpLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Fetching balance details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity style={styles.infoBtn} onPress={onRefresh}>
          <Ionicons name="sync" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card (Flat minimalist Google Pay style) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.shieldRow}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.secureText}>Secure wallet</Text>
            </View>
          </View>
          <Text style={styles.balanceValue}>{formatCurrency(balance?.balance || 0)}</Text>
          
          <View style={styles.divider} />

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.topUpBtn]} 
              onPress={handleTopUp}
              disabled={topUpLoading}
            >
              {topUpLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.topUpBtnText}>Add Money</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.withdrawBtn]}
              onPress={() => alert('Withdrawal service setup completed on settings')}
            >
              <Ionicons name="arrow-up" size={16} color="#475569" />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions Info Header */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View all history</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        {transactions.length > 0 ? (
          transactions.map((tx, index) => {
            const isDeposit = tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings';
            return (
              <Animated.View 
                key={tx.id} 
                entering={FadeInDown.delay(index * 50)}
                style={styles.txItem}
              >
                <View style={[styles.txIconBg, { backgroundColor: isDeposit ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Ionicons 
                    name={isDeposit ? 'arrow-down-outline' : 'arrow-up-outline'} 
                    size={16} 
                    color={isDeposit ? '#059669' : '#DC2626'} 
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{tx.description || tx.transaction_type}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                </View>
                <Text style={[styles.txAmount, isDeposit ? styles.plusAmount : styles.minusAmount]}>
                  {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="wallet-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No transaction history</Text>
            <Text style={styles.emptySubtitle}>Fund your account or pay bills to view recent transactions.</Text>
          </View>
        )}
      </ScrollView>

      {/* Top Up Modal */}
      <Modal visible={showTopUp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fund Account</Text>
              <TouchableOpacity onPress={() => setShowTopUp(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentInfoBox}>
              <Text style={styles.paymentInstruction}>
                Make a bank transfer to the virtual account below to instantly fund your wallet.
              </Text>
              
              <View style={styles.accountCard}>
                 <Text style={styles.bankName}>{checkoutSession?.bank_name || 'STERLING BANK'}</Text>
                 <Text style={styles.accountNumber}>{checkoutSession?.account_number || '0000000000'}</Text>
                 <Text style={styles.accountName}>{checkoutSession?.account_name || 'MEDICATA PATIENT'}</Text>
                 
                 <TouchableOpacity style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={14} color="#2563EB" />
                    <Text style={styles.copyBtnText}>Copy Account Code</Text>
                 </TouchableOpacity>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
                <Text style={styles.warningText}>
                  This virtual account will expire in 30 minutes. Remit exact amount: {formatCurrency(checkoutSession?.amount || 500000)}.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.doneBtn}
              onPress={() => {
                setShowTopUp(false);
                onRefresh();
              }}
            >
              <Text style={styles.doneBtnText}>Confirm Transfer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  infoBtn: {
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  balanceValue: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginTop: 8,
    letterSpacing: -1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 12, 
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  topUpBtn: {
    backgroundColor: '#2563EB',
  },
  topUpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  withdrawBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  txHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  txTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: { 
    fontSize: 12, 
    color: '#2563EB', 
    fontWeight: '800' 
  },
  txItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  txIconBg: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  txInfo: { 
    flex: 1, 
    marginLeft: 12 
  },
  txType: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#0F172A', 
    textTransform: 'capitalize' 
  },
  txDate: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 2,
    fontWeight: '600',
  },
  txAmount: { 
    fontSize: 14, 
    fontWeight: '800' 
  },
  plusAmount: { 
    color: '#059669' 
  },
  minusAmount: { 
    color: '#DC2626' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    paddingVertical: 50,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 6 
  },
  emptySubtitle: { 
    fontSize: 13, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 18,
    fontWeight: '500',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.4)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfoBox: { 
    marginBottom: 20 
  },
  paymentInstruction: { 
    fontSize: 13, 
    color: '#64748B', 
    lineHeight: 18, 
    textAlign: 'center', 
    marginBottom: 20,
    fontWeight: '600',
  },
  accountCard: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'center' 
  },
  bankName: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  accountNumber: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#0F172A', 
    letterSpacing: 2, 
    marginBottom: 8 
  },
  accountName: { 
    fontSize: 13, 
    color: '#475569', 
    fontWeight: '700', 
    marginBottom: 16 
  },
  copyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  copyBtnText: { 
    color: '#2563EB', 
    fontSize: 12, 
    fontWeight: '800' 
  },
  warningBox: { 
    flexDirection: 'row', 
    gap: 8, 
    backgroundColor: '#F0F9FF', 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 16 
  },
  warningText: { 
    flex: 1, 
    fontSize: 11, 
    color: '#0284C7', 
    fontWeight: '700', 
    lineHeight: 15 
  },
  doneBtn: { 
    height: 48, 
    backgroundColor: '#2563EB', 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  doneBtnText: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
});
