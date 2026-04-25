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
import { useApp, EmotionalState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from './constants/theme';
import { RoleSwitcher } from '@/components/RoleSwitcher';

const BOT_TOKEN = '';
const CHAT_ID = '';

type MessageSender = 'caregiver' | 'care_receiver';

type ChatItem = {
  id: string;
  author: 'incoming' | 'outgoing' | 'system';
  sender: MessageSender;
  text: string;
  time: string;
  type: 'text' | 'image' | 'state_update';
  stateLevel?: EmotionalState;
  deliveryStatus?: 'sending' | 'sent' | 'read' | 'failed';
};

const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

const SENDER_LABELS: Record<MessageSender, string> = {
  caregiver: 'Cuidador',
  care_receiver: 'Usuario BCI',
};

const STATE_META: Record<EmotionalState, { label: string; color: string; bg: string; icon: string }> = {
  calmado: { label: 'Calmado', color: '#16A34A', bg: '#DCFCE7', icon: '🧠' },
  estres:  { label: 'Estrés',  color: '#D97706', bg: '#FEF3C7', icon: '⚠️' },
  panico:  { label: 'Pánico',  color: '#DC2626', bg: '#FEE2E2', icon: '🚨' },
};

// ─── Delivery Status ──────────────────────────────────────────────────────────

function DeliveryStatus({ status }: { status: 'sending' | 'sent' | 'read' | 'failed' }) {
  if (status === 'sending') return <Text style={s.deliveryPending}>○</Text>;
  if (status === 'failed') return <Text style={s.deliveryFailed}>!</Text>;
  return (
    <Ionicons
      name="checkmark-done"
      size={14}
      color={status === 'read' ? '#2563EB' : '#9CA3AF'}
      style={s.deliveryIcon}
    />
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ item, mySender }: { item: ChatItem; mySender: MessageSender }) {
  if (item.type === 'state_update' && item.stateLevel) {
    const meta = STATE_META[item.stateLevel];
    return (
      <View style={s.systemRow}>
        <View style={[s.systemPill, { backgroundColor: meta.bg, borderColor: meta.color }]}>
          <Text style={[s.systemText, { color: meta.color }]}>{item.text}</Text>
          <Text style={[s.systemTime, { color: meta.color }]}>{item.time}</Text>
        </View>
      </View>
    );
  }

  const isOwn = item.sender === mySender;
  const isImage = item.type === 'image';

  const bubbleStyle = isOwn
    ? item.sender === 'caregiver' ? s.bubbleOutCaregiver : s.bubbleOutPatient
    : s.bubbleIn;
  const textStyle = isOwn
    ? item.sender === 'caregiver' ? s.bubbleTextCaregiver : s.bubbleTextPatient
    : s.bubbleText;

  return (
    <View style={[s.bubble, isOwn ? s.bubbleRight : s.bubbleLeft, bubbleStyle]}>
      {!isOwn && <Text style={s.senderLabel}>{SENDER_LABELS[item.sender]}</Text>}
      {isImage ? (
        <View style={s.imagePreview}>
          <Ionicons
            name="image"
            size={28}
            color={isOwn ? (item.sender === 'caregiver' ? Colors.primary : '#2563EB') : Colors.textSecondary}
          />
          <Text style={[textStyle, s.imageText]}>{item.text}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{item.text}</Text>
      )}
      <View style={s.metaRow}>
        <Text style={s.bubbleTime}>{item.time}</Text>
        {item.author === 'outgoing' && item.deliveryStatus && (
          <DeliveryStatus status={item.deliveryStatus} />
        )}
      </View>
    </View>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────

function ChatHeader({
  isCaregiver, emotionalState, lastStatus,
}: {
  isCaregiver: boolean;
  emotionalState: EmotionalState;
  lastStatus: 'idle' | 'success' | 'error';
}) {
  const meta = STATE_META[emotionalState];
  if (isCaregiver) {
    return (
      <View style={s.header}>
        <Text style={s.headerName}>María</Text>
        <Text style={s.online}>En línea</Text>
        <View style={[s.statePill, { backgroundColor: meta.bg }]}>
          <View style={[s.stateDot, { backgroundColor: meta.color }]} />
          <Text style={[s.stateText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={s.header}>
      <Text style={s.headerName}>Mamá</Text>
      <Text style={s.online}>En línea</Text>
      <View style={s.statePill}>
        <View style={s.stateDot} />
        <Text style={s.stateText}>{lastStatus === 'error' ? 'Error de envío' : 'Calmado'}</Text>
      </View>
    </View>
  );
}

// ─── Emergency Alarm Modal ────────────────────────────────────────────────────

function EmergencyAlarmModal({
  visible, patientName, onDismiss,
}: {
  visible: boolean;
  patientName: string;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={alarm.overlay}>
      <View style={alarm.header}>
        <Ionicons name="notifications" size={24} color="#fff" />
        <Text style={alarm.headerTitle}>ALERTA DE PÁNICO</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={alarm.card}>
        <View style={alarm.avatarWrap}>
          <Ionicons name="person" size={36} color={Colors.emergency} />
        </View>
        <Text style={alarm.patientName}>{patientName}</Text>
        <View style={alarm.stateBadge}>
          <View style={alarm.stateDot} />
          <Text style={alarm.stateLabel}>Estado: Pánico</Text>
        </View>
      </View>

      <View style={alarm.locationCard}>
        <View style={alarm.locationRow}>
          <Ionicons name="location" size={18} color={Colors.emergency} />
          <Text style={alarm.locationText}>Ubicación en tiempo real</Text>
        </View>
        <View style={alarm.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#9CA3AF" />
          <Text style={alarm.mapLabel}>Mapa disponible</Text>
        </View>
      </View>

      <View style={alarm.actions}>
        <TouchableOpacity style={alarm.callBtn} activeOpacity={0.85} onPress={onDismiss}>
          <Ionicons name="call" size={22} color="#fff" />
          <Text style={alarm.callBtnText}>Llamar AHORA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={alarm.secondaryBtn} activeOpacity={0.85} onPress={onDismiss}>
          <Ionicons name="car" size={20} color={Colors.emergency} />
          <Text style={alarm.secondaryBtnText}>Contactar emergencia</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={alarm.dismissLink} onPress={onDismiss}>
        <Text style={alarm.dismissText}>Dispensar alerta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Caregiver Composer ───────────────────────────────────────────────────────

function CaregiverComposer({
  message, setMessage, canSend, loading, isSmall, onSend, onImageMock,
}: {
  message: string; setMessage: (v: string) => void; canSend: boolean;
  loading: boolean; isSmall: boolean; onSend: () => void; onImageMock: () => void;
}) {
  return (
    <View style={s.caregiverWrap}>
      <TouchableOpacity style={s.imageBtn} onPress={onImageMock} activeOpacity={0.75}>
        <Ionicons name="camera" size={22} color={Colors.primary} />
      </TouchableOpacity>
      <TextInput
        style={[s.input, s.inputCaregiver, isSmall && s.inputSmall]}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={Colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity
        style={[s.sendBtnRound, !canSend && s.sendBtnDisabled]}
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} size="small" />
          : <Ionicons name="send" size={18} color={Colors.white} />}
      </TouchableOpacity>
    </View>
  );
}

// ─── Patient Panel ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'ok',   icon: 'thumbs-up' as const,  label: 'Estoy bien',     border: Colors.success,  bg: '#DCFCE7' },
  { id: 'help', icon: 'hand-left' as const,  label: 'Necesito ayuda', border: Colors.warning,  bg: '#FFF5DB' },
];

function PatientPanel({
  message, setMessage, canSend, loading, isSmall, isMedium, onSend, onQuickSend, onOpenSpeller,
}: {
  message: string; setMessage: (v: string) => void; canSend: boolean;
  loading: boolean; isSmall: boolean; isMedium: boolean;
  onSend: () => void; onQuickSend: (text: string) => void; onOpenSpeller: () => void;
}) {
  return (
    <>
      <View style={s.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.82}
            style={[s.quickBtn, s.quickResponseBtn, { borderColor: action.border, backgroundColor: action.bg }]}
            onPress={() => onQuickSend(action.label)}
          >
            <Ionicons name={action.icon} size={26} color={action.border} />
            <Text style={[s.quickText, { color: action.border }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[s.quickBtn, s.spellerToggle]} onPress={onOpenSpeller} activeOpacity={0.82}>
          <Ionicons name="create" size={24} color={Colors.primary} />
          <Text style={[s.quickText, s.spellerToggleText]}>Escribir (Speller)</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.composer, isSmall && s.composerSmall]}>
        <TextInput
          style={[s.input, isSmall && s.inputSmall]}
          placeholder="Mensaje en composición..."
          placeholderTextColor={Colors.textMuted}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          style={[s.sendBtn, isSmall && s.sendBtnSmall, isMedium && s.sendBtnMedium, !canSend && s.sendBtnDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.sendText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
      <View style={s.footer}>
        <Text style={s.footerLabel}>Auto-scan activo</Text>
        <View style={s.scanDots}>
          <View style={[s.dot, s.dotOn]} />
          <View style={[s.dot, s.dotOn]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
      </View>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TelegramSender() {
  const { role } = useAuth();
  const {
    consumePendingEmergencyChatMessage,
    isEmergencyActive,
    emotionalState,
    primaryContact,
  } = useApp();

  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 400;
  const isCaregiver = role === 'caregiver';

  const mySender: MessageSender = isCaregiver ? 'caregiver' : 'care_receiver';
  const otherSender: MessageSender = isCaregiver ? 'care_receiver' : 'caregiver';

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSpeller, setShowSpeller] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [lastUpdateId, setLastUpdateId] = useState<number>(0);
  const [emergencyAcknowledged, setEmergencyAcknowledged] = useState(false);

  const seenIncomingIds = useRef<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const prevEmotionalState = useRef<EmotionalState>(emotionalState);
  const prevEmergencyActive = useRef(false);

  const canSend = message.trim().length > 0 && !loading;
  const latestItem = chat.length > 0 ? chat[chat.length - 1] : null;
  const showPlayingCard = latestItem?.sender !== mySender && !isCaregiver && latestItem?.type === 'text';
  const showEmergencyAlarm = isCaregiver && isEmergencyActive && !emergencyAcknowledged;

  // Reset acknowledgment when a new emergency fires
  useEffect(() => {
    if (isEmergencyActive && !prevEmergencyActive.current) {
      setEmergencyAcknowledged(false);
    }
    prevEmergencyActive.current = isEmergencyActive;
  }, [isEmergencyActive]);

  // Inject state-change system messages
  useEffect(() => {
    if (emotionalState === prevEmotionalState.current) return;
    prevEmotionalState.current = emotionalState;
    const meta = STATE_META[emotionalState];
    setChat((prev) => [
      ...prev,
      {
        id: `state-${Date.now()}`,
        author: 'system',
        sender: 'care_receiver',
        text: `${meta.icon} Estado BCI: ${meta.label}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'state_update',
        stateLevel: emotionalState,
      },
    ]);
  }, [emotionalState]);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingEmergencyChatMessage();
      if (!pending) return;
      setChat((prev) => [
        ...prev,
        {
          id: `emergency-${Date.now()}`,
          author: 'outgoing',
          sender: mySender,
          text: pending.toUpperCase(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          deliveryStatus: 'sent',
        },
      ]);
    }, [consumePendingEmergencyChatMessage, mySender])
  );

  const postMessage = async (text: string, msgType: 'text' | 'image' = 'text') => {
    const clean = text.trim();
    if (!clean) return;
    setShowSpeller(false);

    const messageId = String(Date.now());
    setChat((prev) => [
      ...prev,
      {
        id: messageId,
        author: 'outgoing',
        sender: mySender,
        text: msgType === 'image' ? clean : clean.toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msgType,
        deliveryStatus: 'sending',
      },
    ]);
    setMessage('');
    setLoading(true);
    setLastStatus('idle');

    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `[${SENDER_LABELS[mySender]}] ${clean}`,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastStatus('success');
        setChat((prev) => prev.map((item) => item.id === messageId ? { ...item, deliveryStatus: 'sent' } : item));
        setTimeout(() => {
          setChat((prev) => prev.map((item) => item.id === messageId ? { ...item, deliveryStatus: 'read' } : item));
        }, 1800);
      } else {
        setLastStatus('error');
        setChat((prev) => prev.map((item) => item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item));
        Alert.alert('Error', `Telegram respondió: ${data.description}`);
      }
    } catch {
      setLastStatus('error');
      setChat((prev) => prev.map((item) => item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item));
      Alert.alert('Error de red', 'No se pudo conectar a Telegram.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let polling = false;
    const pollUpdates = async () => {
      if (polling) return;
      polling = true;
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted || !data.ok || !Array.isArray(data.result)) return;
        let maxId = lastUpdateId;
        const toAppend: ChatItem[] = [];
        for (const update of data.result) {
          if (typeof update.update_id === 'number') maxId = Math.max(maxId, update.update_id);
          const msg = update?.message;
          if (!msg?.text) continue;
          if (String(msg?.chat?.id) !== String(CHAT_ID)) continue;
          const incomingId = `in-${update.update_id}`;
          if (seenIncomingIds.current.has(incomingId)) continue;
          seenIncomingIds.current.add(incomingId);
          toAppend.push({
            id: incomingId,
            author: 'incoming',
            sender: otherSender,
            text: String(msg.text),
            time: new Date((msg.date ?? Math.floor(Date.now() / 1000)) * 1000).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
            type: 'text',
          });
        }
        if (toAppend.length > 0) setChat((prev) => [...prev, ...toAppend]);
        if (maxId > lastUpdateId) setLastUpdateId(maxId);
      } catch {
        // ignore poll errors
      } finally {
        polling = false;
      }
    };
    const interval = setInterval(pollUpdates, 3000);
    pollUpdates();
    return () => { mounted = false; clearInterval(interval); };
  }, [lastUpdateId, otherSender]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.wrapper}>
      <View style={s.phoneFrame}>

        <RoleSwitcher />

        <ChatHeader isCaregiver={isCaregiver} emotionalState={emotionalState} lastStatus={lastStatus} />

        <EmergencyAlarmModal
          visible={showEmergencyAlarm}
          patientName={primaryContact?.name ?? 'Usuario BCI'}
          onDismiss={() => setEmergencyAcknowledged(true)}
        />

        <ScrollView
          ref={scrollRef}
          style={s.chatArea}
          contentContainerStyle={s.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chat.map((item) => (
            <MessageBubble key={item.id} item={item} mySender={mySender} />
          ))}
          {showPlayingCard && (
            <View style={s.voiceCard}>
              <Text style={s.voiceIcon}>🔊</Text>
              <Text style={s.voiceTitle}>Reproduciendo...</Text>
              <Text style={s.wave}>································</Text>
            </View>
          )}
        </ScrollView>

        {!showSpeller && (
          <View style={s.bottomPanel}>
            {isCaregiver ? (
              <CaregiverComposer
                message={message}
                setMessage={setMessage}
                canSend={canSend}
                loading={loading}
                isSmall={isSmall}
                onSend={() => postMessage(message)}
                onImageMock={() => postMessage('📷 [Imagen adjunta]', 'image')}
              />
            ) : (
              <PatientPanel
                message={message}
                setMessage={setMessage}
                canSend={canSend}
                loading={loading}
                isSmall={isSmall}
                isMedium={isMedium}
                onSend={() => postMessage(message)}
                onQuickSend={(text) => postMessage(text)}
                onOpenSpeller={() => setShowSpeller(true)}
              />
            )}
          </View>
        )}

        {!isCaregiver && showSpeller && (
          <View style={s.spellerOverlay}>
            <View style={s.spellerOverlayHeader}>
              <Text style={s.spellerTitle}>BCI Speller</Text>
              <TouchableOpacity onPress={() => setShowSpeller(false)}>
                <Text style={s.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.composer, s.composerInSpeller]}>
              <TextInput
                style={s.input}
                placeholder="Mensaje en composición..."
                placeholderTextColor={Colors.textMuted}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity
                style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
                onPress={() => postMessage(message)}
                disabled={!canSend}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.sendText}>Enviar</Text>}
              </TouchableOpacity>
            </View>
            <View style={s.spellerGridWrap}>
              <FlatList
                data={LETTERS}
                keyExtractor={(letter, index) => `${letter}-${index}`}
                numColumns={5}
                contentContainerStyle={s.spellerGridContent}
                columnWrapperStyle={s.spellerGridRow}
                renderItem={({ item: letter }) => (
                  <TouchableOpacity
                    style={[s.letterBtn, s.letterBtnExpanded]}
                    onPress={() => setMessage((prev) => prev + letter)}
                  >
                    <Text style={s.letterText}>{letter}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F3F4F8' },
  phoneFrame: { flex: 1, width: '100%', maxWidth: 390, alignSelf: 'center' },

  header: {
    alignItems: 'center', paddingTop: 10, paddingBottom: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerName: { color: Colors.text, fontWeight: '700', fontSize: 20 },
  online: { color: Colors.success, fontWeight: '600', marginTop: 2 },
  statePill: {
    marginTop: 8, backgroundColor: '#EDF0F5', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  stateDot: { width: 9, height: 9, borderRadius: 99, backgroundColor: Colors.success },
  stateText: { color: Colors.text, fontWeight: '700' },

  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },

  systemRow: { alignItems: 'center', marginVertical: 2 },
  systemPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1,
  },
  systemText: { fontSize: 13, fontWeight: '700' },
  systemTime: { fontSize: 11, fontWeight: '500', opacity: 0.8 },

  bubble: { maxWidth: '80%', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  bubbleRight: { alignSelf: 'flex-end' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleIn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  bubbleOutPatient: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD' },
  bubbleOutCaregiver: { backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#A78BFA' },
  bubbleText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  bubbleTextPatient: { color: '#1D4ED8', fontWeight: '600', fontSize: 15 },
  bubbleTextCaregiver: { color: '#5B21B6', fontWeight: '600', fontSize: 15 },
  senderLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  imagePreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  imageText: { fontSize: 14 },
  bubbleTime: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 2 },
  deliveryIcon: { marginTop: 1 },
  deliveryPending: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginTop: 1 },
  deliveryFailed: { color: Colors.emergency, fontSize: 12, fontWeight: '800', marginTop: 1 },

  voiceCard: {
    marginTop: 8, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.primary, backgroundColor: '#ECEBFF', alignItems: 'center', padding: 16,
  },
  voiceIcon: { fontSize: 32 },
  voiceTitle: { marginTop: 4, fontSize: 16, fontWeight: '700', color: Colors.primary },
  wave: { marginTop: 8, color: Colors.primary, fontWeight: '700', letterSpacing: 2 },

  bottomPanel: { borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },

  caregiverWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  imageBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.primary, backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  inputCaregiver: { maxHeight: 80, height: undefined, paddingVertical: 8 },
  sendBtnRound: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary,
  },

  quickActions: { paddingHorizontal: 14, paddingTop: 8 },
  quickBtn: {
    width: '100%', borderWidth: 1.5, borderRadius: 13, height: 40,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8,
  },
  quickText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  quickResponseBtn: { height: 44, justifyContent: 'center', flexDirection: 'row', gap: 10 },
  spellerToggle: { borderColor: Colors.primary, backgroundColor: '#ECEBFF', justifyContent: 'center', alignItems: 'center' },
  spellerToggleText: { color: Colors.primary },

  composer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  composerSmall: { gap: 6, paddingHorizontal: 10 },
  composerInSpeller: { marginTop: 0, paddingHorizontal: 0, paddingBottom: 6 },
  input: {
    flex: 1, height: 40, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12,
    backgroundColor: Colors.white, color: Colors.text, fontWeight: '600',
  },
  inputSmall: { height: 38, paddingHorizontal: 10 },
  sendBtn: {
    minWidth: 82, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingHorizontal: 14,
  },
  sendBtnSmall: { minWidth: 74, height: 38 },
  sendBtnMedium: { minWidth: 80 },
  sendBtnDisabled: { backgroundColor: '#A7A0F6' },
  sendText: { color: Colors.white, fontWeight: '800', fontSize: 16 },

  footer: {
    height: 36, marginTop: 2, borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 10,
  },
  footerLabel: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12 },
  scanDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 9, backgroundColor: '#D1D5DB' },
  dotOn: { backgroundColor: Colors.primary },

  spellerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F3F4F8', paddingHorizontal: 14, paddingTop: 14 },
  spellerOverlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  spellerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  close: { fontSize: 22, color: Colors.textSecondary, fontWeight: '700' },
  spellerGridWrap: { flex: 1, borderWidth: 1, borderColor: Colors.primary, borderRadius: 14, backgroundColor: Colors.white, padding: 8 },
  spellerGridContent: { flexGrow: 1, justifyContent: 'space-between' },
  spellerGridRow: { justifyContent: 'space-between' },
  letterBtnExpanded: { flex: 1, marginHorizontal: 3, width: undefined, height: 66 },
  letterBtn: { width: '17.8%', height: 56, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFF' },
  letterText: { fontWeight: '700', color: Colors.text, fontSize: 20 },
});

// ─── Emergency Alarm Styles ───────────────────────────────────────────────────

const alarm = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', zIndex: 999 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.emergency, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  card: { alignItems: 'center', paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.emergency, marginBottom: 12,
  },
  patientName: { fontSize: 24, fontWeight: '800', color: Colors.text },
  stateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  stateDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.emergency },
  stateLabel: { fontSize: 15, fontWeight: '700', color: Colors.emergency },
  locationCard: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationText: { fontSize: 13, fontWeight: '700', color: Colors.emergency },
  mapPlaceholder: { height: 100, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapLabel: { fontSize: 13, color: Colors.textMuted },
  actions: { paddingHorizontal: 16, gap: 12 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.emergency, borderRadius: 14, paddingVertical: 18,
  },
  callBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, borderWidth: 2, borderColor: Colors.emergency, backgroundColor: '#FFF5F5',
  },
  secondaryBtnText: { color: Colors.emergency, fontSize: 16, fontWeight: '700' },
  dismissLink: { alignItems: 'center', paddingVertical: 20 },
  dismissText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
