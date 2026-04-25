import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getEmotionalStateColor } from '@/constants/theme';
import type { EmotionalState } from '@/context/AppContext';

interface BrainIconProps {
  state: EmotionalState;
  size?: number;
}

export function BrainIcon({ state, size = 120 }: BrainIconProps) {
  const stateColors = getEmotionalStateColor(state);
  const ringSize = size + 40;
  const innerRingSize = size + 20;

  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }]}>
      {/* Outer ring */}
      <View 
        style={[
          styles.outerRing, 
          { 
            width: ringSize, 
            height: ringSize, 
            borderRadius: ringSize / 2,
            borderColor: stateColors.light,
          }
        ]} 
      />
      
      {/* Middle ring */}
      <View 
        style={[
          styles.middleRing, 
          { 
            width: innerRingSize, 
            height: innerRingSize, 
            borderRadius: innerRingSize / 2,
            borderColor: stateColors.primary,
          }
        ]} 
      />
      
      {/* Inner circle with brain icon */}
      <View 
        style={[
          styles.innerCircle, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: stateColors.light,
          }
        ]}
      >
        <Ionicons 
          name="fitness" 
          size={size * 0.5} 
          color={stateColors.primary} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 3,
  },
  middleRing: {
    position: 'absolute',
    borderWidth: 4,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
