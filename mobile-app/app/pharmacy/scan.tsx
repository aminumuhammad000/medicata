import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function QRScannerScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#64748B" />
          <Text style={styles.permissionText}>We need your permission to use the camera</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // Assuming the data is a UUID token
      const response = await api.verifyPrescription(data);
      if (response.data) {
        // Navigate to dispense confirmation with prescription data
        router.push({
          pathname: '/pharmacy/dispense',
          params: { token: data, prescription: JSON.stringify(response.data) }
        } as any);
      } else {
        Alert.alert("Invalid QR", "This prescription code is not recognized.", [
          { text: "Try Again", onPress: () => setScanned(false) }
        ]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to verify prescription.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* CameraView must have no children — overlay uses absolute positioning */}
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay placed outside CameraView with absolute fill */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={styles.topSection}>
          {!isTab && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Scan Prescription</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerSection}>
          <View style={styles.scannerOutline}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            {loading && <ActivityIndicator size="large" color="#FFFFFF" />}
          </View>
          <Text style={styles.hintText}>Align the patient's QR code within the frame</Text>
        </View>

        {/* Plain semi-transparent View instead of BlurView (BlurView unsupported in Expo Go) */}
        <View style={styles.bottomSection}>
          <Text style={styles.infoText}>Scanning for Medicata Prescriptions...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '600',
  },
  permissionBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  centerSection: {
    alignItems: 'center',
  },
  scannerOutline: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4F46E5',
  },
  hintText: {
    color: '#FFF',
    marginTop: 30,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bottomSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
});
