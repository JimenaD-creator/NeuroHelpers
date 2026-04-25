import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export default function MessagePlaybackScreen() {
  const router = useRouter();
  const { currentPlayingMessage, setCurrentPlayingMessage } = useApp();
  const [isPlaying, setIsPlaying] = useState(true);

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentPlayingMessage(null);
    router.back();
  };

  if (!currentPlayingMessage) {
    return null;
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Reproduciendo mensaje',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.white,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Speaker Animation */}
          <View style={styles.speakerContainer}>
            <View style={styles.speakerOuter}>
              <View style={styles.speakerInner}>
                <Ionicons 
                  name={isPlaying ? "volume-high" : "volume-mute"} 
                  size={40} 
                  color={Colors.primary} 
                />
              </View>
            </View>
          </View>

          {/* Message Content */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mensaje</Text>
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{currentPlayingMessage.text}</Text>
              <Text style={styles.messageTime}>{currentPlayingMessage.timestamp}</Text>
            </View>
          </View>

          {/* Stop Button */}
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <View style={styles.stopIcon}>
              <View style={styles.stopSquare} />
            </View>
            <Text style={styles.stopButtonText}>DETENER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  speakerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  speakerOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageContainer: {
    flex: 1,
  },
  messageLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  messageTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  stopIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 12,
    height: 12,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  stopButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
