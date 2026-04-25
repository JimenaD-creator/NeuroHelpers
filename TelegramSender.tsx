import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './constants/theme';

const BOT_TOKEN = '';
const CHAT_ID = '';

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
  { id: 'panic', icon: 'warning', label: 'Emergency', border: Colors.emergency, bg: '#FEECEC' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

export default function TelegramSender() {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 400;

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSpeller, setShowSpeller] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);

  const canSend = message.trim().length > 0 && !loading;

  const stateLabel = useMemo(() => {
    if (lastStatus === 'success') return 'Status: Calm';
    if (lastStatus === 'error') return 'Status: Send error';
    return 'Status: Calm';
  }, [lastStatus]);

  const postMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    const messageId = String(Date.now());
    const localMessage: ChatItem = {
      id: messageId,
      author: 'outgoing',
      text: clean.toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deliveryStatus: 'sending',
    };
    setChat((prev) => [...prev, localMessage]);
    setMessage('');
    setLoading(true);
    setLastStatus('idle');

    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: clean,
          parse_mode: 'HTML',
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setLastStatus('success');
        setChat((prev) =>
          prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'sent' } : item))
        );
        // Telegram bot API does not expose read receipts reliably here;
        // simulate the "read" transition for demo UX.
        setTimeout(() => {
          setChat((prev) =>
            prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'read' } : item))
          );
        }, 1800);
      } else {
        setLastStatus('error');
        setChat((prev) =>
          prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item))
        );
        Alert.alert('Error', `Telegram replied: ${data.description}`);
      }
    } catch (_error) {
      setLastStatus('error');
      setChat((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item))
      );
      Alert.alert('Network error', 'Could not connect to Telegram.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <Text style={styles.headerName}>Mom</Text>
          <Text style={styles.online}>Online</Text>
          <View style={styles.statePill}>
            <View style={styles.stateDot} />
            <Text style={styles.stateText}>{stateLabel}</Text>
          </View>
        </View>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {chat.map((item) => (
            <View key={item.id} style={[styles.bubble, item.author === 'outgoing' ? styles.bubbleOut : styles.bubbleIn]}>
              <Text style={[styles.bubbleText, item.author === 'outgoing' && styles.bubbleOutText]}>{item.text}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.bubbleTime}>{item.time}</Text>
                {item.author === 'outgoing' && item.deliveryStatus && (
                  <DeliveryStatus status={item.deliveryStatus} />
                )}
              </View>
            </View>
          ))}

          {lastStatus === 'success' && (
            <View style={styles.voiceCard}>
              <Text style={styles.voiceIcon}>🔊</Text>
              <Text style={styles.voiceTitle}>Playing...</Text>
              <Text style={styles.wave}>································</Text>
            </View>
          )}
        </ScrollView>

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
            onPress={() => setShowSpeller((prev) => !prev)}
            activeOpacity={0.82}
          >
            <Text style={styles.quickIcon}>✏️</Text>
            <Text style={[styles.quickText, isSmall && styles.quickTextSmall]}>Type (Speller)</Text>
          </TouchableOpacity>
        </View>

        {showSpeller && (
          <View style={styles.spellerCard}>
            <View style={styles.spellerHeader}>
              <Text style={styles.spellerTitle}>BCI Speller</Text>
              <TouchableOpacity onPress={() => setShowSpeller(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lettersGrid}>
              {LETTERS.map((letter, index) => (
                <TouchableOpacity
                  key={letter + index}
                  style={[styles.letterBtn, isSmall && styles.letterBtnSmall]}
                  onPress={() => setMessage((prev) => prev + letter)}
                >
                  <Text style={styles.letterText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.composer, isSmall && styles.composerSmall]}>
          <TextInput
            style={[styles.input, isSmall && styles.inputSmall]}
            placeholder="Message being composed..."
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              isSmall && styles.sendBtnSmall,
              isMedium && styles.sendBtnMedium,
              !canSend && styles.sendBtnDisabled,
            ]}
            onPress={() => postMessage(message)}
            disabled={!canSend}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Send</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerIcon}>🔊</Text>
          <Text style={styles.footerLabel}>Auto-scan active</Text>
          <View style={styles.scanDots}>
            <View style={[styles.dot, styles.dotOn]} />
            <View style={[styles.dot, styles.dotOn]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Text style={styles.footerIcon}>⚙️</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function DeliveryStatus({ status }: { status: 'sending' | 'sent' | 'read' | 'failed' }) {
  if (status === 'sending') {
    return <Text style={styles.deliveryPending}>○</Text>;
  }

  if (status === 'failed') {
    return <Text style={styles.deliveryFailed}>!</Text>;
  }

  return (
    <Ionicons
      name="checkmark-done"
      size={14}
      color={status === 'read' ? '#2563EB' : '#9CA3AF'}
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
  chatArea: { flex: 1, minHeight: 0 },
  chatContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#DED7FF', borderWidth: 1, borderColor: Colors.primary },
  bubbleText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  bubbleOutText: { color: '#30208A' },
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
  quickActions: { paddingHorizontal: 14, gap: 12, paddingTop: 14 },
  quickBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 13,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    overflow: 'hidden',
  },
  quickResponseBtn: {
    minHeight: 52,
    height: 52,
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 10,
  },
  quickResponseBtnSmall: {
    minHeight: 48,
    height: 48,
  },
  quickBtnSmall: {
    height: 46,
    paddingHorizontal: 10,
  },
  quickIcon: { fontSize: 18 },
  quickText: { fontSize: 15, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  quickResponseText: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '600',
  },
  quickTextSmall: { fontSize: 14 },
  spellerToggle: {
    width: '100%',
    borderColor: Colors.border,
    backgroundColor: '#F4F5F8',
  },
  spellerCard: {
    marginTop: 14,
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    padding: 12,
    gap: 10,
  },
  spellerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spellerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  close: { fontSize: 22, color: Colors.textSecondary, fontWeight: '700' },
  lettersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letterBtn: {
    width: '17.8%',
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFF',
  },
  letterBtnSmall: {
    width: '17.5%',
    height: 38,
  },
  letterText: { fontWeight: '700', color: Colors.text, fontSize: 16 },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  composerSmall: {
    gap: 6,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    color: Colors.text,
    fontWeight: '600',
  },
  inputSmall: {
    height: 44,
    paddingHorizontal: 10,
  },
  sendBtn: {
    minWidth: 82,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  sendBtnSmall: {
    minWidth: 74,
    height: 44,
  },
  sendBtnMedium: {
    minWidth: 80,
  },
  sendBtnDisabled: { backgroundColor: '#A7A0F6' },
  sendText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  footer: {
    height: 48,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  footerIcon: { fontSize: 18 },
  footerLabel: { color: Colors.textSecondary, fontWeight: '700' },
  scanDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 9, backgroundColor: '#D1D5DB' },
  dotOn: { backgroundColor: Colors.primary },
});
