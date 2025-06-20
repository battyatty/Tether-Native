import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tether, ActiveTether, Task, Kitblock, TetherMode } from '../types';
import { generateId } from '../utils/helpers';

interface TetherContextType {
  tethers: Tether[];
  kitblocks: Kitblock[];
  activeTether: ActiveTether | null;
  loading: boolean;
  error: string | null;
  
  // Tether actions
  createTether: (name: string, tasks: Task[]) => Promise<void>;
  deleteTether: (id: string) => Promise<void>;
  updateTether: (tether: Tether) => Promise<void>;
  updateTetherMode: (tetherId: string, mode: TetherMode, scheduledStartTime?: string) => Promise<void>;
  
  // Kitblock actions
  createKitblock: (name: string, tasks: Task[], description?: string) => Promise<void>;
  deleteKitblock: (id: string) => Promise<void>;
  updateKitblock: (kitblock: Kitblock) => Promise<void>;
  addTaskToKitblock: (kitblockId: string, task: Omit<Task, 'id'>) => Promise<void>;
  insertKitblockIntoTether: (tetherId: string, kitblockId: string) => Promise<void>;
  
  // Active tether actions
  startTether: (tetherId: string) => Promise<void>;
  stopTether: () => Promise<void>;
  pauseTether: () => Promise<void>;
  resumeTether: () => Promise<void>;
  nextTask: () => Promise<void>;
  previousTask: () => Promise<void>;
  
