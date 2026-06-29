import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SideMenuScreen from '../components/SideMenu';
import FridgeNavigator from './flows/FridgeNavigator';
import HomeNavigator from './flows/HomeNavigator';
import HouseholdNavigator from './flows/HouseholdNavigator';
import ProfileNavigator from './flows/ProfileNavigator';
import ShoppingNavigator from './flows/ShoppingNavigator';
import TasksNavigator from './flows/TasksNavigator';
import { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function AppStacks() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="HomeFlow">
      <RootStack.Screen name="HomeFlow" component={HomeNavigator} />
      <RootStack.Screen
        name="Menu"
        component={SideMenuScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <RootStack.Screen name="StorageFlow" component={FridgeNavigator} />
      <RootStack.Screen name="ShoppingFlow" component={ShoppingNavigator} />
      <RootStack.Screen name="TasksFlow" component={TasksNavigator} />
      <RootStack.Screen name="HouseholdFlow" component={HouseholdNavigator} />
      <RootStack.Screen name="ProfileFlow" component={ProfileNavigator} />
    </RootStack.Navigator>
  );
}
