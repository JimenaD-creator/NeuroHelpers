import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface QuickMessageButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

function QuickMessageButton({ icon, label, color, bgColor, onPress }: QuickMessageButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.quickButton, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={32} color={color} />
      <Text style={[styles.quickButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CommunicationScreen() {
  const router = useRouter();
  const { messages, sendQuickMessage, setCurrentPlayingMessage, triggerEmergency } = useApp();
  
  const receivedMessage = messages.find(m => m.type === 'received');

  const handlePlayMessage = () => {
    if (receivedMessage) {
      setCurrentPlayingMessage(receivedMessage);
      router.push('/message-playback');
    }
  };

  const handleEmergency = () => {
    sendQuickMessage('emergencia');
    router.push('/emergency');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Messages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mensajes rápidos</Text>
        <View style={styles.quickMessagesRow}>
          <QuickMessageButton
            icon="thumbs-up"
            label="Estoy bien"
            color={Colors.success}
            bgColor={Colors.successLight}
            onPress={() => sendQuickMessage('bien')}
          />
          <QuickMessageButton
            icon="hand-left"
            label="Necesito ayuda"
            color={Colors.warning}
            bgColor={Colors.warningLight}
            onPress={() => sendQuickMessage('ayuda')}
          />
          <QuickMessageButton
            icon="warning"
            label="Emergencia"
            color={Colors.emergency}
            bgColor={Colors.emergencyLight}
            onPress={handleEmergency}
          />
        </View>
      </View>

      {/* Received Message Section */}
      {receivedMessage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensaje recibido</Text>
          <View style={styles.messageCard}>
            <View style={styles.messageContent}>
              <Text style={styles.messageText}>{receivedMessage.text}</Text>
              <Text style={styles.messageTime}>{receivedMessage.timestamp}</Text>
            </View>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Voice Message Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Escuchar mensaje</Text>
        <View style={styles.voiceMessageCard}>
          <TouchableOpacity 
            style={styles.voicePlayButton}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.waveformContainer}>
            {/* Waveform visualization */}
            {Array.from({ length: 30 }).map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.waveformBar,
                  { 
                    height: Math.random() * 20 + 5,
                    backgroundColor: i < 10 ? Colors.primary : Colors.border,
                  }
                ]} 
              />
            ))}
          </View>
          <Text style={styles.voiceDuration}>0:12</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickMessagesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  quickButtonText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  messageTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  voicePlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    minWidth: 35,
  },
});
