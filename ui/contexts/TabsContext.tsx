import React, { createContext, useState, useContext } from 'react';

interface Tab {
  name: string;
  imageUrl: string | null;
  zoom: number;
  pan: { x: number; y: number };
  isNew?: boolean;
  selection?: { x: number; y: number; width: number; height: number } | null;
}

interface TabsContextType {
  tabs: Tab[];
  activeTab: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  addTab: (tab: Omit<Tab, 'zoom' | 'pan'>) => void;
  removeTab: (index: number) => void;
  setActiveTab: (index: number) => void;
  updateTabState: (index: number, state: Partial<Tab>) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}

export function TabsProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addTab = (tab: Omit<Tab, 'zoom' | 'pan'>) => {
    const newTabIndex = tabs.length;
    setTabs(prev => [...prev, { ...tab, zoom: 1, pan: { x: 0, y: 0 }, isNew: true }]);
    setActiveTab(newTabIndex);
  };

  const removeTab = (index: number) => {
    setTabs(prev => prev.filter((_, i) => i !== index));
    if (index === activeTab) {
      setActiveTab(0);
    }
  };

  const updateTabState = (index: number, state: Partial<Tab>) => {
    setTabs(prev => prev.map((tab, i) => 
      i === index ? { 
        ...tab, 
        ...state,
        isNew: false,
        zoom: state.zoom ? Math.min(Math.max(state.zoom, 0.1), 10) : tab.zoom,
        pan: state.pan ?? tab.pan
      } : tab
    ));
  };

  return (
    <TabsContext.Provider value={{ 
      tabs, 
      activeTab, 
      isLoading,
      setIsLoading,
      addTab, 
      removeTab, 
      setActiveTab,
      updateTabState 
    }}>
      {children}
    </TabsContext.Provider>
  );
}