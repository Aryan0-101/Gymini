import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Animated, Alert, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CONFIG } from '../config';
import DuoButton from '../components/DuoButton';

const { width } = Dimensions.get('window');

const DayCard = ({ dayShort, fullDay, isSelected, onPress }: any) => {
  const scale = useRef(new Animated.Value(isSelected ? 1.15 : 1)).current;
  
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.15 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
  }, [isSelected]);

  return (
    <Pressable 
      onPress={onPress} 
      style={{ alignItems: 'center', marginHorizontal: 8 }}
      accessibilityRole="button"
      accessibilityLabel={fullDay}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View style={[styles.dayCard, isSelected && styles.dayCardActive, { transform: [{ scale }] }]}>
        <Text style={[styles.dayCardText, isSelected && styles.dayCardTextActive]}>{dayShort}</Text>
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  
  const todayIdx = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIdx);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const rollingDays = React.useMemo(() => {
    const indices = [];
    for (let i = 0; i < 7; i++) {
      indices.push((todayIdx + i) % 7);
    }
    return indices;
  }, [todayIdx]);

  const selectedDayIndexRef = useRef(selectedDayIndex);
  useEffect(() => {
    selectedDayIndexRef.current = selectedDayIndex;
  }, [selectedDayIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Claim the gesture if it's distinctly a horizontal swipe
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentRollingIndex = rollingDays.indexOf(selectedDayIndexRef.current);
        if (gestureState.dx > 40) {
          // Swipe right -> previous day
          let nextIdx = currentRollingIndex - 1;
          if (nextIdx < 0) nextIdx = 6;
          setSelectedDayIndex(rollingDays[nextIdx]);
        } else if (gestureState.dx < -40) {
          // Swipe left -> next day
          let nextIdx = currentRollingIndex + 1;
          if (nextIdx > 6) nextIdx = 0;
          setSelectedDayIndex(rollingDays[nextIdx]);
        }
      }
    })
  ).current;

  const loadSchedule = async (dayIdx: number) => {
    try {
      const query = `
        SELECT p.*, s.is_completed 
        FROM scheduled_workouts s 
        JOIN saved_plans p ON s.plan_id = p.id 
        WHERE s.day_of_week = ? 
        ORDER BY s.id DESC LIMIT 1
      `;
      const result = await db.getFirstAsync<any>(query, [dayIdx]);
      if (result && dayIdx !== todayIdx) {
        result.is_completed = 0;
      }
      setSelectedPlan(result);
    } catch (e) {
      console.error("Failed to load schedule", e);
    }
  };

  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  const loadRecentWorkouts = async () => {
    try {
      const res = await db.getAllAsync<any>('SELECT p.title, s.day_of_week FROM scheduled_workouts s JOIN saved_plans p ON s.plan_id = p.id WHERE s.is_completed = 1 OR s.is_completed = "1" ORDER BY s.id DESC LIMIT 3');
      setRecentWorkouts(res);
    } catch(e) {
      console.error("Error loading recents:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSchedule(selectedDayIndex);
      loadRecentWorkouts();
    });
    
    // Initial load
    loadSchedule(selectedDayIndex);
    loadRecentWorkouts();

    return unsubscribe;
  }, [navigation, selectedDayIndex, db]);

  const [glasses, setGlasses] = useState(4);
  const maxGlasses = 8;
  const waterHeightAnim = useRef(new Animated.Value(0.5)).current;

  const handleWaterClick = () => {
    let nextGlasses = glasses + 1;
    if (nextGlasses > maxGlasses) nextGlasses = 0;
    setGlasses(nextGlasses);
    Animated.spring(waterHeightAnim, {
      toValue: nextGlasses / maxGlasses,
      friction: 8,
      tension: 50,
      useNativeDriver: true
    }).start();
  };

  useEffect(() => {
    if (selectedPlan?.is_completed) {
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      flipAnim.setValue(0);
    }
  }, [selectedPlan?.is_completed]);

  const makeRestDay = async () => {
    try {
      let restPlan = await db.getFirstAsync<any>('SELECT * FROM saved_plans WHERE title = "Rest Day"');
      if (!restPlan) {
        const result = await db.runAsync('INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)', ["Rest Day", "Take a break and recover.", "[]"]);
        restPlan = { id: result.lastInsertRowId };
      }
      await db.runAsync('INSERT INTO scheduled_workouts (plan_id, day_of_week) VALUES (?, ?)', [restPlan.id, selectedDayIndex]);
      loadSchedule(selectedDayIndex);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWaterUndo = () => {
    if (glasses > 0) {
      const nextGlasses = glasses - 1;
      setGlasses(nextGlasses);
      Animated.spring(waterHeightAnim, {
        toValue: nextGlasses / maxGlasses,
        friction: 8,
        tension: 50,
        useNativeDriver: true
      }).start();
    }
  };

  const handlePlusPress = () => {
    Alert.alert("Assign", "Add to this day", [
      { text: "Add Workout", onPress: () => navigation.navigate('Library', { assignToDay: selectedDayIndex }) },
      { text: "Add Plan", onPress: () => navigation.navigate('SavedPlans', { assignToDay: selectedDayIndex }) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const removePlan = async () => {
    try {
      await db.runAsync('DELETE FROM scheduled_workouts WHERE day_of_week = ?', [selectedDayIndex]);
      loadSchedule(selectedDayIndex);
    } catch (e) {
      console.error(e);
    }
  };

  const undoCompletion = async () => {
    try {
      await db.runAsync('UPDATE scheduled_workouts SET is_completed = 0 WHERE day_of_week = ?', [selectedDayIndex]);
      loadSchedule(selectedDayIndex);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLongPressFront = () => {
    Alert.alert("Remove Assignment", `Do you want to clear the schedule for ${dayNames[selectedDayIndex]}?`, [
      { text: "Remove", onPress: removePlan, style: 'destructive' },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleLongPressBack = () => {
    Alert.alert("Modify Assignment", `What would you like to do for ${dayNames[selectedDayIndex]}?`, [
      { text: "Undo Completion", onPress: undoCompletion },
      { text: "Remove Workout", onPress: removePlan, style: 'destructive' },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  let activeWorkoutImage = null;
  if (selectedPlan && selectedPlan.exercises_json) {
    try {
      const exArray = JSON.parse(selectedPlan.exercises_json);
      if (exArray.length > 0) {
        const firstEx = exArray[0];
        let imgArr = [];
        if (typeof firstEx.images === 'string') imgArr = JSON.parse(firstEx.images);
        else if (Array.isArray(firstEx.images)) imgArr = firstEx.images;
        if (imgArr.length > 0) activeWorkoutImage = imgArr[0].replace(/\\/g, '/');
      }
    } catch (e) {}
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 64), paddingBottom: Math.max(insets.bottom + 80, 120) }]}>
        
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, Athlete</Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}>
            {rollingDays.map((dayIdx) => (
              <DayCard 
                key={dayIdx} 
                dayShort={dayShorts[dayIdx]} 
                fullDay={dayNames[dayIdx]} 
                isSelected={selectedDayIndex === dayIdx} 
                onPress={() => setSelectedDayIndex(dayIdx)} 
              />
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionLabel}>{selectedDayIndex === todayIdx ? "TODAY'S FOCUS" : `${dayNames[selectedDayIndex].toUpperCase()}'S FOCUS`}</Text>
        
        <View 
          style={{ marginBottom: 32 }}
          {...panResponder.panHandlers}
        >
          {selectedPlan ? (
            <>
              {/* Front Card */}
              {/* Front Card */}
              <Animated.View 
                pointerEvents={selectedPlan?.is_completed ? "none" : "auto"}
                style={[styles.focusCard, { transform: [{ rotateY: frontInterpolate }], backfaceVisibility: 'hidden', position: selectedPlan?.is_completed ? 'absolute' : 'relative', top: 0, width: '100%', marginBottom: 0 }]}
              >
                
                <View style={{ position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(244, 216, 197, 0.5)' }} pointerEvents="none" />
                
                <Pressable onLongPress={handleLongPressFront} style={{ zIndex: 1 }}>
                  <View style={styles.focusCardTop}>
                    <View>
                      <Text style={styles.focusDate}>{dayNames[selectedDayIndex]}</Text>
                      <Text style={styles.focusTitle}>{selectedPlan.title}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.focusTags}>
                    <View style={styles.tagPrimary}><Text style={styles.tagPrimaryText}>{selectedPlan.title === 'Rest Day' ? 'Recovery' : 'Strength'}</Text></View>
                    <View style={styles.tagSecondary}><Text style={styles.tagSecondaryText}>{selectedPlan.title === 'Rest Day' ? 'Rest' : 'Scheduled'}</Text></View>
                  </View>
                </Pressable>

                {!selectedPlan.is_completed && selectedPlan.title !== 'Rest Day' && (
                  <View style={{ marginTop: 16 }}>
                    <DuoButton 
                      title="START SESSION" 
                      color="primary" 
                      onPress={() => navigation.navigate('WorkoutDetail', { plan: { ...selectedPlan, exercises: JSON.parse(selectedPlan.exercises_json) } })} 
                    />
                  </View>
                )}

                {!selectedPlan.is_completed && (
                  <Pressable style={styles.plusBtn} onPress={handlePlusPress} accessibilityRole="button" accessibilityLabel="Add workout or plan">
                    <MaterialIcons name="add" size={24} color={theme.colors.primary} />
                  </Pressable>
                )}
              </Animated.View>

              {/* Back Card */}
              <Animated.View 
                pointerEvents={selectedPlan?.is_completed ? "auto" : "none"}
                style={[styles.focusCard, { padding: 0, backgroundColor: theme.colors.successGraph, borderColor: theme.colors.successGraph, transform: [{ rotateY: backInterpolate }], backfaceVisibility: 'hidden', position: selectedPlan?.is_completed ? 'relative' : 'absolute', top: 0, width: '100%', marginBottom: 0 }]}
              >
                <Pressable onLongPress={handleLongPressBack} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 24 }}>
                  <MaterialIcons name="check-circle" size={64} color="#fff" style={{ marginBottom: 16 }} />
                  <Text style={[styles.focusTitle, { color: '#fff', textAlign: 'center' }]}>Workout Complete!</Text>
                  <Text style={[styles.focusDate, { color: '#fff', opacity: 0.9, textAlign: 'center', marginTop: 8 }]}>Great job crushing {selectedPlan?.title} today.</Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <View style={[styles.focusCard, { alignItems: 'center', paddingVertical: 32 }]}>
               <MaterialIcons name="event-available" size={48} color={theme.colors.borderSubtle} style={{ marginBottom: 16 }} />
               <Text style={styles.emptyTitle}>Nothing Scheduled</Text>
               <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
                 <DuoButton title="Add a Workout" color="secondary" onPress={() => navigation.navigate('Library', { assignToDay: selectedDayIndex })} />
                 <DuoButton title="Add a Plan" color="secondary" onPress={() => navigation.navigate('SavedPlans', { assignToDay: selectedDayIndex })} />
                 <DuoButton title="Make it a Rest Day" color="surface" onPress={makeRestDay} />
               </View>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
          {/* Hydration Card */}
          <View style={[styles.hydrationCol, { flex: 1 }]}>
            <Text style={styles.sectionLabel}>DAILY HYDRATION</Text>
            <Pressable style={[styles.hydrationCard, { flex: 1, overflow: 'hidden' }]} onPress={handleWaterClick} onLongPress={handleWaterUndo} accessibilityRole="button" accessibilityLabel={`Hydration: ${glasses} out of ${maxGlasses} glasses`}>
              <View style={styles.glassContainer}>
                <Animated.View style={[styles.waterFill, { height: 128, bottom: 0, position: 'absolute', width: '100%', transform: [{ translateY: waterHeightAnim.interpolate({ inputRange: [0, 1], outputRange: [128, 0] }) }] }]} />
                <View style={styles.glassShine} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.hydrationCount, { color: theme.colors.primary }]}>
                  {glasses}
                </Text>
                <Text style={[styles.hydrationUnit, { color: theme.colors.secondary }]}>
                  GLASSES
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, opacity: 0.6, marginTop: 12, letterSpacing: 0.5, color: theme.colors.onSurfaceVariant }}>
                  TAP TO ADD • HOLD TO UNDO
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Resume Session Card */}
          <View style={[styles.hydrationCol, { flex: 1 }]}>
             <Text style={styles.sectionLabel}>ACTIVE SESSION</Text>
             <Pressable 
               style={[styles.hydrationCard, { flex: 1, backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderSubtle, justifyContent: 'center', padding: 16, gap: 12 }]}
               onPress={() => {
                  if (selectedPlan && !selectedPlan.is_completed && selectedPlan.title !== 'Rest Day') {
                    navigation.navigate('WorkoutDetail', { plan: { ...selectedPlan, exercises: JSON.parse(selectedPlan.exercises_json) } });
                  } else {
                    Alert.alert("No Active Session", "You don't have an ongoing session for today.");
                  }
               }}
             >
               {selectedPlan && !selectedPlan.is_completed && selectedPlan.title !== 'Rest Day' ? (
                 <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', width: '100%' }}>
                    {activeWorkoutImage ? (
                      <Image source={{ uri: `${CONFIG.ASSET_BASE_URL}/${activeWorkoutImage}` }} style={{ width: 88, height: 88, borderRadius: 44, marginBottom: 12, backgroundColor: theme.colors.surfaceMuted, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                    ) : (
                      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                        <MaterialIcons name="fitness-center" size={40} color={theme.colors.accentFocus} />
                      </View>
                    )}
                    <Text style={[styles.hydrationCount, { color: '#fff', fontSize: 16, textAlign: 'center' }]} numberOfLines={2}>
                      {selectedPlan.title}
                    </Text>
                    <Text style={[styles.hydrationUnit, { marginTop: 4, color: theme.colors.accentFocus }]}>RESUME SESSION</Text>
                 </View>
               ) : (
                 <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', width: '100%' }}>
                    <MaterialIcons name="play-circle-outline" size={56} color={'rgba(255,255,255,0.15)'} style={{ marginBottom: 16 }} />
                    <Text style={[styles.hydrationCount, { color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center' }]}>
                      None
                    </Text>
                    <Text style={[styles.hydrationUnit, { marginTop: 4, color: 'rgba(255,255,255,0.3)' }]}>NO ACTIVE SESSION</Text>
                 </View>
               )}
             </Pressable>
          </View>
        </View>

        <View style={styles.recentCol}>
            <Text style={styles.sectionLabel}>RECENT WORKOUTS</Text>
            <View style={{ gap: 16 }}>
              {recentWorkouts.map((w, i) => (
                <View key={i} style={styles.recentWorkoutCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle}>{w.title}</Text>
                    <Text style={styles.recentSub}>{dayNames[w.day_of_week] || 'Recent'} • Workout Complete</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.secondary} style={{ opacity: 0.4 }} />
                </View>
              ))}
              {recentWorkouts.length === 0 && (
                <Text style={{ fontFamily: 'Inter_400Regular', color: theme.colors.secondary, fontSize: 12 }}>No recent activity.</Text>
              )}
            </View>
          </View>

      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('Builder')} accessibilityRole="button" accessibilityLabel="Ask AI">
        <MaterialIcons name="smart-toy" size={20} color={theme.colors.onPrimary} />
        <Text style={styles.fabText}>Ask AI</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.marginPage, maxWidth: 800, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 16 },
  greeting: { fontFamily: 'Unbounded_700Bold', fontSize: 40, color: theme.colors.primary, lineHeight: 48, letterSpacing: -0.5 },
  
  dayCard: { width: 44, height: 56, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  dayCardActive: { backgroundColor: theme.colors.successGraph, borderColor: '#109648' },
  dayCardText: { fontFamily: 'Unbounded_700Bold', fontSize: 16, color: theme.colors.onSurfaceVariant },
  dayCardTextActive: { color: '#000000' },

  sectionLabel: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.secondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  focusCard: { backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.colors.borderSubtle, borderRadius: 24, padding: 24, marginBottom: 32, overflow: 'hidden' },
  focusCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, zIndex: 10 },
  focusDate: { fontFamily: theme.typography.labelMd.fontFamily, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  focusTitle: { fontFamily: 'Unbounded_700Bold', fontSize: 24, color: theme.colors.onSurface },
  focusTags: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tagPrimary: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  tagPrimaryText: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.primary },
  tagSecondary: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  tagSecondaryText: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.onSurface },
  
  plusBtn: { position: 'absolute', top: 16, right: 16, zIndex: 20, backgroundColor: theme.colors.surfaceMuted, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle },
  emptyTitle: { fontFamily: 'Unbounded_700Bold', fontSize: 20, color: theme.colors.onSurface },
  
  dashboardBottomRow: { flexDirection: 'column', gap: 32 },
  hydrationCol: { gap: 12 },
  recentCol: { gap: 12 },
  hydrationCard: { backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.colors.borderSubtle, borderRadius: 24, padding: 24, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
  glassContainer: { width: 96, height: 128, borderWidth: 4, borderColor: theme.colors.borderHighlight, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTopLeftRadius: 2, borderTopRightRadius: 2, overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  waterFill: { width: '100%', backgroundColor: theme.colors.secondary, opacity: 0.9 },
  glassShine: { position: 'absolute', top: 8, left: 8, width: 4, height: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  hydrationCount: { fontFamily: 'Unbounded_700Bold', fontSize: 24, color: theme.colors.onSurface },
  hydrationUnit: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase' },

  recentWorkoutCard: { backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { fontFamily: 'Unbounded_700Bold', fontSize: 15, color: theme.colors.onSurface },
  recentSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  fab: { position: 'absolute', bottom: 100, right: 24, backgroundColor: theme.colors.successGraph, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 32, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderBottomWidth: 6, borderColor: '#109648' },
  fabText: { color: '#000000', fontFamily: theme.typography.labelMd.fontFamily, fontSize: 16 }
});

// End of file
