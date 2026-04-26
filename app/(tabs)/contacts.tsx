import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, Contact } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { BrainIcon } from '@/components/BrainIcon';
import { markRealtimeMessagesAsRead, subscribeRealtimeMessages } from '@/services/realtimeChat';

interface ContactItemProps {
  contact: Contact;
  onPress: () => void;
}

function ContactItem({ contact, onPress }: ContactItemProps) {
  return (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contactAvatar}>
        <Ionicons name="person" size={20} color={Colors.primary} />
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
      </View>
      
      {contact.isPrimary && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>Primary</Text>
        </View>
      )}
      
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const { contacts, setContacts, emotionalState, isConnected } = useApp();
  const isCaregiver = role === 'caregiver';
  const [incomingCount, setIncomingCount] = useState(0);
  useEffect(() => {
    if (!isCaregiver) return;
    const unsubscribe = subscribeRealtimeMessages('caregiver', (messages) => {
      const unread = messages.filter(
        (m) => m.toRole === 'caregiver' && m.fromRole === 'patient' && !m.readByCaregiver
      );
      setIncomingCount(unread.length);
    });
    return () => unsubscribe();
  }, [isCaregiver]);

  const hasUnreadAlerts = incomingCount > 0;

  const alertBannerUi = useMemo(
    () =>
      hasUnreadAlerts
        ? {
            title: 'Alert Messages Pending',
            body: `You have ${incomingCount} unread message${incomingCount > 1 ? 's' : ''}. Review now.`,
            iconColor: '#B91C1C',
          }
        : {
            title: 'Priority Alert Area',
            body: 'No emergency alert right now. New alerts will appear here immediately.',
            iconColor: '#92400E',
          },
    [hasUnreadAlerts, incomingCount]
  );

  const handleOpenMessages = async () => {
    setIncomingCount(0);
    try {
      await markRealtimeMessagesAsRead('caregiver');
    } catch {
      // Ignore read-mark failures in demo mode.
    }
    router.push('/(tabs)/communication');
  };


  const handleContactPress = (contact: Contact) => {
    // Toggle primary contact
    setContacts(contacts.map(c => ({
      ...c,
      isPrimary: c.id === contact.id,
    })));
    router.push('/(tabs)/communication');
  };

  if (isCaregiver) {
    const emotionalStateLabels = {
      calmado: 'Calm',
      estres: 'Stress',
      panico: 'Panic',
    } as const;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.caregiverContent} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionLabel}>Patient BCI connection</Text>
          <View style={styles.connectionIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
            <Text style={[styles.connectionText, { color: isConnected ? Colors.success : Colors.danger }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.brainContainer}>
          <BrainIcon state={emotionalState} size={130} />
          <Text style={styles.stateLabel}>Detected patient emotional state</Text>
          <Text style={styles.stateValue}>{emotionalStateLabels[emotionalState]}</Text>
        </View>

        <View style={[styles.alertBanner, hasUnreadAlerts && styles.alertBannerHot]}>
          <Ionicons name="warning" size={20} color={alertBannerUi.iconColor} />
          <View style={styles.alertBody}>
            <Text style={[styles.alertTitle, hasUnreadAlerts && styles.alertTitleHot]}>{alertBannerUi.title}</Text>
            <Text style={[styles.alertText, hasUnreadAlerts && styles.alertTextHot]}>{alertBannerUi.body}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryAction, hasUnreadAlerts && styles.primaryActionHot]}
          onPress={handleOpenMessages}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
          <Text style={styles.primaryActionText}>Messages</Text>
          {hasUnreadAlerts ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{incomingCount > 99 ? '99+' : String(incomingCount)}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.careCard}>
          <View style={styles.careHeader}>
            <Text style={styles.careTitle}>Patient Overview</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Text style={styles.patientName}>BCI User</Text>
          <Text style={styles.patientMeta}>Connection: Stable</Text>
          <Text style={styles.patientMeta}>Emotional state: Calm</Text>
          <Text style={styles.patientMeta}>Emergency alerts: None</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactItem 
            contact={item} 
            onPress={() => handleContactPress(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  caregiverContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
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
    paddingBottom: Spacing.lg,
  },
  stateLabel: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  stateValue: {
    marginTop: Spacing.xs,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  alertBannerHot: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    color: '#991B1B',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  alertText: {
    color: '#7C2D12',
    fontSize: FontSize.sm,
  },
  alertTitleHot: {
    color: '#991B1B',
  },
  alertTextHot: {
    color: '#7F1D1D',
  },
  careCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
  },
  careHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  careTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#7C3AED',
  },
  liveText: {
    color: '#5B21B6',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  patientName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  patientMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  primaryAction: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    minHeight: 54,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionHot: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#991B1B',
    shadowColor: '#DC2626',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryActionText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  unreadBadge: {
    marginLeft: 10,
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  unreadBadgeText: {
    color: '#DC2626',
    fontWeight: FontWeight.bold,
    fontSize: 15,
  },
  listContent: {
    paddingVertical: Spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  primaryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  primaryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 44 + Spacing.md,
  },
});
