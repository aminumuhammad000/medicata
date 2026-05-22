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
      <LinearGradient
        colors={['#0D1B3A', '#1E3A5F', '#2572D9']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <ProgressBar currentStep={6} totalSteps={8} label="Professional Verification" />
        <View style={styles.header}>
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
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage} disabled={uploading}>
                  <Ionicons name="add" size={32} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.addMoreText}>Add Another</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="large" color="#4A90E2" />
              ) : (
                <>
                  <View style={styles.iconCircle}>
                    <Ionicons name="cloud-upload" size={40} color="#4A90E2" />
                  </View>
                  <Text style={styles.uploadTitle}>Tap to Upload</Text>
                  <Text style={styles.uploadSubtitle}>JPG or PNG (Max 5MB)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.button, (images.length === 0 || contextLoading || uploading) && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={images.length === 0 || contextLoading || uploading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2572D9', '#4A90E2']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {contextLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B3A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  uploadSection: {
    marginBottom: 32,
  },
  uploadBox: {
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  uploadSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  addMoreBtn: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  addMoreText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
