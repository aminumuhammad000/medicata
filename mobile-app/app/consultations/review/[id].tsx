import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';

export default function ReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await api.submitReview(id as string, rating, comment || undefined);
      Alert.alert('Success', 'Review submitted successfully');
      router.replace('/(tabs)/explore');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Rate Consultation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.doctorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
          <Text style={styles.doctorName}>Dr. Sarah Connor</Text>
          <Text style={styles.date}>June 15, 2026</Text>
        </View>

        <Text style={styles.question}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Ionicons 
                name={s <= rating ? "star" : "star-outline"} 
                size={48} 
                color={s <= rating ? "#ff9800" : "#ccc"} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Add a comment (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us more about the consultation..."
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    padding: 24,
    alignItems: 'center',
  },
  doctorInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  inputSection: {
    width: '100%',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#4a90e2',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
