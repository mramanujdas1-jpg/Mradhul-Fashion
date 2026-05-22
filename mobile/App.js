import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MobileProvider } from './context';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? '🏠' : '🏡';
          } else if (route.name === 'Categories') {
            iconName = focused ? '📂' : '📁';
          } else if (route.name === 'Bag') {
            iconName = focused ? '👜' : '💼';
          } else if (route.name === 'Profile') {
            iconName = focused ? '👤' : '👤';
          }

          return <Text style={{ fontSize: 20 }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#701122',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EBEBEB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#EBEBEB'
        },
        headerTitleStyle: {
          fontFamily: 'System',
          fontSize: 16,
          fontWeight: 'bold',
          color: '#701122'
        },
        headerTitleAlign: 'center'
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: 'Mradhul Fashion' }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerTitle: 'Shop by Category' }}
      />
      <Tab.Screen
        name="Bag"
        component={CartScreen}
        options={{ headerTitle: 'Shopping Bag' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: 'My Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <MobileProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF'
            },
            headerTintColor: '#701122',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 16
            },
            headerTitleAlign: 'center'
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: 'Product Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </MobileProvider>
  );
}
