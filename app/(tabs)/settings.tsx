import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}


function SettingRow({ label, value, onPress, showChevron = true }: SettingRowProps) {
  return (
    <TouchableOpacity 
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { settings, setSettings } = useApp();
  const {logout} = useAuth();

  const handleVoiceToggle = (value: boolean) => {
    setSettings({ ...settings, voiceEnabled: value });
  };

  const handleVolumeChange = (value: number) => {
    setSettings({ ...settings, volume: value });
  };

  const sensitivityLabels = {
    baja: 'Low',
    media: 'Medium',
    alta: 'High',
  };

  const cycleSensitivity = () => {
    const levels: Array<'baja' | 'media' | 'alta'> = ['baja', 'media', 'alta'];
    const currentIndex = levels.indexOf(settings.bciSensitivity);
    const nextIndex = (currentIndex + 1) % levels.length;
    setSettings({ ...settings, bciSensitivity: levels[nextIndex] });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Voice Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice settings</Text>
        
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice enabled</Text>
            <Switch
              value={settings.voiceEnabled}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.volumeContainer}>
            <Text style={styles.settingLabel}>Volume</Text>
            <View style={styles.volumeRow}>
              <Pressable onPress={() => handleVolumeChange(Math.max(0, settings.volume - 0.1))}>
                <Ionicons name="volume-low" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Pressable 
                style={styles.sliderContainer}
                onPress={(e) => {
                  const { locationX, target } = e.nativeEvent as any;
                  // Calculate percentage based on touch location
                  if (locationX !== undefined) {
                    const percentage = Math.min(1, Math.max(0, locationX / 200));
                    handleVolumeChange(percentage);
                  }
                }}
              >
                <View 
                  style={[
                    styles.sliderTrack,
                    { width: `${settings.volume * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.sliderThumb,
                    { left: `${settings.volume * 100}%` }
                  ]} 
                />
              </Pressable>
              <Pressable onPress={() => handleVolumeChange(Math.min(1, settings.volume + 0.1))}>
                <Ionicons name="volume-high" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* BCI Sensitivity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BCI sensitivity</Text>
        
        <View style={styles.card}>
          <SettingRow
            label="Detection level"
            value={sensitivityLabels[settings.bciSensitivity]}
            onPress={cycleSensitivity}
          />
        </View>
      </View>

      {/* Other Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other options</Text>
        
        <View style={styles.card}>
          <SettingRow label="Tutorial" />
          <View style={styles.separator} />
          <SettingRow label="About the app" />
        </View>
      </View>
      <TouchableOpacity
        style={{
          marginTop: 24,
          minHeight: 44,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
        onPress={logout}
      >
        <Text style={{ color: '#DC2626', fontWeight: '700' }}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  volumeContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  sliderContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    top: -6,
    marginLeft: -8,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
});
