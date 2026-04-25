import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const defaultContacts: Contact[] = [
  { id: '1', name: 'Mom', phone: '+51 987 654 321', isPrimary: true },
  { id: '2', name: 'Caregiver', phone: '+51 912 345 678', isPrimary: false },
  { id: '3', name: 'Brother', phone: '+51 923 456 789', isPrimary: false },
];

const defaultSettings: Settings = {
  voiceEnabled: true,
  volume: 0.7,
  bciSensitivity: 'media',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('calmado');
  const [isConnected, setIsConnected] = useState(true);
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

  const primaryContact = contacts.find(c => c.isPrimary) || null;

  const triggerEmergency = () => {
    setIsEmergencyActive(true);
    setAlertStatus({
      contactsNotified: contacts.filter(c => c.isPrimary || c.name === 'Cuidador').map(c => ({ name: c.name, notified: false })),
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
      setAlertStatus(prev => ({ ...prev, locationShared: true }));
    }, 2500);
    
    setTimeout(() => {
      setAlertStatus(prev => ({ ...prev, messageSent: true }));
    }, 3000);
    
    setTimeout(() => {
      setAlertStatus(prev => ({ ...prev, calling: true }));
    }, 3500);
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
