import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { publishEmotionalState, subscribeEmotionalState } from '@/services/realtimeState';

export type EmotionalState = 'calmado' | 'estres' | 'panico';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  type: 'sent' | 'received';
}

export interface Settings {
  voiceEnabled: boolean;
  volume: number;
  bciSensitivity: 'baja' | 'media' | 'alta';
}

export interface AlertStatus {
  contactsNotified: { name: string; notified: boolean }[];
  locationShared: boolean;
  messageSent: boolean;
  calling: boolean;
}

interface AppContextType {
  // BCI State
  emotionalState: EmotionalState;
  setEmotionalState: (state: EmotionalState) => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  isPatientChatOpen: boolean;
  setIsPatientChatOpen: (open: boolean) => void;
  
  // Emergency
  isEmergencyActive: boolean;
  setIsEmergencyActive: (active: boolean) => void;
  alertStatus: AlertStatus;
  setAlertStatus: (status: AlertStatus) => void;
  showPanicDialog: boolean;
  setShowPanicDialog: (show: boolean) => void;
  
  // Contacts
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  primaryContact: Contact | null;
  
  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  currentPlayingMessage: Message | null;
  setCurrentPlayingMessage: (message: Message | null) => void;
  
  // Settings
  settings: Settings;
  setSettings: (settings: Settings) => void;
  
  // Actions
  triggerEmergency: () => void;
  cancelEmergency: () => void;
  sendQuickMessage: (type: 'bien' | 'ayuda' | 'emergencia') => void;
  /** Queued when emergency flow finishes; read once in chat (TelegramSender). */
  queueEmergencyChatMessage: (text: string) => void;
  consumePendingEmergencyChatMessage: () => string | null;
}

const defaultContacts: Contact[] = [
  { id: '1', name: 'Caregiver', phone: '+51 912 345 678', isPrimary: true },
];

const defaultSettings: Settings = {
  voiceEnabled: true,
  volume: 0.7,
  bciSensitivity: 'media',
};

const AppContext = createContext<AppContextType | undefined>(undefined);
const EMOTIONAL_STATE_CYCLE_MS = 8000;

export function AppProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const isPatient = role === 'patient';
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('calmado');
  const [isConnected, setIsConnected] = useState(true);
  const [isPatientChatOpen, setIsPatientChatOpen] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showPanicDialog, setShowPanicDialog] = useState(false);
  const [alertStatus, setAlertStatus] = useState<AlertStatus>({
    contactsNotified: [],
    locationShared: false,
    messageSent: false,
    calling: false,
  });
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Voy en camino, estoy cerca.', timestamp: '10:30 AM', type: 'received' },
  ]);
  const [currentPlayingMessage, setCurrentPlayingMessage] = useState<Message | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const pendingEmergencyChatTextRef = useRef<string | null>(null);
  const panicEmergencyLockRef = useRef(false);

  useEffect(() => {
    // Patient acts as the source of truth for state generation.
    if (isPatient) return;
    const unsubscribe = subscribeEmotionalState((next) => {
      setEmotionalState(next);
    });
    return () => unsubscribe();
  }, [isPatient]);

  useEffect(() => {
    if (!isPatient) return;
    publishEmotionalState(emotionalState).catch(() => {
      // Ignore transient sync errors in demo mode.
    });
  }, [emotionalState, isPatient]);

  useEffect(() => {
    if (!isPatient) return;
    const cycle: EmotionalState[] = ['calmado', 'estres', 'panico'];
    const interval = setInterval(() => {
      setEmotionalState((prev) => {
        const idx = cycle.indexOf(prev);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % cycle.length;
        return cycle[nextIdx];
      });
    }, EMOTIONAL_STATE_CYCLE_MS);

    return () => clearInterval(interval);
  }, [isPatient]);

  useEffect(() => {
    if (emotionalState !== 'panico') {
      panicEmergencyLockRef.current = false;
    }
  }, [emotionalState]);

  const primaryContact = contacts.find(c => c.isPrimary) || null;

  const queueEmergencyChatMessage = useCallback((text: string) => {
    pendingEmergencyChatTextRef.current = text;
  }, []);

  const consumePendingEmergencyChatMessage = useCallback(() => {
    const t = pendingEmergencyChatTextRef.current;
    pendingEmergencyChatTextRef.current = null;
    return t;
  }, []);

  const triggerEmergency = () => {
    if (isEmergencyActive) return;
    if (emotionalState === 'panico' && panicEmergencyLockRef.current) return;
    if (emotionalState === 'panico') {
      panicEmergencyLockRef.current = true;
    }

    setIsEmergencyActive(true);
    setAlertStatus({
      contactsNotified: contacts
        .filter((c) => c.isPrimary || c.name === 'Caregiver')
        .map((c) => ({ name: c.name, notified: false })),
      locationShared: false,
      messageSent: false,
      calling: false,
    });
    
    // Simulate progressive notifications
    setTimeout(() => {
      setAlertStatus(prev => ({
        ...prev,
        contactsNotified: prev.contactsNotified.map((c, i) => i === 0 ? { ...c, notified: true } : c),
      }));
    }, 1000);
    
    setTimeout(() => {
      setAlertStatus(prev => ({
        ...prev,
        contactsNotified: prev.contactsNotified.map(c => ({ ...c, notified: true })),
      }));
    }, 2000);
    
    setTimeout(() => {
      setAlertStatus(prev => ({ ...prev, messageSent: true }));
    }, 3000);
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setShowPanicDialog(false);
    setAlertStatus({
      contactsNotified: [],
      locationShared: false,
      messageSent: false,
      calling: false,
    });
  };

  const sendQuickMessage = (type: 'bien' | 'ayuda' | 'emergencia') => {
    const messageTexts = {
      bien: "I'm okay",
      ayuda: 'I need help',
      emergencia: 'EMERGENCY!',
    };
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageTexts[type],
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      type: 'sent',
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (type === 'emergencia') {
      triggerEmergency();
    }
  };

  return (
    <AppContext.Provider
      value={{
        emotionalState,
        setEmotionalState,
        isConnected,
        setIsConnected,
        isPatientChatOpen,
        setIsPatientChatOpen,
        isEmergencyActive,
        setIsEmergencyActive,
        alertStatus,
        setAlertStatus,
        showPanicDialog,
        setShowPanicDialog,
        contacts,
        setContacts,
        primaryContact,
        messages,
        setMessages,
        currentPlayingMessage,
        setCurrentPlayingMessage,
        settings,
        setSettings,
        triggerEmergency,
        cancelEmergency,
        sendQuickMessage,
        queueEmergencyChatMessage,
        consumePendingEmergencyChatMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
