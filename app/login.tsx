// app/login.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

type Role = 'patient' | 'caregiver';
type LoginStep = 'role' | 'pin' | 'verifying' | 'success';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [step, setStep] = useState<LoginStep>('role');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_PIN = 4;

  const appendPin = (n: string) => {
    if (loading || pin.length >= MAX_PIN) return;
    setPin((prev) => `${prev}${n}`);
  };

  const removePin = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setPin('');
    setError('');
    setStep('pin');
  };

  const submit = async () => {
    if (loading || !role || pin.length !== MAX_PIN) return;
    setLoading(true);
    setError('');
    setStep('verifying');

    const ok = await login(role, pin);

    if (!ok) {
      setLoading(false);
      setStep('pin');
      setError('Invalid PIN for selected role');
      setPin('');
      return;
    }

    setStep('success');
    setTimeout(() => {
      router.replace(role === 'caregiver' ? '/(tabs)/contacts' : '/(tabs)');
    }, 900);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.title}>BCI CARE</Text>
        <Text style={styles.subtitle}>Communication and care assist powered by BCI</Text>
      </View>

      {step === 'role' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>What is your role?</Text>
          <TouchableOpacity style={styles.roleCard} onPress={() => selectRole('patient')} activeOpacity={0.85}>
            <View style={styles.roleIcon}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View style={styles.roleBody}>
              <Text style={styles.roleLabel}>BCI User</Text>
              <Text style={styles.roleSub}>Assisted access</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleCard} onPress={() => selectRole('caregiver')} activeOpacity={0.85}>
            <View style={styles.roleIconGray}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.roleBody}>
              <Text style={styles.roleLabel}>Caregiver</Text>
              <Text style={styles.roleSub}>Monitoring and response</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {step === 'pin' && (
        <View style={styles.panel}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('role')}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Enter your PIN</Text>

          <View style={styles.pinRow}>
            {Array.from({ length: MAX_PIN }).map((_, i) => (
              <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <TouchableOpacity key={n} style={styles.keyBtn} onPress={() => appendPin(n)} activeOpacity={0.85}>
                <Text style={styles.keyText}>{n}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.keyBtn} onPress={removePin} activeOpacity={0.85}>
              <Ionicons name="backspace-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => appendPin('0')} activeOpacity={0.85}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.keyBtn, styles.keyConfirm, pin.length !== MAX_PIN && styles.keyConfirmDisabled]}
              onPress={submit}
              activeOpacity={0.85}
              disabled={pin.length !== MAX_PIN}
            >
              <Ionicons name="checkmark" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'verifying' && (
        <View style={styles.centerState}>
          <View style={styles.stateCircle}>
            <Ionicons name="lock-closed" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.stateTitle}>Verifying...</Text>
          <Text style={styles.stateSub}>Please wait</Text>
          <ActivityIndicator style={{ marginTop: 12 }} color={Colors.primary} />
        </View>
      )}

      {step === 'success' && (
        <View style={styles.centerState}>
          <View style={[styles.stateCircle, styles.stateCircleSuccess]}>
            <Ionicons name="checkmark" size={44} color={Colors.success} />
          </View>
          <Text style={styles.stateTitle}>Welcome!</Text>
          <Text style={styles.stateSub}>Redirecting...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: Colors.textSecondary,
    maxWidth: 280,
  },
  panel: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  panelTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  roleCard: {
    minHeight: 68,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconGray: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBody: {
    flex: 1,
  },
  roleLabel: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  roleSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: Spacing.sm,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  keyBtn: {
    width: '30%',
    height: 46,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  keyText: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  error: {
    textAlign: 'center',
    color: Colors.emergency,
    fontSize: FontSize.sm,
  },
  keyConfirm: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keyConfirmDisabled: {
    backgroundColor: '#A7A0F6',
    borderColor: '#A7A0F6',
  },
  centerState: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  stateCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  stateCircleSuccess: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  stateTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  stateSub: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});