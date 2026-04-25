import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function TabsLayout() {
  const { role } = useAuth();
  const isCaregiver = role === 'caregiver';
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
        headerStyle: { backgroundColor: '#FFF1A8' },
        headerTintColor: '#B77900',
        headerTitleStyle: { color: '#B77900', fontWeight: '700' },
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
          href: isCaregiver ? null : undefined,
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
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="cog-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}