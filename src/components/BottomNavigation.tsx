import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BottomNavigationProps {
  currentRoute: string;
  isExecutionMode?: boolean;
  onTabPress: (tab: keyof MainTabParamList) => void;
  onAddPress: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute,
  isExecutionMode = false,
  onTabPress,
  onAddPress,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const handleAddClick = () => {
    onAddPress();
  };

  const handleTabNavigation = (tab: keyof MainTabParamList) => {
    onTabPress(tab);
  };

  const getAddButtonLabel = () => {
    switch (currentRoute) {
      case 'Home':
        return 'Add Tether';
      case 'Kitblocks':
        return 'Add Block';
      default:
        return 'Add';
    }
  };

  if (isExecutionMode) {
    return null; // Hide during execution mode
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Settings */}
        <TouchableOpacity
          style={[
            styles.navItem,
            currentRoute === 'Settings' && styles.activeNavItem,
          ]}
          onPress={() => handleTabNavigation('Settings')}
        >
          <Icon 
            name="settings" 
            size={20} 
            color={currentRoute === 'Settings' ? theme.accent.tidewake : theme.text.quaternary} 
          />
          <Text 
            style={[
              styles.navLabel,
              currentRoute === 'Settings' && styles.activeNavLabel,
            ]}
          >
            SETTINGS
          </Text>
        </TouchableOpacity>

        {/* Tethers */}
        <TouchableOpacity
          style={[
            styles.navItem,
            currentRoute === 'Home' && styles.activeNavItem,
          ]}
          onPress={() => handleTabNavigation('Home')}
        >
          <Icon 
            name="anchor" 
            size={20} 
            color={currentRoute === 'Home' ? theme.accent.tidewake : theme.text.quaternary} 
          />
          <Text 
            style={[
              styles.navLabel,
              currentRoute === 'Home' && styles.activeNavLabel,
            ]}
          >
            TETHERS
          </Text>
        </TouchableOpacity>

        {/* Kit Blocks */}
        <TouchableOpacity
          style={[
            styles.navItem,
            currentRoute === 'Kitblocks' && styles.activeNavItem,
          ]}
          onPress={() => handleTabNavigation('Kitblocks')}
        >
          <Icon 
            name="apps" 
            size={20} 
            color={currentRoute === 'Kitblocks' ? theme.accent.tidewake : theme.text.quaternary} 
          />
          <Text 
            style={[
              styles.navLabel,
              currentRoute === 'Kitblocks' && styles.activeNavLabel,
            ]}
          >
            KIT BLOCKS
          </Text>
        </TouchableOpacity>

        {/* Dynamic Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddClick}
          activeOpacity={0.8}
        >
          <Icon name="add" size={24} color={theme.text.inverse} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    backgroundColor: theme.background.primary,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.background.primary,
    paddingTop: 8,
    paddingBottom: 2,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border.primary,
    height: 55,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  activeNavItem: {
    // Active state styling is handled by color changes
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    color: theme.text.quaternary,
    textAlign: 'center',
  },
  activeNavLabel: {
    color: theme.accent.tidewake,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accent.tidewake,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default BottomNavigation;
