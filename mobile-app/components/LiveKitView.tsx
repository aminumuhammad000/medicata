import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const LiveKitView = ({ isVideo, url, token, onDisconnected, onError }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Video consultations are not supported in the web browser yet.</Text>
      <Text style={styles.subtext}>Please use our mobile app for secure video calls.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
