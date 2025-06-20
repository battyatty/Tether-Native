/**
 * TetherApp - Task Management Mobile App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TetherProvider, useTether } from './src/context/TetherContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import EditTetherScreen from './src/screens/EditTetherScreen';
import CreateTetherScreen from './src/screens/CreateTetherScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ExecutionModeScreen from './src/screens/ExecutionModeScreen';
import KitblocksScreen from './src/screens/KitblocksScreen';
import CreateKitblockScreen from './src/screens/CreateKitblockScreen';
import EditKitblockScreen from './src/screens/EditKitblockScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import TetherSettingsScreen from './src/screens/TetherSettingsScreen';
import { BottomNavigation, OngoingTetherBar } from './src/components';
import { Task } from './src/types';

export type RootStackParamList = {
  MainTabs: undefined;
  EditTether: { tetherId: string };
  CreateTether: undefined;
  ExecutionMode: { tetherId: string };
  EditKitblock: { kitblockId: string };
  CreateKitblock: undefined;
  EditTask: { 
    task: Task; 
    sourceType: 'tether' | 'kitblock'; 
    sourceId: string; 
  };
  TetherSettings: { tetherId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Kitblocks: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Navigator with our bottom navigation
function MainTabNavigator() {
  const { activeTether } = useTether();
  
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const currentRoute = props.state.routes[props.state.index].name;
          
          const handleTabPress = (tab: keyof MainTabParamList) => {
            props.navigation.navigate(tab);
          };
          
          const handleAddPress = () => {
            // Get the parent navigator to access stack navigation
            const parentNav = props.navigation.getParent();
            if (currentRoute === 'Home') {
              parentNav?.navigate('CreateTether');
            } else if (currentRoute === 'Kitblocks') {
              parentNav?.navigate('CreateKitblock');
            }
          };
          
          return (
            <View>
              {activeTether && <OngoingTetherBar />}
              <BottomNavigation
                currentRoute={currentRoute}
                onTabPress={handleTabPress}
                onAddPress={handleAddPress}
              />
            </View>
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Kitblocks" component={KitblocksScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

// Navigation with theme context
function ThemedNavigation() {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.background.primary}
      />
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background.secondary,
            borderBottomWidth: 1,
            borderBottomColor: theme.border.primary,
          },
          headerTintColor: theme.text.primary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EditTether" 
          component={EditTetherScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="CreateTether" 
          component={CreateTetherScreen}
          options={{
            title: 'Create Tether',
            headerShown: false, // Custom header in component
          }}
        />
        <Stack.Screen 
          name="ExecutionMode"
          component={ExecutionModeScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent swipe back during session
          }}
        />
        <Stack.Screen 
          name="CreateKitblock" 
          component={CreateKitblockScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EditKitblock"
          component={EditKitblockScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TetherSettings"
          component={TetherSettingsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <TetherProvider>
          <ThemedNavigation />
        </TetherProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
