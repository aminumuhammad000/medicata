import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../../components/onboarding/ProgressBar';

export default function DoctorVerifyScreen() {
  const router = useRouter();
  const { uploadVerificationDocs, loading: contextLoading, error } = useOnboarding();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadToCloudinary(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    setUploading(true);
    try {
      const data = new FormData();
      const filename = uri.split('/').pop() || 'license.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      data.append('file', { uri, name: filename, type });
      data.append('upload_preset', 'ml_default'); 
      data.append('api_key', '156352328942451');
      data.append('cloud_name', 'dtyxhp8uu');

      const response = await fetch('https://api.cloudinary.com/v1_1/dtyxhp8uu/image/upload', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.secure_url) {
        setImages(prev => [...prev, result.secure_url]);
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (images.length === 0) {
      Alert.alert('Required', 'Please upload at least one verification document.');
      return;
    }

    const success = await uploadVerificationDocs(images);
    if (success) {
      router.push('/onboarding/profile');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <ProgressBar currentStep={6} totalSteps={8} label="Professional Verification" />
        </View>

        <View style={styles.titleSection}>
          <View style={styles.iconBadge}>
            <LinearGradient colors={['#4A90E2', '#2572D9']} style={styles.iconGrad}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Verify License</Text>
          <Text style={styles.subtitle}>Please upload a clear photo of your medical practice license or professional ID card.</Text>
        </View>

        <View style={styles.uploadSection}>
          {images.length > 0 ? (
            <View style={styles.imageList}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage} disabled={uploading}>
                  <Ionicons name="add" size={32} color="#94A3B8" />
                  <Text style={styles.addMoreText}>Add Another</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="large" color="#2572D9" />
              ) : (
                <>
                  <View style={styles.iconCircle}>
                    <Ionicons name="cloud-upload-outline" size={40} color="#2572D9" />
                  </View>
                  <Text style={styles.uploadTitle}>Tap to Upload</Text>
                  <Text style={styles.uploadSubtitle}>JPG or PNG (Max 5MB)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, (images.length === 0 || contextLoading || uploading) && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={images.length === 0 || contextLoading || uploading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={images.length > 0 ? ['#4A90E2', '#2572D9'] : ['#CBD5E1', '#CBD5E1']}
            style={styles.buttonGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {contextLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 4,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  iconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'left',
    lineHeight: 20,
    maxWidth: '90%',
  },
  uploadSection: {
    paddingVertical: 20,
  },
  uploadBox: {
    height: 220,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '700',
  },
  uploadSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  imageList: {
    gap: 16,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  addMoreBtn: {
    width: '100%',
    height: 64,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  addMoreText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonGrad: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
