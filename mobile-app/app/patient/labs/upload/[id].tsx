import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../services/api';
import { uploadToCloudinary } from '../../../../services/cloudinary';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function UploadLabResult() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [labTest, setLabTest] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLabTest();
  }, [id]);

  const loadLabTest = async () => {
    try {
      const res = await api.getLabTest(id);
      if (res.data) setLabTest(res.data);
    } catch (error) {
      console.error('Failed to load lab test:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('No image selected', 'Please select or capture a lab result image');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Upload image to Cloudinary
      console.log('[Upload] Uploading image to Cloudinary...');
      const uploadResult = await uploadToCloudinary(selectedImage);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
      
      console.log('[Upload] Image uploaded successfully:', uploadResult.url);

      // Step 2: Send the image URL to backend
      const res = await api.uploadLabResultWithImage(id, uploadResult.url, notes);
      
      if (res.data) {
        Alert.alert(
          'Success',
          'Your lab results have been uploaded successfully. Your doctor will review them shortly.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('[Upload] Error:', error);
      Alert.alert('Error', error.message || 'Failed to upload results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!labTest) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Lab test not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Results</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {/* Lab Test Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="flask" size={20} color="#3B82F6" />
            <Text style={styles.requisitionCode}>{labTest.requisition_code}</Text>
          </View>
          <View style={styles.testsList}>
            {labTest.tests?.map((test: any, idx: number) => (
              <Text key={idx} style={styles.testName}>• {test.name}</Text>
            ))}
          </View>
        </View>

        {/* Upload Section */}
        <Text style={styles.sectionTitle}>Upload Lab Result</Text>
        
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.changeImageBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
              <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.uploadGradient}>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.uploadBtnText}>Take Photo</Text>
                <Text style={styles.uploadBtnSubtext}>Capture lab report</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <View style={[styles.uploadGradient, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="images" size={28} color="#4A90E2" />
                <Text style={[styles.uploadBtnText, { color: '#1E293B' }]}>Choose from Gallery</Text>
                <Text style={[styles.uploadBtnSubtext, { color: '#64748B' }]}>Select existing photo</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any comments about the results..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Before uploading:</Text>
            <Text style={styles.instructionsText}>• Ensure all test results are clearly visible{'\n'}• Include the lab letterhead if possible{'\n'}• Make sure the image is well-lit and not blurry</Text>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedImage || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedImage || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Upload Results</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  requisitionCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  testsList: {
    gap: 6,
  },
  testName: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  uploadOptions: {
    gap: 12,
  },
  uploadBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
  },
  uploadBtnSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  changeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  instructionsCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
