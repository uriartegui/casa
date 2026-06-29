import React from 'react';
import { GlobalSearchProvider } from '../context/GlobalSearchContext';
import AppStacks from './stacks';

export type {
  FridgeStackParamList,
  HomeStackParamList,
  HouseholdStackParamList,
  RootStackParamList,
  ShoppingStackParamList,
} from './types';

export default function AppTabs() {
  return (
    <GlobalSearchProvider>
      <AppStacks />
    </GlobalSearchProvider>
  );
}
