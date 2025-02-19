import React, { createContext, useState, useContext } from 'react';
import { useImageEditor } from '@/hooks/useImageEditor';
import { Transformation } from '@/types/transformations';

interface Tab {
  id: string;
  name: string;
  imageUrl: string | null;
  zoom: number;
  pan: { x: number; y: number };
  isNew?: boolean;
  selection?: { x: number; y: number; width: number; height: number } | null;
  history: string[];
  historyIndex: number;
  transformations: Transformation[];
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
  reorderTabs: (newTabs: Tab[]) => void;
  undo: (index: number) => void;
  redo: (index: number) => void;
  canUndo: (index: number) => boolean;
  canRedo: (index: number) => boolean;
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
  const { reorderProjects } = useImageEditor();

  const addTab = (tab: Omit<Tab, 'zoom' | 'pan'>) => {
    const newTabIndex = tabs.length;
    setTabs(prev => [...prev, { 
      ...tab, 
      zoom: 1, 
      pan: { x: 0, y: 0 }, 
      isNew: true,
      history: [tab.imageUrl || ''],
      historyIndex: 0,
      transformations: []
    }]);
    setActiveTab(newTabIndex);
  };

  const removeTab = (index: number) => {
    setTabs(prev => prev.filter((_, i) => i !== index));
    if (index === activeTab) {
      setActiveTab(0);
    }
  };

  const updateTabState = (index: number, state: Partial<Tab>) => {
    setTabs(prev => prev.map((tab, i) => {
      if (i === index) {
        const newTab = { 
          ...tab, 
          ...state,
          isNew: false,
          zoom: state.zoom ? Math.min(Math.max(state.zoom, 0.1), 10) : tab.zoom,
          pan: state.pan ?? tab.pan
        };

        if (state.imageUrl && state.imageUrl !== tab.imageUrl) {
          const newHistory = tab.history.slice(0, tab.historyIndex + 1);
          newHistory.push(state.imageUrl);
          newTab.history = newHistory;
          newTab.historyIndex = newHistory.length - 1;
        }

        return newTab;
      }
      return tab;
    }));
  };

  const reorderTabs = async (newTabs: Tab[]) => {
    const oldIndices = tabs.map((_, i) => i);
    const newIndices = newTabs.map(newTab => {
      const oldIndex = tabs.findIndex(oldTab => oldTab.id === newTab.id);
      return oldIndex;
    });
    
    await reorderProjects(oldIndices, newIndices);
    setTabs(newTabs);
  };

  const undo = (index: number) => {
    setTabs(prev => prev.map((tab, i) => {
      if (i === index && tab.historyIndex > 0) {
        const newIndex = tab.historyIndex - 1;
        return {
          ...tab,
          historyIndex: newIndex,
          imageUrl: tab.history[newIndex]
        };
      }
      return tab;
    }));
  };

  const redo = (index: number) => {
    setTabs(prev => prev.map((tab, i) => {
      if (i === index && tab.historyIndex < tab.history.length - 1) {
        const newIndex = tab.historyIndex + 1;
        return {
          ...tab,
          historyIndex: newIndex,
          imageUrl: tab.history[newIndex]
        };
      }
      return tab;
    }));
  };

  const canUndo = (index: number) => {
    return tabs[index]?.historyIndex > 0;
  };

  const canRedo = (index: number) => {
    const tab = tabs[index];
    return tab ? tab.historyIndex < tab.history.length - 1 : false;
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
      updateTabState,
      reorderTabs,
      undo,
      redo,
      canUndo,
      canRedo
    }}>
      {children}
    </TabsContext.Provider>
  );
}