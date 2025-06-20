import { NavigatorScreenParams } from '@react-navigation/native';

export interface Task {
  id: string;
  name: string;
  duration: number; // in seconds
  notes?: string;
  location?: string;
  isAnchored: boolean;
  anchoredStartTime?: string;
  completed: boolean;
  actualDuration?: number;
  scheduledDate?: string;
  KitblockId?: string;
  KitblockName?: string;
  status?: TaskStatus;
  pausedDuration?: number;
  groupLabel?: string;
  isTravelBlock?: boolean;
  linkedTaskId?: string;
  hasTravelBlock?: boolean;
  durationModification?: DurationModification;
  travelBlockDuration?: number;
  travelBlockNotes?: string;
  linkedTravelTask?: Task;
}

export type TaskStatus = 'pending' | 'completed' | 'skipped' | 'partial';

export enum TetherMode {
  FLEXIBLE = 'flexible',
  SCHEDULED = 'scheduled'
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: string[]; // Array of task IDs
}

export interface DraggableItem {
  id: string;
  type: 'group' | 'task';
  content: Task | { label: string; isKitBlock: boolean };
}

export interface Kitblock {
  id: string;
  name: string;
  identifier?: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
  lastUsed?: string;
}

export interface Tether {
  id: string;
  name: string;
  tasks: Task[];
  groups?: TaskGroup[];
  createdAt: string;
  lastUsed?: string;
  startTime?: string;
  remindersEnabled?: boolean;
  endGuardEnabled?: boolean;
  plannedEndTime?: string;
  
  // Tether mode properties
  mode?: TetherMode;
  scheduledStartTime?: string; // Format: "HH:MM"
  scheduledDate?: string; // Optional: for future date scheduling
}

export interface ActiveTether extends Tether {
  startTime: string;
  endTime: string;
  currentTaskIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  actualStartTime?: string;
  pausedAt?: string;
}

export interface TetherSummary {
  tetherId: string;
  tetherName: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedDuration: number;
  actualDuration: number;
  tasks: {
    id: string;
    name: string;
    plannedDuration: number;
    actualDuration: number;
    status?: TaskStatus;
  }[];
}

export interface FlattenedItem {
  id: string;
  type: 'group' | 'task';
  groupLabel?: string;
  task?: Task;
  isKitBlock?: boolean;
}

export interface DurationModification {
  originalDuration: number;
  newDuration: number;
  modifiedAt: string;
}

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EditTether: { tetherId: string };
  CreateTether: undefined;
  ExecutionMode: { tetherId: string };
  EditKitblock: { kitblockId: string };
  CreateKitblock: undefined;
  EditTask: { 
    task: Task; 
    sourceType: 'tether' | 'kitblock'; 
    sourceId: string; 
  };
  TetherSettings: { tetherId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Kitblocks: undefined;
  Settings: undefined;
};
