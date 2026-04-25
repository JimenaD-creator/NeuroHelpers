import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
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
        headerStyle: {
          backgroundColor: '#FFF1A8',
        },
        headerTintColor: '#B77900',
        headerTitleStyle: {
          color: '#B77900',
          fontWeight: '700',
        },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Current status',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerLeft: () => (
            <Ionicons 
              name="menu" 
              size={24} 
              color="#B77900" 
              style={{ marginLeft: 16 }} 
            />
          ),
          headerRight: () => (
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color="#B77900" 
              style={{ marginRight: 16 }} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          headerTitle: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerRight: () => (
            <Ionicons 
              name="add" 
              size={28} 
              color="#B77900" 
              style={{ marginRight: 16 }} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
