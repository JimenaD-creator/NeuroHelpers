import { Tabs, Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useApp, EmotionalState } from '@/context/AppContext';

const HEADER_BY_STATE: Record<EmotionalState, { bg: string; fg: string }> = {
  calmado: { bg: '#16A34A', fg: '#FFFFFF' },
  estres: { bg: '#D97706', fg: '#FFFFFF' },
  panico: { bg: '#DC2626', fg: '#FFFFFF' },
};

export default function TabsLayout() {
  const router = useRouter();
  const { role, isLoggedIn, isBootstrapping } = useAuth();
  const { emotionalState, isEmergencyActive } = useApp();
  const isCaregiver = role === 'caregiver';
  const headerTheme = HEADER_BY_STATE[emotionalState];
  const prevEmergency = useRef(false);

  // Send caregiver to the emergency screen whenever a new emergency fires
  useEffect(() => {
    if (isEmergencyActive && !prevEmergency.current && isCaregiver) {
      router.push('/emergency');
    }
    prevEmergency.current = isEmergencyActive;
  }, [isEmergencyActive, isCaregiver]);

  if (!isBootstrapping && !isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: headerTheme.bg },
        headerTintColor: headerTheme.fg,
        headerTitleStyle: { color: headerTheme.fg, fontWeight: '700' },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: isCaregiver ? null : '/(tabs)',
          title: 'Home',
          headerTitle: 'Current status',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: isCaregiver ? 'Care' : 'Contacts',
          headerTitle: isCaregiver ? 'Caregiver console' : 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isCaregiver ? 'pulse-outline' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}