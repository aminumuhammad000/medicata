import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
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
      // Create a top-up session (e.g. for 5000 Naira default or custom)
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
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Financial Wallet</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance?.balance || 0)}</Text>
            
            <View style={styles.actionRow}>
               <TouchableOpacity style={styles.mainActionBtn} onPress={handleTopUp}>
                  <View style={styles.actionIconBg}>
                    <Ionicons name="add" size={24} color="#0D1B3A" />
                  </View>
                  <Text style={styles.actionText}>Top Up</Text>
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.mainActionBtn}>
                  <View style={styles.actionIconBg}>
                    <Ionicons name="arrow-up" size={24} color="#0D1B3A" />
                  </View>
                  <Text style={styles.actionText}>Withdraw</Text>
               </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.txList}
        >
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <Animated.View 
                key={tx.id} 
                entering={FadeInDown.delay(index * 100)}
                style={styles.txItem}
              >
                <View style={[styles.txIconBg, { backgroundColor: tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings' ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Ionicons 
                    name={tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings' ? '#166534' : '#991B1B'} 
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{tx.description || tx.transaction_type}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                </View>
                <Text style={[styles.txAmount, (tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings') ? styles.plusAmount : styles.minusAmount]}>
                  {(tx.transaction_type === 'deposit' || tx.transaction_type === 'earnings') ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Top Up Modal (VTStack Display) */}
      <Modal visible={showTopUp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fund Your Wallet</Text>
              <TouchableOpacity onPress={() => setShowTopUp(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentInfoBox}>
              <Text style={styles.paymentInstruction}>Transfer to the virtual account below to fund your wallet instantly.</Text>
              
              <View style={styles.accountCard}>
                 <Text style={styles.bankName}>{checkoutSession?.bank_name}</Text>
                 <Text style={styles.accountNumber}>{checkoutSession?.account_number}</Text>
                 <Text style={styles.accountName}>{checkoutSession?.account_name}</Text>
                 
                 <TouchableOpacity style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={18} color="#fff" />
                    <Text style={styles.copyBtnText}>Copy Account Number</Text>
                 </TouchableOpacity>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color="#4A90E2" />
                <Text style={styles.warningText}>This account expires in 30 minutes. Ensure you transfer exactly {formatCurrency(checkoutSession?.amount || 0)}.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.doneBtn}
              onPress={() => {
                setShowTopUp(false);
                onRefresh();
              }}
            >
              <Text style={styles.doneBtnText}>I've Made The Transfer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  balanceContainer: { alignItems: 'center', marginTop: 32 },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' },
  balanceValue: { fontSize: 42, fontWeight: '900', color: '#fff', marginVertical: 8 },
  actionRow: { flexDirection: 'row', gap: 24, marginTop: 24 },
  mainActionBtn: { alignItems: 'center', gap: 8 },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, marginTop: -20 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  txTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  seeAllText: { fontSize: 14, color: '#4A90E2', fontWeight: '700' },
  txList: { paddingBottom: 40 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  txIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 16 },
  txType: { fontSize: 15, fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' },
  txDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  plusAmount: { color: '#10B981' },
  minusAmount: { color: '#EF4444' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  paymentInfoBox: { flex: 1 },
  paymentInstruction: { fontSize: 15, color: '#64748B', lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  accountCard: { backgroundColor: '#0D1B3A', borderRadius: 24, padding: 32, alignItems: 'center' },
  bankName: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  accountNumber: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 16 },
  accountName: { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 24 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  copyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  warningBox: { flexDirection: 'row', gap: 12, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, marginTop: 24 },
  warningText: { flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '600', lineHeight: 18 },
  doneBtn: { height: 56, backgroundColor: '#4A90E2', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
