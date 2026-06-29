import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddShoppingItemScreen from '../../screens/shopping/AddShoppingItemScreen';
import CreateShoppingListScreen from '../../screens/shopping/CreateShoppingListScreen';
import SendToFridgeScreen from '../../screens/shopping/SendToFridgeScreen';
import ShoppingActivityScreen from '../../screens/shopping/ShoppingActivityScreen';
import ShoppingListDetailScreen from '../../screens/shopping/ShoppingListDetailScreen';
import ShoppingListsScreen from '../../screens/shopping/ShoppingListsScreen';
import { ShoppingStackParamList } from '../types';
import { stackScreenOptions } from '../stackOptions';

const ShoppingStack = createNativeStackNavigator<ShoppingStackParamList>();

export default function ShoppingNavigator() {
  return (
    <ShoppingStack.Navigator screenOptions={stackScreenOptions}>
      <ShoppingStack.Screen name="ShoppingLists" component={ShoppingListsScreen} options={{ title: 'Listas de Compras', headerBackVisible: false }} />
      <ShoppingStack.Screen name="ShoppingActivity" component={ShoppingActivityScreen} options={{ title: 'Atividade da lista' }} />
      <ShoppingStack.Screen name="ShoppingListDetail" component={ShoppingListDetailScreen} options={({ route }) => ({ title: route.params.listName })} />
      <ShoppingStack.Screen name="CreateShoppingList" component={CreateShoppingListScreen} options={{ title: 'Nova Lista', presentation: 'modal' }} />
      <ShoppingStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <ShoppingStack.Screen name="SendToFridge" component={SendToFridgeScreen} options={{ title: 'Guardar no estoque', presentation: 'modal' }} />
    </ShoppingStack.Navigator>
  );
}
