import React, { createContext, useCallback, useContext, useState } from 'react';

type GlobalSearchContextData = {
  visible: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextData>({
  visible: false,
  openSearch: () => {},
  closeSearch: () => {},
});

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const openSearch = useCallback(() => setVisible(true), []);
  const closeSearch = useCallback(() => setVisible(false), []);

  return (
    <GlobalSearchContext.Provider value={{ visible, openSearch, closeSearch }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearchModal() {
  return useContext(GlobalSearchContext);
}
