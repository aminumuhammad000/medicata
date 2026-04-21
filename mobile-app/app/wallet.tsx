import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function WalletScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('patient');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const role = await AsyncStorage.getItem('user_role');
      setUserRole(role?.toLowerCase() || 'patient');

      // Mock data for now - would come from API
      setBalance(role === 'doctor' ? 125000 : 25000);
      setTransactions([
        { id: 1, type: 'credit', amount: 5000, description: 'Consultation fee', date: '2024-04-10', status: 'completed' },
        { id: 2, type: 'debit', amount: 3500, description: 'Pharmacy order', date: '2024-04-08', status: 'completed' },
        { id: 3, type: 'credit', amount: 7500, description: 'Consultation fee', date: '2024-04-05', status: 'completed' },
        { id: 4, type: 'debit', amount: 1200, description: 'Medicine purchase', date: '2024-04-03', status: 'completed' },
      ]);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    Alert.alert('Payment', `Add ₦${amount} to wallet`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay', onPress: () => {
        setBalance(balance + parseFloat(amount));
        setAmount('');
        setShowAddMoney(false);
        Alert.alert('Success', 'Money added to wallet');
      }}
    ]);
  };

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance');
      return;
    }
    Alert.alert('Withdraw', `Withdraw ₦${amount} to bank account`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => {
        setBalance(balance - parseFloat(amount));
        setAmount('');
        setShowWithdraw(false);
        Alert.alert('Success', 'Withdrawal request submitted');
      }}
    ]);
  };

  const TransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, item.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
        <Ionicons 
          name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
          size={20} 
          color={item.type === 'credit' ? '#22c55e' : '#ef4444'} 
        />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'credit' ? styles.creditText : styles.debitText]}>
        {item.type === 'credit' ? '+' : '-'}₦{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/analytics')}>
          <Ionicons name="analytics" size={24} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {userRole === 'doctor' ? 'Total Earnings' : 'Wallet Balance'}
          </Text>
          <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
          <Text style={styles.balanceSubtitle}>
            {userRole === 'doctor' ? 'Available for withdrawal' : 'Available for payments'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {userRole === 'doctor' ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]} 
              onPress={() => setShowWithdraw(true)}
            >
              <Ionicons name="cash-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.addButton]} 
              onPress={() => setShowAddMoney(true)}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Money Modal */}
        {showAddMoney && (
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Money to Wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (₦)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddMoney(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddMoney}>
                <Text style={styles.confirmBtnText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Withdraw to Bank</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (₦)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.hintText}>Available: ₦{balance.toLocaleString()}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdraw(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleWithdraw}>
                <Text style={styles.confirmBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Amounts */}
        {!showAddMoney && !showWithdraw && (
          <View style={styles.quickAmounts}>
            {['1000', '5000', '10000', '20000'].map((amt) => (
              <TouchableOpacity 
                key={amt} 
                style={styles.quickAmountBtn}
                onPress={() => setAmount(amt)}
              >
                <Text style={styles.quickAmountText}>₦{parseInt(amt).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.map((item) => (
            <TransactionItem key={item.id} item={item} />
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity style={styles.paymentMethodItem}>
            <Ionicons name="card" size={24} color="#4a90e2" />
            <View style={styles.paymentMethodContent}>
              <Text style={styles.paymentMethodTitle}>**** 1234</Text>
              <Text style={styles.paymentMethodSubtitle}>Visa - Default</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPaymentMethod}>
            <Ionicons name="add-circle" size={24} color="#4a90e2" />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#4a90e2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: '#22c55e',
  },
  withdrawButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: '#dcfce7',
  },
  debitIcon: {
    backgroundColor: '#fee2e2',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  transactionDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  creditText: {
    color: '#22c55e',
  },
  debitText: {
    color: '#ef4444',
  },
  paymentMethods: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentMethodContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  addPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addPaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90e2',
    marginLeft: 12,
  },
});
