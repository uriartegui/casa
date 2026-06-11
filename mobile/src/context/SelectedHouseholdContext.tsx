import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Household } from '../types';

const SELECTED_HOUSEHOLD_KEY = '@casa:selected-household-id';

interface SelectedHouseholdContextData {
  selectedHouseholdId: string | null;
  isSelectedHouseholdReady: boolean;
  setSelectedHouseholdId: (id: string | null) => void;
}

const SelectedHouseholdContext = createContext<SelectedHouseholdContextData>(
  {} as SelectedHouseholdContextData
);

export function SelectedHouseholdProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [isSelectedHouseholdReady, setIsSelectedHouseholdReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_HOUSEHOLD_KEY)
      .then(setSelectedHouseholdId)
      .finally(() => setIsSelectedHouseholdReady(true));
  }, []);

  const persistSelectedHouseholdId = useCallback((id: string | null) => {
    setSelectedHouseholdId(id);
    if (id) {
      AsyncStorage.setItem(SELECTED_HOUSEHOLD_KEY, id).catch(() => {});
    } else {
      AsyncStorage.removeItem(SELECTED_HOUSEHOLD_KEY).catch(() => {});
    }
  }, []);

  return (
    <SelectedHouseholdContext.Provider
      value={{
        selectedHouseholdId,
        isSelectedHouseholdReady,
        setSelectedHouseholdId: persistSelectedHouseholdId,
      }}
    >
      {children}
    </SelectedHouseholdContext.Provider>
  );
}

export function useSelectedHousehold() {
  return useContext(SelectedHouseholdContext);
}

export function useSelectedHouseholdSync(households: Household[] | undefined) {
  const { selectedHouseholdId, isSelectedHouseholdReady, setSelectedHouseholdId } = useSelectedHousehold();

  useEffect(() => {
    if (!isSelectedHouseholdReady || !households) return;

    if (households.length === 0) {
      if (selectedHouseholdId) setSelectedHouseholdId(null);
      return;
    }

    const selectedStillExists = households.some((household) => household.id === selectedHouseholdId);
    if (!selectedHouseholdId || !selectedStillExists) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, isSelectedHouseholdReady, selectedHouseholdId, setSelectedHouseholdId]);
}