  // Task actions
  addTaskToTether: (tetherId: string, task: Omit<Task, 'id'>) => Promise<void>;
  updateTaskInTether: (tetherId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTaskFromTether: (tetherId: string, taskId: string) => Promise<void>;
  duplicateTaskInTether: (tetherId: string, taskId: string) => Promise<void>;
  
  // Kitblock task actions
  deleteTaskFromKitblock: (kitblockId: string, taskId: string) => Promise<void>;
  duplicateTaskInKitblock: (kitblockId: string, taskId: string) => Promise<void>;
  updateTaskInKitblock: (kitblockId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reorderTethers: (fromIndex: number, toIndex: number) => Promise<void>;
}

const TetherContext = createContext<TetherContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TETHERS: '@tethers',
  ACTIVE_TETHER: '@active_tether',
};

// Mock data for initial development
const mockTethers: Tether[] = [
  {
    id: '1',
    name: 'Morning Routine',
    tasks: [
      { id: '1', name: 'Coffee & Planning', duration: 900, isAnchored: false, completed: false },
      { id: '2', name: 'Exercise', duration: 1800, isAnchored: false, completed: false },
    ],
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Deep Work Session',
    tasks: [
      { id: '3', name: 'Focus Time', duration: 3600, isAnchored: false, completed: false },
      { id: '4', name: 'Break', duration: 900, isAnchored: false, completed: false },
    ],
    createdAt: new Date().toISOString(),
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const TetherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tethers, setTethers] = useState<Tether[]>([]);
  const [kitblocks, setKitblocks] = useState<Kitblock[]>([]);
  const [activeTether, setActiveTether] = useState<ActiveTether | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadTethers();
    loadKitblocks();
    loadActiveTether();
  }, []);

  // Save tethers when they change
  useEffect(() => {
    if (!loading) {
      saveTethers();
    }
  }, [tethers, loading]);

  // Save active tether when it changes
  useEffect(() => {
    if (!loading) {
      saveActiveTether();
    }
  }, [activeTether, loading]);

  // Save kitblocks when they change
  useEffect(() => {
    if (!loading) {
      saveKitblocks();
    }
  }, [kitblocks, loading]);

  const loadTethers = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TETHERS);
      if (stored) {
        setTethers(JSON.parse(stored));
      } else {
        // Use mock data for first run
        setTethers(mockTethers);
      }
    } catch (err) {
      console.error('Error loading tethers:', err);
      setTethers(mockTethers); // Fallback to mock data
      setError('Failed to load tethers');
    } finally {
      setLoading(false);
    }
  };

  const saveTethers = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TETHERS, JSON.stringify(tethers));
    } catch (err) {
      console.error('Error saving tethers:', err);
      setError('Failed to save tethers');
    }
  };

  const loadActiveTether = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TETHER);
      if (stored) {
        setActiveTether(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading active tether:', err);
    }
  };

  const saveActiveTether = async () => {
    try {
      if (activeTether) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TETHER, JSON.stringify(activeTether));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TETHER);
      }
    } catch (err) {
      console.error('Error saving active tether:', err);
    }
  };

  const loadKitblocks = async () => {
    try {
      const stored = await AsyncStorage.getItem('kitblocks');
      if (stored) {
        setKitblocks(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading kitblocks:', err);
      setError('Failed to load kitblocks');
    }
  };

  const saveKitblocks = async () => {
    try {
      await AsyncStorage.setItem('kitblocks', JSON.stringify(kitblocks));
    } catch (err) {
      console.error('Error saving kitblocks:', err);
      setError('Failed to save kitblocks');
    }
  };

  const createTether = async (name: string, tasks: Task[]) => {
    try {
      const newTether: Tether = {
        id: generateId(),
        name,
        tasks,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };
      
      setTethers(prev => [newTether, ...prev]);
    } catch (err) {
      setError('Failed to create tether');
      throw err;
    }
  };

  const deleteTether = async (id: string) => {
    try {
      setTethers(prev => prev.filter(t => t.id !== id));
      
      // Stop active tether if it's the one being deleted
      if (activeTether?.id === id) {
        setActiveTether(null);
      }
    } catch (err) {
      setError('Failed to delete tether');
      throw err;
    }
  };

  const updateTether = async (updatedTether: Tether) => {
    try {
      setTethers(prev => prev.map(t => 
        t.id === updatedTether.id ? { ...updatedTether, lastUsed: new Date().toISOString() } : t
      ));
    } catch (err) {
      setError('Failed to update tether');
      throw err;
    }
  };

  const updateTetherMode = async (tetherId: string, mode: TetherMode, scheduledStartTime?: string) => {
    try {
      const tetherIndex = tethers.findIndex(t => t.id === tetherId);
      if (tetherIndex === -1) throw new Error('Tether not found');

      const updates: Partial<Tether> = {
        mode,
        lastUsed: new Date().toISOString(),
      };

      if (mode === TetherMode.SCHEDULED && scheduledStartTime) {
        updates.scheduledStartTime = scheduledStartTime;
      } else if (mode === TetherMode.FLEXIBLE) {
        // Clear scheduled time when switching to flexible
        updates.scheduledStartTime = undefined;
      }

      const updatedTether = { ...tethers[tetherIndex], ...updates };
      setTethers(prev => prev.map(t => t.id === tetherId ? updatedTether : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tether mode');
      throw err;
    }
  };

  const createKitblock = async (name: string, tasks: Task[], description?: string) => {
    try {
      const newKitblock: Kitblock = {
        id: generateId(),
        name,
        description,
        tasks,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };
      
      setKitblocks(prev => [newKitblock, ...prev]);
    } catch (err) {
      setError('Failed to create kitblock');
      throw err;
    }
  };

  const deleteKitblock = async (id: string) => {
    try {
      setKitblocks(prev => prev.filter(kb => kb.id !== id));
    } catch (err) {
      setError('Failed to delete kitblock');
      throw err;
    }
  };  const updateKitblock = async (updatedKitblock: Kitblock) => {
    try {
      setKitblocks(prev => prev.map(kb =>
        kb.id === updatedKitblock.id ? { ...updatedKitblock, lastUsed: new Date().toISOString() } : kb
      ));
    } catch (err) {
      setError('Failed to update kitblock');
      throw err;
    }
  };

  const addTaskToKitblock = async (kitblockId: string, taskData: Omit<Task, 'id'>) => {
    try {
      const task: Task = {
        ...taskData,
        id: generateId(),
      };
      setKitblocks(prev => prev.map(kb =>
        kb.id === kitblockId
          ? { ...kb, tasks: [...kb.tasks, task], lastUsed: new Date().toISOString() }
          : kb
      ));
    } catch (err) {
      setError('Failed to add task to kitblock');
      throw err;
    }
  };

  const insertKitblockIntoTether = async (tetherId: string, kitblockId: string) => {
    try {
      const kitblock = kitblocks.find(kb => kb.id === kitblockId);
      const tether = tethers.find(t => t.id === tetherId);
      
      if (kitblock && tether) {
        const updatedTether = {
          ...tether,
          tasks: [...tether.tasks, ...kitblock.tasks],
          lastUsed: new Date().toISOString(),
        };
        await updateTether(updatedTether);
      }
    } catch (err) {
      setError('Failed to insert kitblock into tether');
      throw err;
    }
  };

  const startTether = async (tetherId: string) => {
    try {
      const tether = tethers.find(t => t.id === tetherId);
      if (!tether) {
        throw new Error('Tether not found');
      }

      const newActiveTether: ActiveTether = {
        ...tether,
        tasks: tether.tasks.map(task => ({ ...task, completed: false })),
        currentTaskIndex: 0,
        startTime: new Date().toISOString(),
        endTime: '',
        isRunning: true,
        isPaused: false,
      };

      setActiveTether(newActiveTether);
      
      // Update last used time
      await updateTether({ ...tether, lastUsed: new Date().toISOString() });
    } catch (err) {
      setError('Failed to start tether');
      throw err;
    }
  };

  const stopTether = async () => {
    try {
      setActiveTether(null);
    } catch (err) {
      setError('Failed to stop tether');
      throw err;
    }
  };

  const pauseTether = async () => {
    try {
      if (activeTether && activeTether.isRunning) {
        setActiveTether(prev => prev ? {
          ...prev,
          isRunning: false,
          isPaused: true,
        } : null);
      }
    } catch (err) {
      setError('Failed to pause tether');
      throw err;
    }
  };

  const resumeTether = async () => {
    try {
      if (activeTether && !activeTether.isRunning) {
        setActiveTether(prev => prev ? {
          ...prev,
          isRunning: true,
          isPaused: false,
        } : null);
      }
    } catch (err) {
      setError('Failed to resume tether');
      throw err;
    }
  };

  const nextTask = async () => {
    try {
      if (activeTether && activeTether.currentTaskIndex < activeTether.tasks.length - 1) {
        setActiveTether(prev => prev ? {
          ...prev,
          currentTaskIndex: prev.currentTaskIndex + 1,
          tasks: prev.tasks.map((task, index) => 
            index === prev.currentTaskIndex ? { ...task, completed: true } : task
          ),
        } : null);
      }
    } catch (err) {
      setError('Failed to move to next task');
      throw err;
    }
  };

  const previousTask = async () => {
    try {
      if (activeTether && activeTether.currentTaskIndex > 0) {
        setActiveTether(prev => prev ? {
          ...prev,
          currentTaskIndex: prev.currentTaskIndex - 1,
          tasks: prev.tasks.map((task, index) => 
            index === prev.currentTaskIndex ? { ...task, completed: false } : task
          ),
        } : null);
      }
    } catch (err) {
      setError('Failed to move to previous task');
      throw err;
    }
  };

  const addTaskToTether = async (tetherId: string, taskData: Omit<Task, 'id'>) => {
    try {
      const task: Task = {
        ...taskData,
        id: generateId(),
      };

      setTethers(prev => prev.map(tether => 
        tether.id === tetherId 
          ? { ...tether, tasks: [...tether.tasks, task] }
          : tether
      ));
    } catch (err) {
      setError('Failed to add task');
      throw err;
    }
  };

  const updateTaskInTether = async (tetherId: string, taskId: string, updates: Partial<Task>) => {
    try {
      setTethers(prev => prev.map(tether => 
        tether.id === tetherId 
          ? {
              ...tether,
              tasks: tether.tasks.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
              )
            }
          : tether
      ));
    } catch (err) {
      setError('Failed to update task');
      throw err;
    }
  };

  const deleteTaskFromTether = async (tetherId: string, taskId: string) => {
    try {
      setTethers(prev => prev.map(tether => 
        tether.id === tetherId 
          ? { ...tether, tasks: tether.tasks.filter(task => task.id !== taskId) }
          : tether
      ));
    } catch (err) {
      setError('Failed to delete task');
      throw err;
    }
  };

  const duplicateTaskInTether = async (tetherId: string, taskId: string) => {
    try {
      setTethers(prev => prev.map(tether => {
        if (tether.id === tetherId) {
          const taskToDuplicate = tether.tasks.find(task => task.id === taskId);
          if (taskToDuplicate) {
            const duplicatedTask: Task = {
              ...taskToDuplicate,
              id: generateId(),
              name: `${taskToDuplicate.name} (Copy)`,
            };
            const taskIndex = tether.tasks.findIndex(task => task.id === taskId);
            const newTasks = [...tether.tasks];
            newTasks.splice(taskIndex + 1, 0, duplicatedTask);
            return { ...tether, tasks: newTasks };
          }
        }
        return tether;
      }));
    } catch (err) {
      setError('Failed to duplicate task');
      throw err;
    }
  };

  const deleteTaskFromKitblock = async (kitblockId: string, taskId: string) => {
    try {
      setKitblocks(prev => prev.map(kitblock => 
        kitblock.id === kitblockId 
          ? { ...kitblock, tasks: kitblock.tasks.filter(task => task.id !== taskId), lastUsed: new Date().toISOString() }
          : kitblock
      ));
    } catch (err) {
      setError('Failed to delete task from kitblock');
      throw err;
    }
  };

  const duplicateTaskInKitblock = async (kitblockId: string, taskId: string) => {
    try {
      setKitblocks(prev => prev.map(kitblock => {
        if (kitblock.id === kitblockId) {
          const taskToDuplicate = kitblock.tasks.find(task => task.id === taskId);
          if (taskToDuplicate) {
            const duplicatedTask: Task = {
              ...taskToDuplicate,
              id: generateId(),
              name: `${taskToDuplicate.name} (Copy)`,
            };
            const taskIndex = kitblock.tasks.findIndex(task => task.id === taskId);
            const newTasks = [...kitblock.tasks];
            newTasks.splice(taskIndex + 1, 0, duplicatedTask);
            return { ...kitblock, tasks: newTasks, lastUsed: new Date().toISOString() };
          }
        }
        return kitblock;
      }));
    } catch (err) {
      setError('Failed to duplicate task in kitblock');
      throw err;
    }
  };

  const updateTaskInKitblock = async (kitblockId: string, taskId: string, updates: Partial<Task>) => {
    try {
      setKitblocks(prev => prev.map(kitblock =>
        kitblock.id === kitblockId
          ? {
              ...kitblock,
              tasks: kitblock.tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
              ),
              lastUsed: new Date().toISOString(),
            }
          : kitblock
      ));
    } catch (err) {
      setError('Failed to update task in kitblock');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const reorderTethers = async (fromIndex: number, toIndex: number) => {
    try {
      const newTethers = [...tethers];
      const [movedTether] = newTethers.splice(fromIndex, 1);
      newTethers.splice(toIndex, 0, movedTether);
      setTethers(newTethers);
    } catch (err) {
      setError('Failed to reorder tethers');
      throw err;
    }
  };

  const value: TetherContextType = {
    tethers,
    kitblocks,
    activeTether,
    loading,
    error,
    createTether,
    deleteTether,
    updateTether,
    updateTetherMode,
    createKitblock,
    deleteKitblock,
    updateKitblock,
    addTaskToKitblock,
    insertKitblockIntoTether,
    startTether,
    stopTether,
    pauseTether,
    resumeTether,
    nextTask,
    previousTask,
    addTaskToTether,
    updateTaskInTether,
    deleteTaskFromTether,
    duplicateTaskInTether,
    deleteTaskFromKitblock,
    duplicateTaskInKitblock,
    updateTaskInKitblock,
    reorderTethers,
    clearError,
  };

  return (
    <TetherContext.Provider value={value}>
      {children}
    </TetherContext.Provider>
  );
};

export const useTether = () => {
  const context = useContext(TetherContext);
  if (context === undefined) {
    throw new Error('useTether must be used within a TetherProvider');
  }
  return context;
};
