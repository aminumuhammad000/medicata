import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../services/api';

export default function PharmacyOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const role = await api.getUserRole();
      setUserRole(role);
      const response = await api.getOrderDetails(id as string);
      if (response.error) {
        throw new Error(response.error);
      }
      setOrder(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await api.updateOrderStatus(id as string, newStatus);
      if (response.error) {
        throw new Error(response.error);
      }
      setOrder({ ...order, status: newStatus });
      Alert.alert("Success", `Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      loadData(); // Refresh to get server-side updates
    } catch (err: any) {
      Alert.alert("Error", err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReview = async () => {
    setSubmittingReview(true);
    try {
      await api.submitReview(order.id, rating, comment);
      setShowReviewModal(false);
      Alert.alert("Thank You", "Your feedback helps us improve our service!");
    } catch (err: any) {
      Alert.alert("Error", "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const isPharmacy = userRole?.toLowerCase() === 'pharmacy';
  const statuses = ['pending', 'processing', 'ready_for_pickup', 'picked_up'];
  const displayStatuses = ['Pending', 'Processing', 'Ready for Pickup', 'Picked Up'];
  const isCompleted = ['picked_up', 'completed', 'delivered'].includes(order?.status?.toLowerCase());

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isPharmacy && (
        <LinearGradient
          colors={['#0D1B3A', '#1E3A5F']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isPharmacy ? "#FFF" : "#0F172A"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isPharmacy && { color: '#FFF' }]}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderBadgeContainer}>
          <Text style={styles.orderIdText}>#ORD-{id?.toString().slice(0, 8).toUpperCase()}</Text>
          <View style={[styles.mainStatusBadge, getStatusBadgeStyle(order?.status)]}>
            <Text style={[styles.mainStatusText, getStatusTextStyle(order?.status)]}>{order?.status.toUpperCase()}</Text>
          </View>
        </View>

        {!isPharmacy && isCompleted && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Help us improve</Text>
            </View>
            <Text style={styles.reviewPrompt}>How was your experience with this pharmacy?</Text>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
              <Text style={styles.reviewBtnText}>Rate Pharmacy Details</Text>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>{isPharmacy ? 'Customer Information' : 'Pharmacy Details'}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{isPharmacy ? (order?.patient_name || 'Valued Customer') : (order?.pharmacy_name || 'Partner Pharmacy')}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#94A3B8" />
              <Text style={styles.infoText}>{isPharmacy ? (order?.delivery_address || 'Pickup at Pharmacy') : (order?.pharmacy_address || 'Address not available')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color="#94A3B8" />
              <Text style={styles.infoText}>{isPharmacy ? (order?.contact_info || 'No contact provided') : (order?.pharmacy_contact_info || 'No contact provided')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Prescription Info</Text>
          </View>
          <View style={styles.prescriptionInfo}>
            <Text style={styles.metaLabel}>Prescription ID</Text>
            <Text style={styles.metaValue}>{order?.prescription_id || 'Direct Purchase'}</Text>
            
            <View style={styles.separator} />
            
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Order Type</Text>
                <Text style={styles.metaValue}>{order?.is_delivery ? 'Home Delivery' : 'In-Store Pickup'}</Text>
              </View>
              {order?.preferred_time && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>Preferred Time</Text>
                  <Text style={styles.metaValue}>{new Date(order.preferred_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Order Items */}
        {order?.items && order.items.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={20} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Order Items</Text>
            </View>
            <View style={styles.itemsList}>
              {order.items.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.drug_name || 'Unknown Medication'}</Text>
                    <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₦{order?.order?.total_amount?.toLocaleString() || '0'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-network" size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Fulfillment Status</Text>
          </View>
          <View style={styles.timeline}>
            {statuses.map((s, i) => {
              const currentStatus = order?.status?.toLowerCase().replace(/_/g, '') || '';
              const checkStatus = s.toLowerCase().replace(/_/g, '');
              const currentIndex = statuses.findIndex(st => st.toLowerCase().replace(/_/g, '') === currentStatus);
              const isActive = i <= currentIndex || currentStatus === checkStatus;
              const isCurrent = currentStatus === checkStatus;
              return (
                <View key={s} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineCircle, isActive && styles.timelineCircleActive, isCurrent && styles.timelineCircleCurrent]}>
                      {isActive && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </View>
                    {i < statuses.length - 1 && (
                      <View style={[styles.timelineLine, i < currentIndex && styles.timelineLineActive]} />
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.timelineContent}
                    onPress={() => isPharmacy && !updating && updateStatus(s)}
                    disabled={!isPharmacy || updating || isActive}
                  >
                    <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>{displayStatuses[i]}</Text>
                    <Text style={styles.timelineSub}>{getStatusSubtext(s)}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {isPharmacy && !['picked_up', 'completed', 'delivered'].includes(order?.status?.toLowerCase()) && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.primaryAction, updating && styles.disabledAction]}
              onPress={() => updateStatus(getNextStatus(order.status))}
              disabled={updating}
            >
              <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                style={styles.actionGradient}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionText}>Move to {getNextStatus(order.status)}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showReviewModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.starSelection}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons 
                    name={s <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color="#F59E0B" 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.reviewInputBox}>
              <Text style={styles.inputLabel}>Tell us more (Optional)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your feedback..."
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submittingReview && { opacity: 0.6 }]}
              onPress={handleReview}
              disabled={submittingReview}
            >
              {submittingReview ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getNextStatus = (current: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'processing',
    'processing': 'ready_for_pickup',
    'ready_for_pickup': 'picked_up',
    'ReadyForPickup': 'picked_up',
    'ready': 'picked_up',
  };
  return statusMap[current] || current;
};

const getStatusSubtext = (status: string) => {
  const subtextMap: { [key: string]: string } = {
    'pending': 'Order placed by customer',
    'processing': 'Medication is being prepared',
    'ready_for_pickup': 'Available for pickup/delivery',
    'picked_up': 'Order completed',
    'ReadyForPickup': 'Available for pickup/delivery',
    'PickedUp': 'Order completed',
  };
  return subtextMap[status] || '';
};

const getStatusBadgeStyle = (status: string) => {
  const normalized = status?.toLowerCase().replace(/_/g, '');
  switch (normalized) {
    case 'pending': return { backgroundColor: '#FFFBEB' };
    case 'processing': return { backgroundColor: '#EFF6FF' };
    case 'readyforpickup':
    case 'ready': return { backgroundColor: '#ECFDF5' };
    case 'pickedup':
    case 'delivered':
    case 'completed': return { backgroundColor: '#F1F5F9' };
    default: return { backgroundColor: '#F8FAFC' };
  }
};

const getStatusTextStyle = (status: string) => {
  const normalized = status?.toLowerCase().replace(/_/g, '');
  switch (normalized) {
    case 'pending': return { color: '#F59E0B' };
    case 'processing': return { color: '#3B82F6' };
    case 'readyforpickup':
    case 'ready': return { color: '#10B981' };
    case 'pickedup':
    case 'delivered':
    case 'completed': return { color: '#64748B' };
    default: return { color: '#64748B' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  orderBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
    letterSpacing: 1,
  },
  mainStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mainStatusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' },
      default: { elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    gap: 12,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  prescriptionInfo: {
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemQty: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D1B3A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
  },
  reviewPrompt: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8,
  },
  reviewBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
      default: { elevation: 20 }
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  starSelection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  reviewInputBox: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineCircleActive: {
    backgroundColor: '#10B981',
  },
  timelineCircleCurrent: {
    backgroundColor: '#4F46E5',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: -2,
  },
  timelineLineActive: {
    backgroundColor: '#10B981',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94A3B8',
  },
  timelineLabelActive: {
    color: '#0F172A',
  },
  timelineSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 8,
  },
  primaryAction: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  disabledAction: {
    opacity: 0.6,
  },
});

