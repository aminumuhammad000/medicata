/**
 * DoctorAvatar
 * ─────────────────────────────────────────────────────────────
 * Reusable avatar component used on every page that shows a
 * doctor or participant identity.
 *
 * • If `imageUrl` is provided and loads successfully → shows the photo.
 * • If the image fails to load OR no URL is provided → falls back to a
 *   WhatsApp-style coloured circle with the person's initials.
 *
 * Props:
 *   imageUrl   – URL of the profile photo (optional)
 *   name       – Full name used to generate initials and pick the colour
 *   size       – Diameter of the avatar in points (default 52)
 *   radius     – Border radius (default size * 0.3 for a rounded-square look)
 *   verified   – Shows a small green checkmark badge when true
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// A set of pleasant colours used to seed the fallback background.
const PALETTE = [
  '#2563EB', // blue
  '#7C3AED', // purple
  '#059669', // green
  '#D97706', // amber
  '#DC2626', // red
  '#0891B2', // cyan
  '#DB2777', // pink
  '#4F46E5', // indigo
];

/** Pick a consistent palette colour based on the name string. */
function colourForName(name: string): string {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Extract up to 2 initials from a full name. */
function initials(name: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
}

interface DoctorAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
  radius?: number;
  verified?: boolean;
  /** Optional extra style for the outer wrapper */
  style?: object;
}

export default function DoctorAvatar({
  imageUrl,
  name,
  size = 52,
  radius,
  verified = false,
  style,
}: DoctorAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const borderRadius = radius ?? Math.round(size * 0.28);
  const bgColour = colourForName(name);
  const initText = initials(name);
  const fontSize = Math.round(size * 0.38);

  // badge is 25 % of size, minimum 14
  const badgeSize = Math.max(14, Math.round(size * 0.25));
  const badgeIconSize = Math.round(badgeSize * 0.56);
  const badgeBorder = Math.round(badgeSize * 0.18);

  const showImage = !!imageUrl && !imgError;

  return (
    <View style={[{ position: 'relative', width: size, height: size }, style]}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl as string }}
          style={{
            width: size,
            height: size,
            borderRadius,
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor: bgColour + '22', // very light tint
              borderColor: bgColour + '55',
            },
          ]}
        >
          <Text
            style={[
              styles.initial,
              { fontSize, color: bgColour },
            ]}
          >
            {initText}
          </Text>
        </View>
      )}

      {verified && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              borderWidth: badgeBorder,
              bottom: -badgeBorder,
              right: -badgeBorder,
            },
          ]}
        >
          <Ionicons name="checkmark" size={badgeIconSize} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  initial: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
