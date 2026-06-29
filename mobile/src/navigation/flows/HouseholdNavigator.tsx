import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateHouseholdScreen from '../../screens/households/CreateHouseholdScreen';
import HouseTasksScreen from '../../screens/households/HouseTasksScreen';
import HouseholdDetailScreen from '../../screens/households/HouseholdDetailScreen';
import HouseholdListScreen from '../../screens/households/HouseholdListScreen';
import HouseholdMembersScreen from '../../screens/households/HouseholdMembersScreen';
import HouseholdSettingsScreen from '../../screens/households/HouseholdSettingsScreen';
import InviteScreen from '../../screens/households/InviteScreen';
import JoinHouseholdScreen from '../../screens/households/JoinHouseholdScreen';
import ManageCategoriesScreen from '../../screens/households/ManageCategoriesScreen';
import ManageStoragesScreen from '../../screens/households/ManageStoragesScreen';
import MemberDetailScreen from '../../screens/households/MemberDetailScreen';
import { HouseholdStackParamList } from '../types';
import { stackScreenOptions } from '../stackOptions';

const HouseholdStack = createNativeStackNavigator<HouseholdStackParamList>();

export default function HouseholdNavigator() {
  return (
    <HouseholdStack.Navigator screenOptions={stackScreenOptions}>
      <HouseholdStack.Screen name="HouseholdList" component={HouseholdListScreen} options={{ title: 'Minhas Casas', headerBackVisible: false }} />
      <HouseholdStack.Screen name="CreateHousehold" component={CreateHouseholdScreen} options={{ title: 'Nova Casa', presentation: 'modal' }} />
      <HouseholdStack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} options={({ route }) => ({ title: route.params.householdName })} />
      <HouseholdStack.Screen name="HouseholdMembers" component={HouseholdMembersScreen} options={({ route }) => ({ title: `Pessoas - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} options={{ title: 'Configurações' }} />
      <HouseholdStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Convidar' }} />
      <HouseholdStack.Screen name="JoinHousehold" component={JoinHouseholdScreen} options={{ title: 'Entrar com código' }} />
      <HouseholdStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Membro' }} />
      <HouseholdStack.Screen name="ManageStorages" component={ManageStoragesScreen} options={({ route }) => ({ title: `Estoques - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="ManageCategories" component={ManageCategoriesScreen} options={({ route }) => ({ title: `Categorias - ${route.params.householdName}` })} />
      <HouseholdStack.Screen name="HouseTasks" component={HouseTasksScreen} options={({ route }) => ({ title: `Checklist - ${route.params.householdName}` })} />
    </HouseholdStack.Navigator>
  );
}
