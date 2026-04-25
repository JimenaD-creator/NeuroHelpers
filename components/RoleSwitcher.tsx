import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export function RoleSwitcher() {
  const { role, switchRole } = useAuth();
  const isCaregiver = role === 'caregiver';

  const handleSwitch = () => {
    switchRole(isCaregiver ? 'patient' : 'caregiver');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.pill, isCaregiver ? styles.pillCaregiver : styles.pillPatient]}>
        <Ionicons
          name={isCaregiver ? 'shield-checkmark' : 'person'}
          size={14}
          color={isCaregiver ? Colors.primary : Colors.success}
        />
        <Text style={[styles.roleText, isCaregiver ? styles.roleTextCaregiver : styles.roleTextPatient]}>
          {isCaregiver ? 'Cuidador' : 'Usuario BCI'}
        </Text>
      </View>
      <TouchableOpacity style={styles.switchBtn} onPress={handleSwitch} activeOpacity={0.75}>
        <Ionicons name="swap-horizontal" size={14} color={Colors.textSecondary} />
        <Text style={styles.switchText}>Cambiar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    backgroundColor: '#FAFAFA',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillPatient: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.success,
  },
  pillCaregiver: {
    backgroundColor: '#EDE9FE',
    borderColor: Colors.primary,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleTextPatient: {
    color: Colors.success,
  },
  roleTextCaregiver: {
    color: Colors.primary,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: Colors.white,
  },
  switchText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
