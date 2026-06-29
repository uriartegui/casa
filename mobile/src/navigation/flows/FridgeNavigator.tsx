import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StorageHouseholdHeader } from '../../components/AppHeader';
import { useHouseholds } from '../../hooks/useHouseholds';
import AddFridgeItemScreen from '../../screens/fridge/AddFridgeItemScreen';
import CreateStorageScreen from '../../screens/fridge/CreateStorageScreen';
import FridgeItemDetailScreen from '../../screens/fridge/FridgeItemDetailScreen';
import FridgeScreen from '../../screens/fridge/FridgeScreen';
import StorageActivityScreen from '../../screens/fridge/StorageActivityScreen';
import { FridgeStackParamList } from '../types';
import { stackScreenOptions } from '../stackOptions';

const FridgeStack = createNativeStackNavigator<FridgeStackParamList>();

export default function FridgeNavigator() {
  const { data: households } = useHouseholds();

  return (
    <FridgeStack.Navigator screenOptions={stackScreenOptions}>
      <FridgeStack.Screen name="StorageActivity" component={StorageActivityScreen} options={{ title: 'Atividade dos estoques', headerBackVisible: false }} />
      <FridgeStack.Screen
        name="Fridge"
        component={FridgeScreen}
        options={({ route, navigation }) => {
          const householdName = households?.find((household) => household.id === route.params.householdId)?.name;
          return {
            headerBackVisible: false,
            headerTitle: () => <StorageHouseholdHeader navigation={navigation} storageName={route.params.storageName} householdName={householdName ?? ''} />,
          };
        }}
      />
      <FridgeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <FridgeStack.Screen name="FridgeItemDetail" component={FridgeItemDetailScreen} options={{ title: 'Detalhes', presentation: 'modal' }} />
      <FridgeStack.Screen name="CreateStorage" component={CreateStorageScreen} options={{ title: 'Novo Compartimento', presentation: 'modal' }} />
    </FridgeStack.Navigator>
  );
}
