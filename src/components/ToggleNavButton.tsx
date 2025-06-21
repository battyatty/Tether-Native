import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types';

interface ToggleNavButtonProps {
  style?: any;
  currentRoute: string;
  onTabPress: (tab: keyof MainTabParamList) => void;
}

const ToggleNavButton: React.FC<ToggleNavButtonProps> = ({ style, currentRoute, onTabPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Determine current active side based on route
  const isOnTethers = currentRoute === 'Home';
  const isOnKitblocks = currentRoute === 'Kitblocks';
  
  const handleToggle = (targetRoute: 'Home' | 'Kitblocks') => {
    if (currentRoute !== targetRoute) {
      onTabPress(targetRoute);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.togglePill}>
        {/* Tethers Side */}
        <TouchableOpacity
          style={[
            styles.toggleSide,
            styles.leftSide,
            isOnTethers && styles.activeSide,
          ]}
          onPress={() => handleToggle('Home')}
          activeOpacity={0.7}
        >
          <Icon 
            name="anchor" 
            size={16} 
            color={isOnTethers ? theme.text.inverse : theme.text.tertiary}
            style={styles.icon}
          />
          <Text 
            style={[
              styles.toggleText,
              isOnTethers && styles.activeText,
            ]}
          >
            TETHERS
          </Text>
        </TouchableOpacity>

        {/* KitBlocks Side */}
        <TouchableOpacity
          style={[
            styles.toggleSide,
            styles.rightSide,
            isOnKitblocks && styles.activeSide,
          ]}
          onPress={() => handleToggle('Kitblocks')}
          activeOpacity={0.7}
        >
          <Icon 
            name="apps" 
            size={16} 
            color={isOnKitblocks ? theme.text.inverse : theme.text.tertiary}
            style={styles.icon}
          />
          <Text 
            style={[
              styles.toggleText,
              isOnKitblocks && styles.activeText,
            ]}
          >
            KITBLOCKS
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2, // Take up more space than other nav items
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: theme.background.secondary,
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.border.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 19,
    minWidth: 85,
  },
  leftSide: {
    // No additional styles needed
  },
  rightSide: {
    // No additional styles needed
  },
  activeSide: {
    backgroundColor: theme.accent.tidewake,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    marginRight: 5,
  },
  toggleText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.text.tertiary,
    textAlign: 'center',
  },
  activeText: {
    color: theme.text.inverse,
    fontWeight: '700',
  },
});

export default ToggleNavButton;
