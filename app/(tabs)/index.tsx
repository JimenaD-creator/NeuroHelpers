import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, getEmotionalStateColor } from '@/constants/theme';
import { BrainIcon } from '@/components/BrainIcon';
import { PanicDialog } from '@/components/PanicDialog';
import { BCIDemoControls } from '@/components/BCIDemoControls';

export default function HomeScreen() {
  const router = useRouter();
  const { 
    emotionalState, 
    isConnected, 
    primaryContact, 
    triggerEmergency,
    showPanicDialog,
    setShowPanicDialog,
    settings,
  } = useApp();

  const stateColors = getEmotionalStateColor(emotionalState);
  
  const emotionalStateLabels = {
    calmado: 'Calmado',
    estres: 'Estrés',
    panico: 'Pánico',
  };

  // Show panic dialog when panic state is detected
  useEffect(() => {
    if (emotionalState === 'panico') {
      setShowPanicDialog(true);
    }
  }, [emotionalState]);

  const handleEmergency = () => {
    triggerEmergency();
    router.push('/emergency');
  };

  const handleSendMessage = () => {
    router.push('/communication');
  };

  return (
    <View style={styles.container}>
      {/* BCI Connection Status */}
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionLabel}>Conexión BCI</Text>
        <View style={styles.connectionIndicator}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
          <Text style={[styles.connectionText, { color: isConnected ? Colors.success : Colors.danger }]}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Brain Icon with Emotional State */}
      <View style={styles.brainContainer}>
        <BrainIcon state={emotionalState} size={140} />
        <Text style={styles.stateLabel}>Estado emocional detectado</Text>
        <View style={styles.stateRow}>
          <Text style={[styles.stateValue, { color: stateColors.primary }]}>
            {emotionalStateLabels[emotionalState]}
          </Text>
          <View style={[styles.stateDot, { backgroundColor: stateColors.primary }]} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.emergencyButton]}
          onPress={handleEmergency}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={24} color={Colors.white} />
          <Text style={styles.emergencyButtonText}>EMERGENCIA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleSendMessage}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble" size={24} color={Colors.white} />
          <Text style={styles.messageButtonText}>ENVIAR MENSAJE</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Contact */}
      {primaryContact && (
        <View style={styles.contactContainer}>
          <View style={styles.contactInfo}>
            <View style={styles.contactAvatar}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Contacto principal</Text>
              <Text style={styles.contactName}>{primaryContact.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons 
              name={settings.voiceEnabled ? "volume-high-outline" : "volume-mute-outline"} 
              size={24} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.voiceText}>Voz activada</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panic Dialog */}
      <PanicDialog 
        visible={showPanicDialog}
        onCancel={() => setShowPanicDialog(false)}
        onConfirm={() => {
          setShowPanicDialog(false);
          handleEmergency();
        }}
      />

      {/* BCI Demo Controls - For testing, remove in production */}
      <BCIDemoControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
  },
  connectionStatus: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  connectionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  brainContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  stateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  stateValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actionsContainer: {
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emergencyButton: {
    backgroundColor: Colors.emergency,
  },
  emergencyButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  messageButton: {
    backgroundColor: Colors.primary,
  },
  messageButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 'auto',
    marginBottom: Spacing.lg,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  contactName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  voiceButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voiceText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
