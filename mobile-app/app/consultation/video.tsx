import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import {
  LiveKitRoom,
  VideoConference,
  registerGlobals,
} from '@livekit/react-native';

// Necessary for LiveKit on React Native
registerGlobals();

export default function VideoCallScreen() {
  const router = useRouter();
  const { consultationId, mode } = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isVideo = mode === 'video';

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const res = await api.getLiveKitToken(consultationId as string);
      if (res.data) {
        setToken(res.data.token);
        setUrl(res.data.url);
      } else {
        throw new Error('Could not get session token');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join video call');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Initializing secure {isVideo ? 'video' : 'audio'}...</Text>
      </View>
    );
  }

  if (!token || !url) {
    return (
      <View style={styles.center}>
        <Text>Failed to load {isVideo ? 'video' : 'audio'} session.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{color: '#4F46E5', marginTop: 10}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect={true}
        audio={true}
        video={isVideo}
        onDisconnected={() => {
          Alert.alert('Call Ended', `The ${isVideo ? 'video' : 'audio'} consultation has ended.`);
          router.back();
        }}
        onError={(err) => {
          console.error(err);
          Alert.alert('Connection Error', 'Failed to connect to video server.');
          router.back();
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
  },
});
