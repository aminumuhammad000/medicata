import React from 'react';
import { Alert } from 'react-native';
import {
  LiveKitRoom,
  VideoConference,
  registerGlobals,
} from '@livekit/react-native';

// Necessary for LiveKit on React Native
registerGlobals();

export const LiveKitView = ({ isVideo, url, token, onDisconnected, onError }: any) => {
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={true}
      video={isVideo}
      onDisconnected={onDisconnected}
      onError={onError}
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
