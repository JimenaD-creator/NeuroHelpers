import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  SafeAreaView,
} from 'react-native';

const BrainIcon = () => <Text style={{ fontSize: 56 }}>🧠</Text>;
const WarningIcon = () => <Text style={{ fontSize: 20 }}>⚠️</Text>;
const MessageIcon = () => <Text style={{ fontSize: 20 }}>💬</Text>;
const PersonIcon = () => <Text style={{ fontSize: 28 }}>👤</Text>;
const SpeakerIcon = () => <Text style={{ fontSize: 20 }}>🔊</Text>;

const PulseRing = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 1400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, scale]);

  return <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />;
};

export default function MainScreen({ onOpenChat }: { onOpenChat: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estado actual</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.connectionCard}>
          <Text style={styles.connectionLabel}>Conexión BCI</Text>
          <View style={styles.connectionStatus}>
            <View style={styles.greenDot} />
            <Text style={styles.connectionText}>Conectado</Text>
          </View>
        </View>

        <View style={styles.brainWrapper}>
          <PulseRing />
          <View style={styles.brainCircle}>
            <BrainIcon />
          </View>
        </View>

        <View style={styles.emotionWrapper}>
          <Text style={styles.emotionLabel}>Estado emocional detectado</Text>
          <View style={styles.emotionStatus}>
            <Text style={styles.emotionText}>Calmado</Text>
            <View style={styles.greenDotSmall} />
          </View>
        </View>

        <View style={styles.buttonsWrapper}>
          <TouchableOpacity style={[styles.actionButton, styles.emergencyButton]} activeOpacity={0.82}>
            <WarningIcon />
            <Text style={styles.actionButtonText}>EMERGENCIA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.messageButton]} activeOpacity={0.82} onPress={onOpenChat}>
            <MessageIcon />
            <Text style={styles.actionButtonText}>ENVIAR MENSAJE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.contactInfo}>
            <PersonIcon />
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Contacto principal</Text>
              <Text style={styles.contactName}>Mamá</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.audioButton}>
            <SpeakerIcon />
            <Text style={styles.audioLabel}>Voz activada</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 20;
const PRIMARY_RED = '#E53935';
const PRIMARY_BLUE = '#2979FF';
const BG = '#F5F7FA';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B7280';
const GREEN = '#22C55E';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  menuButton: { width: 36, height: 36, justifyContent: 'center', gap: 5 },
  menuLine: { height: 2, backgroundColor: TEXT_PRIMARY, borderRadius: 2, marginVertical: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: 0.3 },
  settingsButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  connectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionLabel: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 6, fontWeight: '500' },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  connectionText: { fontSize: 15, fontWeight: '600', color: GREEN },
  brainWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 20, height: 160 },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  brainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emotionWrapper: { alignItems: 'center', marginBottom: 32 },
  emotionLabel: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 6, fontWeight: '500' },
  emotionStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emotionText: { fontSize: 22, fontWeight: '700', color: GREEN, letterSpacing: 0.2 },
  greenDotSmall: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  buttonsWrapper: { gap: 14, marginBottom: 32 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: CARD_RADIUS,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  emergencyButton: { backgroundColor: PRIMARY_RED, shadowColor: PRIMARY_RED },
  messageButton: { backgroundColor: PRIMARY_BLUE, shadowColor: PRIMARY_BLUE },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactText: { gap: 2 },
  contactLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },
  contactName: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
  audioButton: { alignItems: 'center', gap: 4 },
  audioLabel: { fontSize: 11, color: TEXT_SECONDARY, fontWeight: '500' },
});
