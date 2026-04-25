import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, getEmotionalStateColor } from '@/constants/theme';
import { BrainIcon } from '@/components/BrainIcon';
import { PanicDialog } from '@/components/PanicDialog';
import { BCIDemoControls } from '@/components/BCIDemoControls';

export default function HomeScreen() {
  const router = useRouter();
  const [isSendingEmergency, setIsSendingEmergency] = useState(false);
  const [showEmergencyErrorModal, setShowEmergencyErrorModal] = useState(false);
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
    calmado: 'Calm',
    estres: 'Stress',
    panico: 'Panic',
  };

  // Show panic dialog when panic state is detected
  useEffect(() => {
    if (emotionalState === 'panico') {
      setShowPanicDialog(true);
    }
  }, [emotionalState]);

  const validateEmergencySend = async () => {
    // For MVP: treat a registered primary contact with phone as successful delivery validation.
    if (!primaryContact?.phone?.trim()) return false;
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  };

  const handleEmergencyTap = async () => {
    if (isSendingEmergency) return;
    setIsSendingEmergency(true);

    const delivered = await validateEmergencySend();
    setIsSendingEmergency(false);

    if (delivered) {
      triggerEmergency();
      router.push('/emergency');
      return;
    }

    setShowEmergencyErrorModal(true);
  };

  const handleSendMessage = () => {
    router.push('/communication');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* BCI Connection Status */}
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionLabel}>BCI connection</Text>
        <View style={styles.connectionIndicator}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
          <Text style={[styles.connectionText, { color: isConnected ? Colors.success : Colors.danger }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Brain Icon with Emotional State */}
      <View style={styles.brainContainer}>
        <BrainIcon state={emotionalState} size={140} />
        <Text style={styles.stateLabel}>Detected emotional state</Text>
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
          onPress={handleEmergencyTap}
          activeOpacity={0.8}
          disabled={isSendingEmergency}
        >
          <Ionicons name="warning" size={24} color={Colors.white} />
          <Text style={styles.emergencyButtonText}>{isSendingEmergency ? 'SENDING ALERT...' : 'EMERGENCY'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleSendMessage}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble" size={24} color={Colors.white} />
          <Text style={styles.messageButtonText}>SEND MESSAGE</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Contact */}
      {primaryContact && (
        <View style={styles.contactContainer}>
          <View style={styles.contactInfo}>
            <View style={styles.contactAvatar}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactTextWrap}>
              <Text style={styles.contactLabel}>Primary contact</Text>
              <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">
                {primaryContact.name}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons 
              name={settings.voiceEnabled ? "volume-high-outline" : "volume-mute-outline"} 
              size={24} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.voiceText}>Voice enabled</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panic Dialog */}
      <PanicDialog 
        visible={showPanicDialog}
        onCancel={() => setShowPanicDialog(false)}
        onConfirm={() => {
          setShowPanicDialog(false);
          handleEmergencyTap();
        }}
      />

      <Modal visible={showEmergencyErrorModal} transparent animationType="fade" onRequestClose={() => setShowEmergencyErrorModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alert not sent</Text>
            <Text style={styles.modalBody}>No valid primary contact is registered. Please update contact settings.</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, styles.modalSingleButton]}
              onPress={() => setShowEmergencyErrorModal(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BCI Demo Controls - For testing, remove in production */}
      <BCIDemoControls />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
    alignItems: 'flex-start',
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
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.sm,
  },
  contactTextWrap: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 92,
    maxWidth: 92,
    alignSelf: 'center',
    marginLeft: Spacing.md,
    flexShrink: 0,
  },
  voiceText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  modalConfirmButton: {
    backgroundColor: Colors.emergency,
  },
  modalConfirmText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  modalSingleButton: {
    marginTop: Spacing.xs,
  },
});
