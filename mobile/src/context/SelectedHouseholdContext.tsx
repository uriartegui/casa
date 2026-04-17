import React, { createContext, useContext, useState } from 'react';

interface SelectedHouseholdContextData {
  selectedHouseholdId: string | null;
  setSelectedHouseholdId: (id: string | null) => void;
}

const SelectedHouseholdContext = createContext<SelectedHouseholdContextData>(
  {} as SelectedHouseholdContextData
);

export function SelectedHouseholdProvider({ children }: { children: React.ReactNode }) {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  return (
    <SelectedHouseholdContext.Provider value={{ selectedHouseholdId, setSelectedHouseholdId }}>
      {children}
    </SelectedHouseholdContext.Provider>
  );
}

export function useSelectedHousehold() {
  return useContext(SelectedHouseholdContext);
}
