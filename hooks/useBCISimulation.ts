import { useEffect, useCallback } from 'react';
import { useApp, EmotionalState } from '@/context/AppContext';

/**
 * Hook for simulating BCI (Brain-Computer Interface) input
 * 
 * This hook provides methods to simulate emotional state changes
 * that would come from an external BCI device.
 * 
 * Usage:
 * const { simulateState, simulatePanic, simulateCalm, simulateStress } = useBCISimulation();
 * 
 * // Simulate a specific state
 * simulateState('panico');
 * 
 * // Or use convenience methods
 * simulatePanic(); // Triggers panic state and shows alert dialog
 * simulateCalm();  // Sets calm state
 * simulateStress(); // Sets stress state
 */
export function useBCISimulation() {
  const { 
    setEmotionalState, 
    setShowPanicDialog,
    triggerEmergency,
    isConnected,
  } = useApp();

  /**
   * Simulate receiving a new emotional state from BCI device
   */
  const simulateState = useCallback((state: EmotionalState) => {
    if (!isConnected) {
      console.warn('[BCI] Device not connected');
      return;
    }
    
    console.log(`[BCI] Emotional state detected: ${state}`);
    setEmotionalState(state);
    
    // If panic is detected, show the alert dialog
    if (state === 'panico') {
      setShowPanicDialog(true);
    }
  }, [isConnected, setEmotionalState, setShowPanicDialog]);

  /**
   * Convenience method to simulate panic state
   */
  const simulatePanic = useCallback(() => {
    simulateState('panico');
  }, [simulateState]);

  /**
   * Convenience method to simulate calm state
   */
  const simulateCalm = useCallback(() => {
    simulateState('calmado');
  }, [simulateState]);

  /**
   * Convenience method to simulate stress state
   */
  const simulateStress = useCallback(() => {
    simulateState('estres');
  }, [simulateState]);

  /**
   * Simulate an immediate emergency (bypasses dialog)
   */
  const simulateImmediateEmergency = useCallback(() => {
    if (!isConnected) {
      console.warn('[BCI] Device not connected');
      return;
    }
    
    console.log('[BCI] Immediate emergency triggered');
    setEmotionalState('panico');
    triggerEmergency();
  }, [isConnected, setEmotionalState, triggerEmergency]);

  return {
    simulateState,
    simulatePanic,
    simulateCalm,
    simulateStress,
    simulateImmediateEmergency,
    isConnected,
  };
}

/**
 * External API for controlling the app from outside React components
 * 
 * This can be used to expose the BCI simulation to:
 * - Native modules (React Native bridge)
 * - WebSocket connections
 * - Bluetooth device callbacks
 * - Testing frameworks
 * 
 * Example integration with a BLE device:
 * 
 * ```typescript
 * import { BCIEventEmitter } from './hooks/useBCISimulation';
 * 
 * // In your BLE handler:
 * bleDevice.onCharacteristicChanged((data) => {
 *   const state = parseEmotionalState(data);
 *   BCIEventEmitter.emit('stateChange', state);
 * });
 * ```
 */
export const BCIEventEmitter = {
  listeners: new Map<string, Set<(data: any) => void>>(),
  
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  },
  
  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  },
  
  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  },
};

/**
 * Hook to listen for external BCI events
 * Use this in components that need to respond to external state changes
 */
export function useBCIEventListener() {
  const { simulateState } = useBCISimulation();
  
  useEffect(() => {
    const unsubscribe = BCIEventEmitter.on('stateChange', (state: EmotionalState) => {
      simulateState(state);
    });
    
    return unsubscribe;
  }, [simulateState]);
}
