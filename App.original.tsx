/**
 * TetherApp - Task Management Mobile App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TetherProvider } from './src/context/TetherContext';
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
import { Task } from './src/types';

export type RootStackParamList = {
  Home: undefined;
  EditTether: { tetherId: string };
  CreateTether: undefined;
  Settings: undefined;
  ExecutionMode: { tetherId: string };
  Kitblocks: undefined;
  EditKitblock: { kitblockId: string };
  CreateKitblock: undefined;
  EditTask: { 
    task: Task; 
    sourceType: 'tether' | 'kitblock'; 
    sourceId: string; 
  };
  TetherSettings: { tetherId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TetherProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#0F172A"
          />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1E293B',
              borderBottomWidth: 1,
              borderBottomColor: '#334155',
            },
            headerTintColor: '#E2E8F0',
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'My Tethers',
              headerShown: false, // We'll use custom header in HomeScreen
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
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
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
            name="Kitblocks" 
            component={KitblocksScreen}
            options={{
              headerShown: false,
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
    </TetherProvider>
    </GestureHandlerRootView>
  );
}

export default App;
