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

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isActivelyDragging, setIsActivelyDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [dragOffset] = useState(new Animated.ValueXY());
  const [longPressActivated, setLongPressActivated] = useState(false);
  const cardHeight = 108;
  
  // Animated values for each card position
  const cardAnimations = useRef<Animated.Value[]>([]).current;

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
  }, [tethers.length, cardAnimations]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Gesture handlers for drag and drop
  const onGestureEvent = (index: number) => 
    Animated.event([{ nativeEvent: { translationY: dragOffset.y } }], {
      useNativeDriver: false,
      listener: (event: any) => {
        // Only process drag events if long press was activated and we're targeting the right card
        if (draggedIndex === index && longPressActivated) {
          const { translationY } = event.nativeEvent;
          
          // Only start visual dragging if moved enough
          if (Math.abs(translationY) > 10 && !isActivelyDragging) {
            setIsActivelyDragging(true);
          }
          
          if (isActivelyDragging) {
            // Calculate which position we're hovering over
            const cardWithMargin = cardHeight + 12;
            const newHoveredIndex = Math.max(0, Math.min(tethers.length - 1, 
              Math.round(draggedIndex + translationY / cardWithMargin)
            ));
            
            if (newHoveredIndex !== hoveredIndex) {
              setHoveredIndex(newHoveredIndex);
              animateCardsToNewPositions(draggedIndex, newHoveredIndex);
            }
          }
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
    const { state } = event.nativeEvent;

    if (state === State.END || state === State.CANCELLED) {
      // Only process if we were actually dragging
      if (longPressActivated && draggedIndex !== -1) {
        // Only perform reorder if user was actively dragging
        if (isActivelyDragging) {
          const targetIndex = hoveredIndex;

          if (targetIndex !== draggedIndex) {
            reorderTethers(draggedIndex, targetIndex);
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
      }

      // Always reset state when gesture ends
      setIsDragging(false);
      setIsActivelyDragging(false);
      setDraggedIndex(-1);
      setHoveredIndex(-1);
      setLongPressActivated(false);
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
    const isInDropZone = isDragging && hoveredIndex === index && draggedIndex !== index;
    
    const cardStyle = [
      styles.tetherCard,
      { borderLeftColor: isScheduled ? theme.accent.anchorLight : theme.accent.tidewake },
      isBeingDragged && styles.draggedCard,
      isInDropZone && styles.dropZoneCard,
    ];

    const animatedStyle = isBeingDragged ? {
      transform: [
        { translateY: isActivelyDragging ? dragOffset.y : 0 },
        { scale: isActivelyDragging ? 1.02 : 1 }
      ],
      zIndex: 1000,
      elevation: 10,
    } : {
      transform: [{ translateY: cardAnimations[index] || 0 }],
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
        activeOffsetY={[-20, 20]}
        failOffsetX={[-15, 15]}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        enabled={longPressActivated && draggedIndex === index}
      >
        <Animated.View style={[cardStyle, animatedStyle]}>
          {/* Drop zone indicator */}
          {isInDropZone && (
            <View style={styles.dropZoneIndicator}>
              <View style={styles.dropZoneLine} />
              <Text style={styles.dropZoneText}>Drop here</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.tetherCardContent,
              isBeingDragged && styles.draggedCardContent,
            ]}
            onPress={() => {
              // Only allow taps if we're not actively dragging
              if (!isActivelyDragging) {
                handleTetherPress(tether.id);
              }
            }}
            onLongPress={() => {
              // Activate drag mode on long press
              setLongPressActivated(true);
              setIsDragging(true);
              setDraggedIndex(index);
              setHoveredIndex(index);
              
              // Provide haptic feedback
              try {
                if (Platform.OS === 'ios') {
                  const HapticFeedback = require('react-native').HapticFeedback;
                  HapticFeedback?.impactAsync?.(HapticFeedback.ImpactFeedbackStyle.Medium);
                }
              } catch (e) {
                // Gracefully handle if haptic feedback is not available
              }
            }}
            delayLongPress={500}
            activeOpacity={isActivelyDragging ? 1 : 0.7}
            disabled={isActivelyDragging}
          >
            {/* Drag handle indicator */}
            {isBeingDragged && (
              <View style={styles.dragHandle}>
                <Icon name="drag-indicator" size={20} color={theme.text.tertiary} />
              </View>
            )}
            
            <View style={styles.tetherHeader}>
              <Text style={[
                styles.tetherName,
                isBeingDragged && styles.draggedText,
              ]}>
                {tether.name}
              </Text>
              <View style={styles.tetherActions}>
                <TouchableOpacity
                  style={[
                    styles.moreButton,
                    isBeingDragged && styles.draggedButton,
                  ]}
                  onPress={() => !isActivelyDragging && handleMorePress(tether.id)}
                  disabled={isActivelyDragging}
                >
                  <Icon name="more-vert" size={20} color={theme.text.tertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isBeingDragged && styles.draggedButton,
                  ]}
                  onPress={() => !isActivelyDragging && handleStartTether(tether.id)}
                  disabled={isActivelyDragging}
                >
                  <Icon name="play-arrow" size={20} color={theme.accent.tidewake} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tetherInfo}>
              {isScheduled ? (
                <View style={styles.timeInfo}>
                  <Icon name="schedule" size={16} color={theme.text.tertiary} style={styles.timeIcon} />
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
        scrollEnabled={!isActivelyDragging}
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
    padding: 16,
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
  tetherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tetherName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    flex: 1,
  },
  tetherActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)', // Using transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tetherInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    color: theme.text.tertiary,
    flex: 1,
  },
  taskCount: {
    fontSize: 14,
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
