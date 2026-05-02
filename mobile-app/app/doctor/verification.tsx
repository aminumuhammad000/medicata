import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';

interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
}

export default function DoctorVerification() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickDocument = async () => {
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
      const asset = result.assets[0];
      const newDoc: DocumentFile = {
        uri: asset.uri,
        name: asset.fileName || `document_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        status: 'pending',
      };
      setDocuments([...documents, newDoc]);
    }
  };

  const removeDocument = (index: number) => {
    const updated = [...documents];
    updated.splice(index, 1);
    setDocuments(updated);
  };

  const handleSubmit = async () => {
    if (documents.length === 0) {
      Alert.alert('No documents', 'Please add at least one document (ID or Medical License)');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedDocs = [];

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        // Update status to uploading
        const updatedDocs = [...documents];
        updatedDocs[i].status = 'uploading';
        setDocuments(updatedDocs);

        const uploadRes = await uploadToCloudinary(doc.uri);
        
        if (uploadRes.success && uploadRes.url) {
          uploadedDocs.push({
            name: doc.name,
            url: uploadRes.url,
            uploaded_at: new Date().toISOString(),
          });
          
          const finalDocs = [...documents];
          finalDocs[i].status = 'success';
          finalDocs[i].url = uploadRes.url;
          setDocuments(finalDocs);
        } else {
          throw new Error(`Failed to upload ${doc.name}`);
        }
      }

      // Send to backend
      const res = await api.uploadVerificationDocuments(uploadedDocs);
      
      if (res.data) {
        Alert.alert(
          'Success', 
          'Your documents have been uploaded and are now under review. We will notify you once verified.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      console.error('[Verification] Error:', error);
      Alert.alert('Upload Failed', error.message || 'Something went wrong during upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Professional Verification</Text>
              <Text style={styles.headerSubtitle}>Upload your medical credentials</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={32} color="#4A90E2" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Why verify?</Text>
            <Text style={styles.infoDescription}>
              Verified doctors gain higher trust from patients and are eligible for premium consultation features.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Required Documents</Text>
        <Text style={styles.sectionSubtitle}>Please upload clear photos of your Government ID and Medical License.</Text>

        <View style={styles.documentList}>
          {documents.map((doc, index) => (
            <View key={index} style={styles.docItem}>
              <Image source={{ uri: doc.uri }} style={styles.docPreview} />
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <View style={styles.statusRow}>
                  {doc.status === 'uploading' && <ActivityIndicator size="small" color="#4A90E2" />}
                  {doc.status === 'success' && <Ionicons name="checkmark-circle" size={16} color="#22C55E" />}
                  {doc.status === 'error' && <Ionicons name="alert-circle" size={16} color="#EF4444" />}
                  <Text style={[
                    styles.statusText,
                    doc.status === 'success' && { color: '#22C55E' },
                    doc.status === 'error' && { color: '#EF4444' }
                  ]}>
                    {doc.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => removeDocument(index)} 
                disabled={isSubmitting}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          ))}

          {documents.length < 5 && (
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={pickDocument}
              disabled={isSubmitting}
            >
              <Ionicons name="add-circle-outline" size={32} color="#4A90E2" />
              <Text style={styles.addBtnText}>Add Document</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (documents.length === 0 || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={documents.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit for Verification</Text>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginLeft: 8 }} />
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
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  documentList: {
    gap: 16,
  },
  docItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  removeBtn: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 12,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A90E2',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: '#4A90E2',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
