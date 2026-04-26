import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from './constants/theme';
import { markRealtimeMessagesAsRead, sendRealtimeMessage, subscribeRealtimeMessages } from '@/services/realtimeChat';

const CAREGIVER_LAST_SEEN_KEY = 'nh_caregiver_last_seen_v1';

type ChatItem = {
  id: string;
  author: 'incoming' | 'outgoing';
  text: string;
  time: string;
  deliveryStatus?: 'sending' | 'sent' | 'read' | 'failed';
};

const QUICK_ACTIONS = [
  { id: 'ok', icon: 'thumbs-up', label: "I'm okay", border: Colors.success, bg: '#DCFCE7' },
  { id: 'help', icon: 'hand-left', label: 'I need help', border: Colors.warning, bg: '#FFF5DB' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export default function TelegramSender() {
  const { role } = useAuth();
  const { consumePendingEmergencyChatMessage } = useApp();
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 400;
  const isCaregiver = role === 'caregiver';
  const currentRole = isCaregiver ? 'caregiver' : 'patient';

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSpeller, setShowSpeller] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<Array<ChatItem & { createdAtMs: number }>>([]);
  const scrollRef = useRef<ScrollView>(null);
  const lastSpokenId = useRef<string | null>(null);

  const canSend = message.trim().length > 0 && !loading;
  const latestChatItem = chat.length > 0 ? chat[chat.length - 1] : null;
  const showPlayingCard = latestChatItem?.author === 'incoming' && !isCaregiver;
  const visibleChat = useMemo(() => [...chat, ...pendingOutgoing], [chat, pendingOutgoing]);

  const stateLabel = useMemo(() => {
    if (lastStatus === 'success') return 'Status: Calm';
    if (lastStatus === 'error') return 'Status: Send error';
    return 'Status: Calm';
  }, [lastStatus]);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingEmergencyChatMessage();
      if (!pending) return;
      const id = `emergency-${Date.now()}`;
      setChat((prev) => [
        ...prev,
        {
          id,
          author: 'outgoing',
          text: pending.toUpperCase(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          deliveryStatus: 'sent',
        },
      ]);
    }, [consumePendingEmergencyChatMessage])
  );

  const postMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    setShowSpeller(false);
    const pendingId = `pending-${Date.now()}`;
    const pendingCreatedAt = Date.now();
    setPendingOutgoing((prev) => [
      ...prev,
      {
        id: pendingId,
        author: 'outgoing',
        text: clean,
        time: new Date(pendingCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deliveryStatus: 'sending',
        createdAtMs: pendingCreatedAt,
      },
    ]);
    setMessage('');
    setLoading(true);
    setLastStatus('idle');

    try {
      await sendRealtimeMessage(currentRole, clean);
      setLastStatus('success');
    } catch {
      setPendingOutgoing((prev) => prev.filter((item) => item.id !== pendingId));
      setLastStatus('error');
      Alert.alert('Realtime chat error', 'Could not send message. Check Firebase setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeRealtimeMessages(
      currentRole,
      (messages) => {
        if (currentRole === 'caregiver') {
          const latestIncomingTs = messages
            .filter((m) => m.toRole === 'caregiver' && m.fromRole === 'patient')
            .reduce((max, m) => Math.max(max, m.createdAt.getTime()), 0);
          if (latestIncomingTs > 0) {
            AsyncStorage.setItem(CAREGIVER_LAST_SEEN_KEY, String(latestIncomingTs)).catch(() => {
              // Ignore persistence errors in demo mode.
            });
          }
        }

        const allMessages = messages.map((item) => ({
          id: `msg-${item.id}`,
          author: item.fromRole === currentRole ? ('outgoing' as const) : ('incoming' as const),
          text: item.text,
          time: item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          deliveryStatus:
            item.fromRole === currentRole
              ? (((
                  (currentRole === 'patient' && item.readByCaregiver) ||
                  (currentRole === 'caregiver' && item.readByPatient)
                )
                  ? 'read'
                  : 'sent') as 'read' | 'sent')
              : undefined,
        }));

        setChat(allMessages);
        setPendingOutgoing((prev) =>
          prev.filter((pending) => {
            const matched = messages.some(
              (item) =>
                item.fromRole === currentRole &&
                item.text.trim() === pending.text.trim() &&
                Math.abs(item.createdAt.getTime() - pending.createdAtMs) < 20000
            );
            return !matched;
          })
        );
      },
      () => setLastStatus('error')
    );

    return () => unsubscribe();
  }, [currentRole]);

  const initialChatLoaded = useRef(false);

  useEffect(() => {
    if (isCaregiver) return;
    const incoming = chat.filter((m) => m.author === 'incoming');
    if (incoming.length === 0) return;

    if (!initialChatLoaded.current) {
      // Mark the latest as seen on first load — don't speak history
      lastSpokenId.current = incoming[incoming.length - 1].id;
      initialChatLoaded.current = true;
      return;
    }

    const latest = incoming[incoming.length - 1];
    if (latest.id !== lastSpokenId.current) {
      lastSpokenId.current = latest.id;
      Speech.stop();
      Speech.speak(latest.text, { rate: 0.9 });
    }
  }, [chat, isCaregiver]);

  useFocusEffect(
    useCallback(() => {
      markRealtimeMessagesAsRead(currentRole).catch(() => {
        // Ignore mark-read failures in demo mode.
      });
    }, [currentRole])
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <Text style={styles.headerName}>{isCaregiver ? 'BCI User' : 'Caregiver'}</Text>
          <Text style={styles.online}>Online</Text>
          <View style={styles.statePill}>
            <View style={styles.stateDot} />
            <Text style={styles.stateText}>{stateLabel}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {visibleChat.map((item) => (
            <View key={item.id} style={[styles.bubble, item.author === 'outgoing' ? styles.bubbleOut : styles.bubbleIn]}>
              <Text style={[styles.bubbleText, item.author === 'outgoing' && styles.bubbleOutText]}>{item.text}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.bubbleTime}>{item.time}</Text>
                {item.author === 'incoming' && !isCaregiver && (
                  <TouchableOpacity onPress={() => { Speech.stop(); Speech.speak(item.text, { rate: 0.9 }); }} hitSlop={8}>
                    <Ionicons name="volume-high-outline" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
                {item.author === 'outgoing' && item.deliveryStatus && (
                  <DeliveryStatus status={item.deliveryStatus} emphasizeBlue={!isCaregiver} />
                )}
              </View>
            </View>
          ))}

          {showPlayingCard && (
            <View style={styles.voiceCard}>
              <Text style={styles.voiceIcon}>🔊</Text>
              <Text style={styles.voiceTitle}>Playing...</Text>
              <Text style={styles.wave}>································</Text>
            </View>
          )}
        </ScrollView>

        {!showSpeller && (
          <View style={styles.bottomPanel}>
            {!isCaregiver && (
              <View style={styles.quickActions}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    activeOpacity={0.82}
                    style={[
                      styles.quickBtn,
                      styles.quickResponseBtn,
                      isSmall && styles.quickResponseBtnSmall,
                      { borderColor: action.border, backgroundColor: action.bg },
                    ]}
                    onPress={() => postMessage(action.label)}
                  >
                    <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={28} color={action.border} />
                    <Text
                      style={[
                        styles.quickText,
                        styles.quickResponseText,
                        isSmall && styles.quickTextSmall,
                        { color: action.border },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.quickBtn, isSmall && styles.quickBtnSmall, styles.spellerToggle]}
                  onPress={() => setShowSpeller(true)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="create" size={24} color={Colors.primary} />
                  <Text style={[styles.quickText, styles.spellerToggleText, isSmall && styles.quickTextSmall]}>Type (Speller)</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.composer, isSmall && styles.composerSmall]}>
              <TextInput
                style={[styles.input, isSmall && styles.inputSmall, isCaregiver && styles.inputCaregiver]}
                placeholder="Message being composed..."
                placeholderTextColor={Colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline={isCaregiver}
                textAlignVertical={isCaregiver ? 'top' : 'center'}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  isSmall && styles.sendBtnSmall,
                  isMedium && styles.sendBtnMedium,
                  isCaregiver && styles.sendBtnCaregiver,
                  !canSend && styles.sendBtnDisabled,
                ]}
                onPress={() => postMessage(message)}
                disabled={!canSend}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Send</Text>}
              </TouchableOpacity>
            </View>

            {!isCaregiver && (
              <View style={styles.footer}>
                <Text style={styles.footerLabel}>Auto-scan active</Text>
                <View style={styles.scanDots}>
                  <View style={[styles.dot, styles.dotOn]} />
                  <View style={[styles.dot, styles.dotOn]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            )}
          </View>
        )}

        {!isCaregiver && showSpeller && (
          <View style={styles.spellerOverlay}>
            <View style={styles.spellerOverlayHeader}>
              <Text style={styles.spellerTitle}>BCI Speller</Text>
              <TouchableOpacity onPress={() => setShowSpeller(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.composer, isSmall && styles.composerSmall, styles.composerInSpeller]}>
              <TextInput
                style={[styles.input, isSmall && styles.inputSmall]}
                placeholder="Message being composed..."
                placeholderTextColor={Colors.textMuted}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, isSmall && styles.sendBtnSmall, isMedium && styles.sendBtnMedium, !canSend && styles.sendBtnDisabled]}
                onPress={() => postMessage(message)}
                disabled={!canSend}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Send</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.spellerGridWrap}>
              <FlatList
                data={LETTERS}
                keyExtractor={(item, index) => `${item}-${index}`}
                numColumns={5}
                contentContainerStyle={styles.spellerGridContent}
                columnWrapperStyle={styles.spellerGridRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.letterBtn, isSmall && styles.letterBtnSmall, styles.letterBtnExpanded]}
                    onPress={() => setMessage((prev) => prev + item)}
                  >
                    <Text style={styles.letterText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function DeliveryStatus({
  status,
  emphasizeBlue,
}: {
  status: 'sending' | 'sent' | 'read' | 'failed';
  emphasizeBlue: boolean;
}) {
  if (status === 'sending') return <Text style={styles.deliveryPending}>○</Text>;
  if (status === 'failed') return <Text style={styles.deliveryFailed}>!</Text>;

  return (
    <Ionicons
      name="checkmark-done"
      size={14}
      color={
        status === 'read'
          ? '#1D4ED8'
          : emphasizeBlue
            ? '#2563EB'
            : '#9CA3AF'
      }
      style={styles.deliveryIcon}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 10,
    paddingVertical: 40,
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerName: { color: Colors.text, fontWeight: '700', fontSize: 20 },
  online: { color: Colors.success, fontWeight: '600', marginTop: 2 },
  statePill: {
    marginTop: 10,
    backgroundColor: '#EDF0F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateDot: { width: 9, height: 9, borderRadius: 99, backgroundColor: Colors.success },
  stateText: { color: Colors.text, fontWeight: '700' },
  chatArea: { minHeight: '52%', maxHeight: '60%' },
  chatContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  bottomPanel: {
    marginTop: 'auto',
    paddingBottom: 0,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#2563EB' },
  bubbleText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  bubbleOutText: { color: '#1D4ED8' },
  bubbleTime: { color: Colors.textMuted, fontSize: 12, marginTop: 5 },
  metaRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  deliveryIcon: {
    marginTop: 1,
  },
  deliveryPending: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  deliveryFailed: {
    color: Colors.emergency,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  voiceCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    padding: 16,
  },
  voiceIcon: { fontSize: 32 },
  voiceTitle: { marginTop: 4, fontSize: 16, fontWeight: '700', color: Colors.primary },
  wave: { marginTop: 8, color: Colors.primary, fontWeight: '700', letterSpacing: 2 },
  quickActions: { paddingHorizontal: 14, gap: 7, paddingTop: 8, marginTop: 0 },
  quickBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 13,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    overflow: 'hidden',
  },
  quickResponseBtn: {
    minHeight: 40,
    height: 40,
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 10,
  },
  quickResponseBtnSmall: {
    minHeight: 38,
    height: 38,
  },
  quickBtnSmall: {
    height: 38,
    paddingHorizontal: 10,
  },
  quickText: { fontSize: 14, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  quickResponseText: {
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '600',
  },
  quickTextSmall: { fontSize: 14 },
  spellerToggle: {
    width: '100%',
    borderColor: Colors.primary,
    backgroundColor: '#ECEBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spellerToggleText: {
    color: Colors.primary,
    textAlign: 'center',
  },
  spellerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 0,
  },
  spellerOverlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  composerInSpeller: {
    marginTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 6,
  },
  spellerGridWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    backgroundColor: Colors.white,
    padding: 8,
  },
  spellerGridContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  spellerGridRow: {
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  letterBtnExpanded: {
    flex: 1,
    marginHorizontal: 3,
    width: undefined,
    height: 66,
  },
  letterBtn: {
    width: '17.8%',
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFF',
  },
  letterBtnSmall: {
    width: '17.5%',
    height: 46,
  },
  letterText: { fontWeight: '700', color: Colors.text, fontSize: 20 },
  spellerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  close: { fontSize: 22, color: Colors.textSecondary, fontWeight: '700' },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 0,
  },
  composerSmall: {
    gap: 6,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    color: Colors.text,
    fontWeight: '600',
  },
  inputSmall: {
    height: 38,
    paddingHorizontal: 10,
  },
  inputCaregiver: {
    minHeight: 62,
    maxHeight: 110,
    paddingTop: 10,
    fontSize: 16,
  },
  sendBtn: {
    minWidth: 82,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sendBtnSmall: {
    minWidth: 74,
    height: 38,
  },
  sendBtnMedium: {
    minWidth: 80,
  },
  sendBtnCaregiver: {
    height: 46,
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: { backgroundColor: '#A7A0F6' },
  sendText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  footer: {
    height: 38,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  footerLabel: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12 },
  scanDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 9, backgroundColor: '#D1D5DB' },
  dotOn: { backgroundColor: Colors.primary },
});
