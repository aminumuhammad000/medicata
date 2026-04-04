import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ConsultationBridge() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Main Video (Patient) */}
        <View style={styles.remoteVideo}>
          <Ionicons name="person" size={100} color="#666" />
          <Text style={styles.waitingText}>Connecting to Dr. Connor...</Text>
        </View>

        {/* Local Video Overlay */}
        <View style={styles.localVideo}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </View>

        {/* Info Header */}
        <View style={styles.infoOverlay}>
          <Text style={styles.doctorName}>Dr. Sarah Connor</Text>
          <View style={styles.timerRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.timer}>12:45</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="mic-off" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.endCall]} onPress={() => router.back()}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="videocam-off" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 180,
    backgroundColor: '#444',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    gap: 8,
  },
  doctorName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
  timer: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCall: {
    backgroundColor: '#f44336',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
