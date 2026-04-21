import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '../../../hooks/useWebSocket';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe WebRTC imports for Expo Go
let RTCView: any, mediaDevices: any, RTCPeerConnection: any;
try {
  const webrtc = require('react-native-webrtc');
  RTCView = webrtc.RTCView;
  mediaDevices = webrtc.mediaDevices;
  RTCPeerConnection = webrtc.RTCPeerConnection;
} catch (e) {
  console.warn('WebRTC native modules not found. Video calls will not work in Expo Go.');
}

// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VideoCallScreen() {
  const router = useRouter();
  const { id: consultationId } = useLocalSearchParams<{ id: string }>();
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [userId, setUserId] = useState<string>('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const { connected: wsConnected, sendMessage } = useWebSocket();

  useEffect(() => {
    loadUserId();
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    if (userId && wsConnected) {
      startLocalStream();
    }
  }, [userId, wsConnected]);

  const loadUserId = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserId(parsed.id || '');
    }
  };

  const startLocalStream = async () => {
    if (!mediaDevices) {
      Alert.alert('Not Supported', 'Video calls require a development build. They are not supported in Expo Go.');
      return;
    }
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: 640,
          height: 480,
        },
      });
      setLocalStream(stream);
      initializePeerConnection(stream);
    } catch (err) {
      console.error('Failed to get local stream:', err);
      Alert.alert('Error', 'Failed to access camera/microphone');
    }
  };

  const initializePeerConnection = (stream: any) => {
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setCallStatus('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        sendMessage({
          type: 'webrtc_ice',
          consultation_id: consultationId,
          user_id: userId,
          candidate: JSON.stringify(event.candidate),
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      }
    };
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack._switchCamera();
          setIsFrontCamera(!isFrontCamera);
        } catch (err) {
          console.error('Failed to switch camera:', err);
        }
      }
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('ended');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
        </Text>
        {wsConnected && (
          <View style={styles.signalIndicator}>
            <Ionicons name="wifi" size={16} color="#22c55e" />
            <Text style={styles.signalText}>Good</Text>
          </View>
        )}
      </View>

      {/* Remote Video (Full Screen) */}
      <View style={styles.remoteVideoContainer}>
        {!RTCPeerConnection ? (
          <View style={styles.waitingContainer}>
            <Ionicons name="warning" size={50} color="#f59e0b" />
            <Text style={styles.waitingText}>WebRTC not available in Expo Go</Text>
            <Text style={[styles.waitingText, { fontSize: 12, marginTop: 8 }]}>Please use a Development Build for video calls.</Text>
          </View>
        ) : remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.waitingText}>Waiting for other participant...</Text>
          </View>
        )}
      </View>

      {/* Local Video (Picture-in-Picture) */}
      <View style={styles.localVideoContainer}>
        {localStream ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        ) : (
          <View style={styles.localVideoPlaceholder}>
            <Ionicons name="videocam-off" size={30} color="#fff" />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.controlButtonActive]} 
          onPress={toggleMute}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]} 
          onPress={toggleVideo}
        >
          <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Button */}
      <TouchableOpacity style={styles.chatButton}>
        <Ionicons name="chatbubble" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  signalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalText: {
    color: '#22c55e',
    fontSize: 12,
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteVideo: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  waitingText: {
    color: '#fff',
    fontSize: 16,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  localVideo: {
    flex: 1,
    backgroundColor: '#4a90e2',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ef4444',
  },
  endCallButton: {
    backgroundColor: '#ef4444',
    transform: [{ rotate: '135deg' }],
  },
  chatButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74,144,226,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
