import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

export default function CommunicationScreen() {
  const router = useRouter();
  const { contacts, messages } = useApp();

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const chats = contacts.map((contact, index) => {
    const fallbackMessage =
      index % 2 === 0
        ? { text: 'I am on my way.', type: 'received' as const, timestamp: '10:30 AM' }
        : { text: 'Do you need help?', type: 'received' as const, timestamp: '10:31 AM' };
    const message = latestMessage ?? fallbackMessage;
    return {
      id: contact.id,
      name: contact.name,
      isPrimary: contact.isPrimary,
      lastMessage: message.text,
      timestamp: message.timestamp,
      type: message.type,
      unread: message.type === 'received' && index === 0,
    };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <View style={styles.chatList}>
          {chats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={[styles.chatRow, chat.isPrimary && styles.chatRowPrimary]}
              activeOpacity={0.8}
              onPress={() => router.push('/telegram-sender')}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <View style={styles.chatBody}>
                <View style={styles.chatHeaderRow}>
                  <View style={styles.chatNameRow}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    {chat.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chatTime}>{chat.timestamp}</Text>
                </View>
                <View style={styles.chatMessageRow}>
                  <Ionicons
                    name={chat.type === 'sent' ? 'checkmark-done' : 'arrow-down-circle'}
                    size={14}
                    color={chat.type === 'sent' ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.chatMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
              </View>
              {chat.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
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
  chatList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  chatRowPrimary: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: {
    flex: 1,
    minWidth: 0,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  chatName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  primaryBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  chatTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatMessage: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
});
