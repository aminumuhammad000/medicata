import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
// WebRTC requires development build, not supported in Expo Go
// import { RTCView } from 'react-native-webrtc';
// import { mediaDevices, RTCPeerConnection } from 'react-native-webrtc';

export default function ConsultationBridge() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // WebRTC state
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Initialize call when component mounts
    initializeCall();
    
    // Timer for call duration
    const timer = setInterval(() => {
      if (isConnected) {
        setCallDuration(prev => prev + 1);
      }
    }, 1000);
    
    return () => {
      clearInterval(timer);
      cleanup();
    };
  }, [id]);
  
  const initializeCall = async () => {
    try {
      // TODO: Implement WebRTC initialization
      // 1. Request camera/microphone permissions
      // 2. Get local media stream
      // 3. Create RTCPeerConnection
      // 4. Connect to signaling server (WebSocket)
      // 5. Exchange ICE candidates and SDP offers/answers
      
      console.log('Initializing call for consultation:', id);
      // Placeholder for actual WebRTC implementation
    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  };
  
  const cleanup = () => {
    // TODO: Cleanup WebRTC resources
    // if (localStreamRef.current) {
    //   localStreamRef.current.getTracks().forEach(track => track.stop());
    // }
    // if (peerConnection.current) {
    //   peerConnection.current.close();
    // }
  };
  
  const toggleMute = () => {
    // TODO: Toggle microphone
    setIsMuted(!isMuted);
  };
  
  const toggleCamera = () => {
    // TODO: Toggle camera
    setIsCameraOff(!isCameraOff);
  };
  
  const switchCamera = () => {
    // TODO: Switch between front and back camera
  };
  
  const endCall = async () => {
    cleanup();
    // TODO: Update consultation status in backend
    router.back();
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {/* Main Video (Remote/Doctor) */}
        <View style={styles.remoteVideo}>
          {isConnected ? (
            // WebRTC requires development build, not supported in Expo Go
            // <RTCView
            //   streamURL={remoteStream?.toURL()}
            //   style={styles.video}
            //   objectFit="cover"
            // />
            <View style={styles.videoPlaceholder}>
              <Ionicons name="person" size={100} color="#666" />
              <Text style={styles.waitingText}>Video call connected</Text>
              <Text style={styles.waitingText}>(WebRTC requires development build)</Text>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="person" size={100} color="#666" />
              <Text style={styles.waitingText}>Connecting to doctor...</Text>
            </View>
          )}
        </View>

        {/* Local Video Overlay */}
        <View style={styles.localVideo}>
          {isCameraOff ? (
            <View style={styles.cameraOffPlaceholder}>
              <Ionicons name="videocam-off" size={32} color="#fff" />
            </View>
          ) : (
            // WebRTC requires development build, not supported in Expo Go
            // <RTCView
            //   streamURL={localStream?.toURL()}
            //   style={styles.video}
            //   objectFit="cover"
            // />
            <View style={styles.videoPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
              <Text style={styles.waitingText}>You</Text>
            </View>
          )}
          <TouchableOpacity style={styles.switchCameraBtn} onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info Header */}
        <View style={styles.infoOverlay}>
          <Text style={styles.doctorName}>Dr. Sarah Connor</Text>
          {isConnected && (
            <View style={styles.timerRow}>
              <View style={styles.recordingDot} />
              <Text style={styles.timer}>{formatDuration(callDuration)}</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.endCall]} onPress={endCall}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]} 
            onPress={toggleCamera}
          >
            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
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
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
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
  cameraOffPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchCameraBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
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
  controlBtnActive: {
    backgroundColor: '#f44336',
  },
  endCall: {
    backgroundColor: '#f44336',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
