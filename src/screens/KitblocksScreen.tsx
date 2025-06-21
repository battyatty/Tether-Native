import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList, Kitblock } from '../types';

type KitblocksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: KitblocksScreenNavigationProp;
}

const HEADER_MAX_HEIGHT = 100;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const KitblocksScreen: React.FC<Props> = ({ navigation }) => {
  const { kitblocks, deleteKitblock } = useTether();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animated values for header transformation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const slimHeaderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleDeleteKitblock = (kitblock: Kitblock) => {
    Alert.alert(
      'Delete Kitblock',
      `Are you sure you want to delete "${kitblock.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteKitblock(kitblock.id),
        },
      ]
    );
  };

  const handleDuplicateKitblock = (kitblock: Kitblock) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate kitblock:', kitblock.id);
    Alert.alert('Duplicate', `Duplicate "${kitblock.name}" functionality coming soon!`);
  };

  const handleMorePress = (kitblockId: string) => {
    const kitblock = kitblocks.find(k => k.id === kitblockId);
    if (!kitblock) return;

    Alert.alert(
      kitblock.name,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => handleDuplicateKitblock(kitblock),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteKitblock(kitblock),
        },
      ]
    );
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const renderKitblockCard = ({ item: kitblock }: { item: Kitblock }) => {
    const totalDuration = kitblock.tasks.reduce((sum, task) => sum + task.duration, 0);

    return (
      <TouchableOpacity
        style={styles.kitblockCard}
        onPress={() => navigation.navigate('EditKitblock', { kitblockId: kitblock.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.kitblockContentLeft}>
            <Text style={styles.kitblockName}>{kitblock.name}</Text>
            
            {kitblock.description && (
              <Text style={styles.kitblockDescription}>{kitblock.description}</Text>
            )}
            
            <View style={styles.kitblockInfo}>
              <Text style={styles.kitblockInfoText}>
                {formatDuration(totalDuration)} • {kitblock.tasks.length} task{kitblock.tasks.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.kitblockActions}>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleMorePress(kitblock.id)}
            >
              <Icon name="more-vert" size={18} color={theme.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No kitblocks yet</Text>
      <Text style={styles.emptySubtext}>
        Create reusable task groups to speed up tether building
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => navigation.navigate('CreateKitblock')}
      >
        <Icon name="add" size={24} color={theme.text.inverse} />
        <Text style={styles.createFirstButtonText}>Create Your First Kitblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Collapsible Header */}
      <Animated.View style={[styles.animatedHeader, { 
        height: headerHeight,
        top: insets.top 
      }]}>
        {/* Full Header */}
        <Animated.View style={[styles.fullHeader, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>My Kitblocks</Text>
          <Text style={styles.headerSubtitle}>
            Reusable task groups for faster tether building
          </Text>
        </Animated.View>
        
        {/* Slim Header */}
        <Animated.View style={[styles.slimHeader, { opacity: slimHeaderOpacity }]}>
          <Text style={styles.slimHeaderTitle}>My Kitblocks</Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Content with top padding to account for header and safe area */}
        <View style={[styles.content, { paddingTop: HEADER_MAX_HEIGHT + insets.top - 40 }]}>
          {kitblocks.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={kitblocks}
              renderItem={renderKitblockCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Disable internal scroll, use parent ScrollView
            />
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background.primary,
    zIndex: 5,
  },
  fullHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  slimHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.text.tertiary,
  },
  slimHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  kitblockCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent.tidewake,
  },
  cardMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kitblockContentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  kitblockName: {
    color: theme.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  kitblockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitblockDescription: {
    color: theme.text.secondary,
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  kitblockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitblockInfoText: {
    color: theme.text.tertiary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: theme.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: theme.text.tertiary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  createFirstButton: {
    backgroundColor: theme.accent.tidewake,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  createFirstButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default KitblocksScreen;
