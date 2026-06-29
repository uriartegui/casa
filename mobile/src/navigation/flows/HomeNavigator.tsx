import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddFridgeItemScreen from '../../screens/fridge/AddFridgeItemScreen';
import HomeScreen from '../../screens/home/HomeScreen';
import AddShoppingItemScreen from '../../screens/shopping/AddShoppingItemScreen';
import CreateShoppingListScreen from '../../screens/shopping/CreateShoppingListScreen';
import ShoppingListDetailScreen from '../../screens/shopping/ShoppingListDetailScreen';
import { HomeStackParamList } from '../types';
import { stackScreenOptions } from '../stackOptions';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="AddFridgeItem" component={AddFridgeItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <HomeStack.Screen name="AddShoppingItem" component={AddShoppingItemScreen} options={{ title: 'Novo Item', presentation: 'modal' }} />
      <HomeStack.Screen name="HomeShoppingListDetail" component={ShoppingListDetailScreen as unknown as React.ComponentType} options={({ route }) => ({ title: route.params.listName })} />
      <HomeStack.Screen name="HomeCreateShoppingList" component={CreateShoppingListScreen as unknown as React.ComponentType} options={{ title: 'Nova Lista', presentation: 'modal' }} />
    </HomeStack.Navigator>
  );
}
