import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Tether, Task, RootStackParamList } from '../types';
import { useTether } from '../context/TetherContext';
import { useTheme } from '../context/ThemeContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HEADER_MAX_HEIGHT = 100;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { 
    tethers, 
    activeTether, 
    loading, 
    error, 
    startTether, 
    resumeTether, 
    pauseTether,
    reorderTethers,
    clearError 
  } = useTether();
  
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Simple drag and drop state - just what we need
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const [dragOffset] = useState(new Animated.ValueXY());
  const cardHeight = 80;
  
  // Animated values for each card position
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  
  // Simple refs array for pan gestures only
  const panRefs = useRef<any[]>([]).current;

  // Update animations when tethers change
  useEffect(() => {
    // Ensure we have the right number of animated values
    while (cardAnimations.length < tethers.length) {
      cardAnimations.push(new Animated.Value(0));
    }
    // Remove excess animations if tethers were deleted
    if (cardAnimations.length > tethers.length) {
      cardAnimations.splice(tethers.length);
    }
    
    // Initialize gesture handler refs
    while (panRefs.length < tethers.length) {
      panRefs.push(React.createRef());
    }
    
    // Remove excess refs
    if (panRefs.length > tethers.length) {
      panRefs.splice(tethers.length);
    }
  }, [tethers.length, cardAnimations, panRefs]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Simplified gesture handler - track finger movement but don't move the dragged card
  const onGestureEvent = (index: number) => 
    Animated.event([{ nativeEvent: { translationY: dragOffset.y } }], {
      useNativeDriver: false,
      listener: (event: any) => {
        if (draggedIndex === index) {
          const { translationY } = event.nativeEvent;
          
          // Calculate which position we're hovering over based on finger movement
          const cardWithMargin = cardHeight + 12;
          const newHoveredIndex = Math.max(0, Math.min(tethers.length - 1,
            Math.round(index + translationY / cardWithMargin)
          ));
          
          // Animate other cards to make space (but not the dragged card itself)
          animateCardsToNewPositions(index, newHoveredIndex);
        }
      },
    });

  const animateCardsToNewPositions = (draggedIdx: number, targetIdx: number) => {
    tethers.forEach((_, index) => {
      if (index === draggedIdx) return; // Skip the dragged card
      if (!cardAnimations[index]) return; // Safety check for undefined animations
      
      let translateY = 0;
      
      // Calculate where each card should move
      if (draggedIdx < targetIdx) {
        // Dragging down: cards between original and target move up
        if (index > draggedIdx && index <= targetIdx) {
          translateY = -(cardHeight + 12);
        }
      } else if (draggedIdx > targetIdx) {
        // Dragging up: cards between target and original move down
        if (index >= targetIdx && index < draggedIdx) {
          translateY = cardHeight + 12;
        }
      }
      
      Animated.spring(cardAnimations[index], {
        toValue: translateY,
        useNativeDriver: true,
        tension: 400,
        friction: 30,
        velocity: 0,
      }).start();
    });
  };

  const resetCardAnimations = () => {
    cardAnimations.forEach((animation, index) => {
      if (animation) { // Safety check for undefined animations
        Animated.spring(animation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 25,
        }).start();
      }
    });
  };

  const onHandlerStateChange = (index: number) => (event: any) => {
    const { state, translationY } = event.nativeEvent;
    console.log('Pan handler state change:', { index, state, translationY });

    if (state === State.BEGAN) {
      // Start dragging immediately when pan begins
      setDraggedIndex(index);
      
      // Provide haptic feedback
      try {
        if (Platform.OS === 'ios') {
          const HapticFeedback = require('react-native').HapticFeedback;
          HapticFeedback?.impactAsync?.(HapticFeedback.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        console.log('Haptic feedback not available');
      }
    } else if (state === State.END || state === State.CANCELLED) {
      // Only reorder if we actually moved
      if (draggedIndex === index && Math.abs(translationY) > 20) {
        const cardWithMargin = cardHeight + 12;
        const targetIndex = Math.max(0, Math.min(tethers.length - 1,
          Math.round(index + translationY / cardWithMargin)
        ));

        if (targetIndex !== index) {
          reorderTethers(index, targetIndex);
        }
      }

      // Reset animations with smooth spring
      Animated.spring(dragOffset, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        tension: 350,
        friction: 30,
      }).start();
      
      resetCardAnimations();
      setDraggedIndex(-1);
    }
  };

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



  const handleStartTether = (id: string) => {
    navigation.navigate('ExecutionMode', { tetherId: id });
  };

  const handleTetherPress = (id: string) => {
    navigation.navigate('EditTether', { tetherId: id });
  };

  const handleCreateNew = () => {
    navigation.navigate('CreateTether');
  };

  const handleResumeActive = () => {
    if (activeTether) {
      if (activeTether.isRunning) {
        pauseTether();
      } else {
        resumeTether();
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalDuration = (tether: Tether) => {
    return tether.tasks.reduce((total, task) => total + task.duration, 0);
  };

  const formatTime = (timeString: string) => {
    // Convert "HH:MM" to display format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateEndTime = (startTime: string, durationSeconds: number) => {
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
    const endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleMorePress = (tetherId: string) => {
    // TODO: Implement more actions menu
    console.log('More pressed for tether:', tetherId);
  };

  const renderTetherCard = (tether: Tether, index: number) => {
    const isScheduled = tether.mode === 'scheduled' && tether.scheduledStartTime;
    const totalDuration = getTotalDuration(tether);
    const isBeingDragged = draggedIndex === index;
    
    const cardStyle = [
      styles.tetherCard,
      { borderLeftColor: isScheduled ? theme.accent.anchorLight : theme.accent.tidewake },
      isBeingDragged && styles.draggedCard,
    ];

    // Simplified animation - just scale and elevation, no translation
    const animatedStyle = isBeingDragged ? {
      transform: [{ scale: 1.02 }], // Just scale, no translateY
      zIndex: 1000,
      elevation: 10,
    } : {
      transform: [{ translateY: cardAnimations[index] || 0 }], // Only other cards move
    };
    
    return (
      <PanGestureHandler
        key={tether.id}
        onGestureEvent={onGestureEvent(index)}
        onHandlerStateChange={onHandlerStateChange(index)}
        minPointers={1}
        maxPointers={1}
        avgTouches={false}
        shouldCancelWhenOutside={false}
        activeOffsetY={[-40, 40]}
        activeOffsetX={[-80, 80]}
        ref={panRefs[index]}
      >
        <Animated.View style={[cardStyle, animatedStyle]}>
          <TouchableOpacity
            style={[
              styles.tetherCardContent,
              isBeingDragged && styles.draggedCardContent,
            ]}
            onPress={() => {
              // Only allow taps if we're not actively dragging
              if (draggedIndex === -1) {
                handleTetherPress(tether.id);
              }
            }}
            activeOpacity={1}
          >
            <View style={styles.cardMainContent}>
              <View style={styles.tetherContentLeft}>
                <Text style={[
                  styles.tetherName,
                  isBeingDragged && styles.draggedText,
                ]}>
                  {tether.name}
                </Text>
                
                <View style={styles.tetherInfo}>
                  {isScheduled ? (
                    <View style={styles.timeInfo}>
                      <Icon name="schedule" size={14} color={theme.text.tertiary} style={styles.timeIcon} />
                      <Text style={[
                        styles.timeText,
                        isBeingDragged && styles.draggedText,
                      ]}>
                        {formatTime(tether.scheduledStartTime!)} – {formatTime(calculateEndTime(tether.scheduledStartTime!, totalDuration))}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.flexibleInfo}>
                      <Text style={[
                        styles.taskCount,
                        isBeingDragged && styles.draggedText,
                      ]}>
                        {formatDuration(totalDuration)} • {tether.tasks.length} task{tether.tasks.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.tetherActions}>
                <TouchableOpacity
                  style={[
                    styles.moreButton,
                    isBeingDragged && styles.draggedButton,
                  ]}
                  onPress={() => draggedIndex === -1 && handleMorePress(tether.id)}
                  disabled={isBeingDragged}
                >
                  <Icon name="more-vert" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isBeingDragged && styles.draggedButton,
                  ]}
                  onPress={() => draggedIndex === -1 && handleStartTether(tether.id)}
                  disabled={isBeingDragged}
                >
                  <Icon name="play-arrow" size={18} color={theme.accent.tidewake} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No tethers yet.</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateNew}>
        <Text style={styles.emptyStateButtonText}>Create your first tether</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Collapsible Header */}
      <Animated.View style={[styles.animatedHeader, { 
        height: headerHeight,
        top: insets.top 
      }]}>
        {/* Full Header */}
        <Animated.View style={[styles.fullHeader, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>My Tethers</Text>
          <Text style={styles.headerSubtitle}>
            {activeTether ? 'Gone Fishing 🎣' : 'Set Sail For Today...'}
          </Text>
        </Animated.View>
        
        {/* Slim Header */}
        <Animated.View style={[styles.slimHeader, { opacity: slimHeaderOpacity }]}>
          <Text style={styles.slimHeaderTitle}>My Tethers</Text>
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
        scrollEnabled={draggedIndex === -1}
      >
        {/* Content with top padding to account for header and safe area */}
        <View style={[styles.content, { paddingTop: HEADER_MAX_HEIGHT + insets.top - 40 }]}>
          {tethers.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.tethersSection}>
              {tethers.map((tether, index) => renderTetherCard(tether, index))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  errorBanner: {
    backgroundColor: theme.background.secondary, // Using secondary since we don't have error background
    borderColor: theme.accent.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    zIndex: 10,
  },
  errorText: {
    color: theme.accent.danger,
    textAlign: 'center',
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
  ongoingSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 12,
  },
  ongoingCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  ongoingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ongoingTetherName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  currentTaskName: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.border.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent.tidewake,
    borderRadius: 2,
  },
  tethersSection: {
    marginTop: -10,
  },
  tetherCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent.tidewake, // Default, will be overridden dynamically
    borderWidth: 1,
    borderColor: theme.border.primary,
    position: 'relative',
  },
  tetherCardContent: {
    padding: 12,
  },
  draggedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    backgroundColor: theme.background.secondary,
    borderColor: theme.accent.tidewake,
    borderWidth: 2,
  },
  draggedCardContent: {
    opacity: 0.95,
  },
  draggedText: {
    opacity: 0.8,
  },
  draggedButton: {
    opacity: 0.6,
  },
  dropZoneCard: {
    borderColor: theme.accent.tidewake,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: `${theme.accent.tidewake}10`, // 10% opacity
  },
  dropZoneIndicator: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  dropZoneLine: {
    width: '80%',
    height: 2,
    backgroundColor: theme.accent.tidewake,
    borderRadius: 1,
    marginBottom: 4,
  },
  dropZoneText: {
    fontSize: 12,
    color: theme.accent.tidewake,
    fontWeight: '600',
    backgroundColor: theme.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dragHandle: {
    position: 'absolute',
    left: -12,
    top: '50%',
    transform: [{ translateY: -10 }],
    backgroundColor: theme.background.primary,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tetherContentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  tetherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tetherName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  tetherActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tetherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flexibleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 13,
    color: theme.text.tertiary,
  },
  taskCount: {
    fontSize: 13,
    color: theme.text.tertiary,
  },
  duration: {
    fontSize: 14,
    color: theme.accent.tidewake,
    fontWeight: '500',
  },
  taskList: {
    marginTop: 8,
  },
  taskName: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  moreTasksText: {
    fontSize: 14,
    color: theme.text.quaternary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: theme.text.primary,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: theme.accent.tidewake,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: theme.text.inverse,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;