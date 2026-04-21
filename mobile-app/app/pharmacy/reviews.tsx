import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

export default function PharmacyReviewsScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const user = await api.getUserData();
      setUserData(user);
      if (user?.id) {
        const response = await api.getReviews(user.id);
        setReviews(response.data || []);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Ionicons 
            key={s} 
            name={s <= rating ? "star" : "star-outline"} 
            size={16} 
            color="#F59E0B" 
          />
        ))}
      </View>
    );
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1B3A', '#1E3A5F']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.header}>
        {!isTab && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, isTab && { marginLeft: 0 }]}>Customer Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Overall Rating</Text>
          <View style={styles.ratingLargeRow}>
            <Text style={styles.ratingLargeText}>{averageRating}</Text>
            <View>
              {renderStars(Math.round(parseFloat(averageRating)))}
              <Text style={styles.reviewCountText}>Based on {reviews.length} reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewsList}>
          <Text style={styles.sectionTitle}>Recent Feedback</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0D1B3A" style={{ marginTop: 20 }} />
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.userIcon}>
                    <Ionicons name="person" size={20} color="#64748B" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>Verified Patient</Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text style={styles.reviewComment}>{review.comment || 'No comment provided.'}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)' },
      default: { elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  ratingLargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ratingLargeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D1B3A',
    marginBottom: 16,
    marginLeft: 4,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});

