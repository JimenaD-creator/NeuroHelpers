import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface StatusItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  completed: boolean;
  inProgress?: boolean;
}

function StatusItem({ icon, label, completed, inProgress }: StatusItemProps) {
  return (
    <View style={styles.statusItem}>
      <View style={styles.statusIconContainer}>
        <Ionicons name={icon} size={20} color={Colors.white} />
      </View>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.statusCheck}>
        {completed ? (
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={16} color={Colors.success} />
          </View>
        ) : inProgress ? (
          <View style={styles.progressCircle}>
            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.warning} />
          </View>
        ) : (
          <View style={styles.pendingCircle} />
        )}
      </View>
    </View>
  );
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { alertStatus, cancelEmergency } = useApp();

  const handleCancel = () => {
    cancelEmergency();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Warning Icon */}
        <View style={styles.warningContainer}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={60} color={Colors.emergency} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>¡EMERGENCIA ACTIVADA!</Text>
        <Text style={styles.subtitle}>Enviando alerta a:</Text>

        {/* Status List */}
        <View style={styles.statusList}>
          {alertStatus.contactsNotified.map((contact, index) => (
            <StatusItem
              key={index}
              icon="person"
              label={contact.name}
              completed={contact.notified}
            />
          ))}
          
          <StatusItem
            icon="location"
            label="Ubicación compartida"
            completed={alertStatus.locationShared}
          />
          
          <StatusItem
            icon="chatbubble"
            label="Mensaje enviado"
            completed={alertStatus.messageSent}
          />
          
          <StatusItem
            icon="call"
            label="Llamando automáticamente..."
            completed={false}
            inProgress={alertStatus.calling}
          />
        </View>

        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>CANCELAR ALERTA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.emergency,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  warningContainer: {
    marginBottom: Spacing.xl,
  },
  warningIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.xl,
  },
  statusList: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: 'auto',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  statusCheck: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.emergency,
  },
});
