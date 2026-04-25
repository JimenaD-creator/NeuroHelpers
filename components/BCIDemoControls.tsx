import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBCISimulation } from '@/hooks/useBCISimulation';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

/**
 * Demo controls for simulating BCI input
 * 
 * This component provides a floating button that opens a panel
 * to manually trigger different emotional states for testing.
 * 
 * In production, these controls would be hidden and the states
 * would be triggered by actual BCI device input.
 */
export function BCIDemoControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    simulateCalm, 
    simulateStress, 
    simulatePanic,
    isConnected,
  } = useBCISimulation();

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="hardware-chip" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* Demo Panel Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>BCI Simulator</Text>
              <View style={styles.connectionStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? Colors.success : Colors.danger }
                ]} />
                <Text style={styles.statusText}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>

            <Text style={styles.panelSubtitle}>
              Simulate emotional states detected by the BCI device
            </Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.stateButton, { backgroundColor: Colors.successLight }]}
                onPress={() => {
                  simulateCalm();
                  setIsOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="happy" size={32} color={Colors.success} />
                <Text style={[styles.stateButtonText, { color: Colors.success }]}>
                  Calm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stateButton, { backgroundColor: Colors.warningLight }]}
                onPress={() => {
                  simulateStress();
                  setIsOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle" size={32} color={Colors.warning} />
                <Text style={[styles.stateButtonText, { color: Colors.warning }]}>
                  Stress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stateButton, { backgroundColor: Colors.dangerLight }]}
                onPress={() => {
                  simulatePanic();
                  setIsOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="warning" size={32} color={Colors.danger} />
                <Text style={[styles.stateButtonText, { color: Colors.danger }]}>
                  Panic
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 600,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  panelTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  panelSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  stateButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  closeButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
});
