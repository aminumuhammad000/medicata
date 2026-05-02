import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LabResults() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [labTest, setLabTest] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const res = await api.getLabTest(id as string);
      if (res.data) {
        setLabTest(res.data);
        setComment(res.data.result_summary || '');
      }
    } catch (error) {
      console.error('Failed to load lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async () => {
    if (!comment.trim()) return;
    setIsSavingComment(true);
    try {
      await api.addLabTestComment(id as string, comment);
      alert('Comment saved successfully');
      loadResults();
    } catch (error) {
      alert('Failed to save comment');
    } finally {
      setIsSavingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
      </View>
    );
  }

  if (!labTest) {
    return (
      <View style={styles.errorContainer}>
        <Text>Lab test results not found.</Text>
      </View>
    );
  }

  const resultFiles = Array.isArray(labTest.result_files) ? labTest.result_files : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lab Test Results</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requisition Code:</Text>
            <Text style={styles.infoValue}>{labTest.requisition_code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.statusText, { color: '#22C55E' }]}>{labTest.status.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completed At:</Text>
            <Text style={styles.infoValue}>
              {labTest.completed_at ? new Date(labTest.completed_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Uploaded Result Images</Text>
        
        {resultFiles.length === 0 ? (
          <View style={styles.emptyResults}>
            <Ionicons name="images-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No result images uploaded</Text>
          </View>
        ) : (
          <View style={styles.imageGrid}>
            {resultFiles.map((file: any, index: number) => (
              <TouchableOpacity 
                key={index} 
                style={styles.imageWrapper}
                onPress={() => setSelectedImage(file.url || file)}
              >
                <Image 
                  source={{ uri: file.url || file }} 
                  style={styles.resultImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Clinical Comment & Summary</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Add your clinical findings or instructions based on these results..."
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity 
            style={[styles.saveCommentBtn, !comment.trim() && styles.disabledBtn]} 
            onPress={handleSaveComment}
            disabled={isSavingComment || !comment.trim()}
          >
            {isSavingComment ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveCommentBtnText}>Save Comment</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.prescribeBtn}
          onPress={() => router.push({
            pathname: '/doctor/prescription/create',
            params: { 
              consultationId: labTest.consultation_id, 
              patientId: labTest.patient_id 
            }
          })}
        >
          <Ionicons name="medical" size={20} color="#fff" />
          <Text style={styles.prescribeBtnText}>Write Prescription</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal visible={!!selectedImage} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeModal}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#64748B', fontSize: 14 },
  infoValue: { color: '#1E293B', fontWeight: '700', fontSize: 14 },
  statusText: { fontWeight: '800', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageWrapper: { width: (width - 52) / 2, height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  resultImage: { width: '100%', height: '100%' },
  emptyResults: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyText: { color: '#64748B', marginTop: 12, fontWeight: '600' },
  summaryCard: { backgroundColor: '#F0F9FF', borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#B9E6FE' },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0369A1', marginBottom: 12 },
  commentInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 14, color: '#1E293B', textAlignVertical: 'top', height: 100, borderWidth: 1, borderColor: '#B9E6FE' },
  saveCommentBtn: { backgroundColor: '#0369A1', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  saveCommentBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabledBtn: { opacity: 0.6 },
  prescribeBtn: { backgroundColor: '#4A90E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10, marginTop: 32, marginBottom: 40 },
  prescribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
});
