import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
