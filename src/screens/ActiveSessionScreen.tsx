import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const stheme = {
  colors: {
    ink: "#26211D",
    sand: "#F2E9D8",
    linen: "#FAF5EA",
    ember: "#E2725A",
    mochaGhost: "#8b7355",
    inkLighter: "#3A332E",
    inkLightest: "#4F4640",
    successGraph: "#38A169"
  }
};

export default function ActiveSessionScreen({ route }: any) {
  const { workout } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const currentEx = workout.exercises[currentExIdx];
  const noWeightEquipments = ['body only', 'none', 'band', 'bands', 'cable', 'exercise ball', 'foam ball', 'foam roll', 'other', 'medicine ball'];
  const needsWeight = Boolean(currentEx?.equipment && !noWeightEquipments.includes(currentEx.equipment.toLowerCase()));

  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [setLogs, setSetLogs] = useState<Record<number, {weight: string, reps: string}>>({});

  // Local state for inputs of the active set
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [currentSetsCount, setCurrentSetsCount] = useState(currentEx?.sets || 0);

  const [sessionTimer, setSessionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setSessionTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    // Reset state when exercise changes
    setActiveSetIdx(0);
    setCompletedSets([]);
    setSetLogs({});
    setWeightInput("");
    
    let defaultReps = "";
    if (currentEx?.reps) {
      const match = String(currentEx.reps).match(/\d+/);
      if (match) defaultReps = match[0];
    }
    setRepsInput(defaultReps);
    
    setCurrentSetsCount(currentEx?.sets || 0);
  }, [currentExIdx, currentEx]);

  const handleFinish = async () => {
    try {
      let finalPlanId = workout.id;
      
      // If this was an ad-hoc in-memory workout (no ID), save it to the DB first
      if (!finalPlanId) {
        const result = await db.runAsync('INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)', [workout.title || 'Quick Session', workout.description || '', JSON.stringify(workout.exercises)]);
        finalPlanId = result.lastInsertRowId;
      }

      if (finalPlanId) {
        const result = await db.runAsync('UPDATE scheduled_workouts SET is_completed = 1 WHERE plan_id = ? AND is_completed = 0', [finalPlanId]);
        if (result.changes === 0) {
          // Log ad-hoc workouts to history (-1) instead of the current day (0-6) so it doesn't hijack the dashboard
          await db.runAsync('INSERT INTO scheduled_workouts (plan_id, day_of_week, is_completed) VALUES (?, -1, 1)', [finalPlanId]);
        }
      }
      navigation.replace('WorkoutComplete');
    } catch (e) {
      console.error("Finish error", e);
      navigation.replace('WorkoutComplete');
    }
  };

  const handleCompleteSet = () => {
    setSetLogs(prev => ({ ...prev, [activeSetIdx]: { weight: weightInput, reps: repsInput } }));
    setCompletedSets(prev => [...prev, activeSetIdx]);
    
    if (activeSetIdx < currentSetsCount - 1) {
      setActiveSetIdx(activeSetIdx + 1);
    } else {
      // Last set completed! Move to next exercise if available, or finish
      if (currentExIdx < workout.exercises.length - 1) {
        setCurrentExIdx(prev => prev + 1);
      } else {
        handleFinish();
      }
    }
  };

  const handleRest = () => {
    const nextEx = currentExIdx < workout.exercises.length - 1 ? workout.exercises[currentExIdx + 1] : null;
    navigation.navigate('RestTimer', { 
      restSeconds: currentEx.rest_seconds || 90,
      nextExerciseName: nextEx ? nextEx.name : "Workout Complete",
      nextExerciseSetsInfo: nextEx ? `${nextEx.sets} sets` : "Great job!"
    });
  };

  // Extract image path safely
  let imageUrls: string[] = [];
  try {
    const parsed = typeof currentEx.images === 'string' ? JSON.parse(currentEx.images) : currentEx.images;
    if (parsed && Array.isArray(parsed)) {
      imageUrls = parsed.map((p: string) => `${CONFIG.ASSET_BASE_URL}/${p.replace(/\\/g, '/')}`);
    }
  } catch (e) {}

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={stheme.colors.sand} style={{ opacity: 0.7 }} />
          </Pressable>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{currentEx.name}</Text>
            <Text style={styles.headerSub}>Working Sets • {currentExIdx + 1} of {workout.exercises.length}</Text>
          </View>
        </View>
        
        {/* Rest Timer Load Bar Style */}
        <Pressable style={styles.timerBadge} onPress={() => setIsTimerRunning(!isTimerRunning)}>
          <View style={{ width: 32, height: 32, position: 'relative' }}>
            <Svg width="32" height="32" viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx="50" cy="50" r="45" fill="none" stroke={stheme.colors.inkLightest} strokeWidth="8" />
              {isTimerRunning && (
                <Circle cx="50" cy="50" r="45" fill="none" stroke={stheme.colors.ember} strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (sessionTimer % 60) * (283 / 60)} strokeLinecap="round" />
              )}
            </Svg>
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={isTimerRunning ? "timer" : "pause"} size={16} color={isTimerRunning ? stheme.colors.ember : stheme.colors.sand} />
            </View>
          </View>
          <Text style={styles.timerText}>
            {Math.floor(sessionTimer / 60).toString().padStart(2, '0')}:
            {(sessionTimer % 60).toString().padStart(2, '0')}
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {imageUrls.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            {imageUrls.slice(0, 2).map((url, idx) => (
              <View key={idx} style={[styles.heroImageContainer, { flex: 1, marginBottom: 0 }]}>
                <Image source={{ uri: url }} style={styles.heroImage} />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTag}>FORM {idx + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sets Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.8 }]}>SET</Text>
          {needsWeight && <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>WEIGHT</Text>}
          <Text style={[styles.th, { flex: needsWeight ? 1.5 : 1, textAlign: needsWeight ? 'right' : 'center', paddingRight: needsWeight ? 32 : 0 }]}>REPS</Text>
        </View>

        {/* Sets List */}
        <View style={{ gap: 16 }}>
          {Array.from({ length: currentSetsCount }).map((_, i) => {
            const isCompleted = completedSets.includes(i);
            const isActive = i === activeSetIdx;
            const isUpcoming = i > activeSetIdx;

            if (isCompleted) {
              return (
                <View key={i} style={styles.completedSetRow}>
                  <View style={styles.completedSetBadge}>
                    <Text style={styles.completedSetNum}>{i + 1}</Text>
                  </View>
                  <View style={styles.setDetailsGrid}>
                    {needsWeight && (
                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <Text style={styles.targetValLg}>{setLogs[i]?.weight || '--'}</Text>
                        <Text style={styles.targetValSm}>kgs</Text>
                      </View>
                    )}
                    <View style={{ flex: needsWeight ? 1.5 : 1, alignItems: needsWeight ? 'flex-end' : 'center', paddingRight: needsWeight ? 24 : 0 }}>
                      <Text style={styles.targetValLg}>{setLogs[i]?.reps || '--'}</Text>
                      <Text style={styles.targetValSm}>reps</Text>
                    </View>
                  </View>
                  <View style={{ position: 'absolute', right: 16 }}>
                    <MaterialIcons name="check-circle" size={24} color={stheme.colors.successGraph} />
                  </View>
                </View>
              );
            }

            if (isActive) {
              return (
                <View key={i} style={styles.activeSetRow}>
                  <View style={styles.activeSetBadge}>
                    <Text style={styles.activeSetNum}>{i + 1}</Text>
                  </View>
                  <View style={styles.setDetailsGrid}>
                    {needsWeight && (
                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <View style={styles.inputWrapper}>
                          <TextInput 
                            style={styles.weightRepInput} 
                            placeholder="0" 
                            placeholderTextColor="rgba(242, 233, 216, 0.3)"
                            keyboardType="numeric"
                            value={weightInput}
                            onChangeText={setWeightInput}
                          />
                          <Text style={styles.inputLabelActive}>KGS</Text>
                        </View>
                      </View>
                    )}
                    <View style={{ flex: needsWeight ? 1.5 : 1, alignItems: needsWeight ? 'flex-end' : 'center', paddingRight: needsWeight ? 24 : 0 }}>
                      <View style={styles.inputWrapper}>
                        <TextInput 
                          style={styles.weightRepInput} 
                          placeholder="0" 
                          placeholderTextColor="rgba(242, 233, 216, 0.3)"
                          keyboardType="numeric"
                          value={repsInput}
                          onChangeText={setRepsInput}
                        />
                        <Text style={styles.inputLabelActive}>REPS</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }

            // Upcoming
            return (
              <View key={i} style={styles.upcomingSetRow}>
                <View style={styles.upcomingSetBadge}>
                  <Text style={styles.upcomingSetNum}>{i + 1}</Text>
                </View>
                <View style={[styles.setDetailsGrid, { opacity: 0.6 }]}>
                  {needsWeight && (
                    <View style={{ flex: 1.2, alignItems: 'center' }}>
                      <Text style={styles.targetValUpcomingLg}>--</Text>
                      <Text style={styles.targetValSm}>kgs</Text>
                    </View>
                  )}
                  <View style={{ flex: needsWeight ? 1.5 : 1, alignItems: needsWeight ? 'flex-end' : 'center', paddingRight: needsWeight ? 24 : 0 }}>
                    <Text style={styles.targetValUpcomingLg}>{currentEx.reps || '-'}</Text>
                    <Text style={styles.targetValSm}>reps</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 }}>
          <Pressable onPress={() => setCurrentSetsCount(Math.max(1, currentSetsCount - 1))} style={{ paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: stheme.colors.inkLightest, borderRadius: 8 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', color: stheme.colors.sand, fontSize: 12 }}>- REMOVE SET</Text>
          </Pressable>
          <Pressable onPress={() => setCurrentSetsCount(currentSetsCount + 1)} style={{ paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: stheme.colors.inkLightest, borderRadius: 8 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_500Medium', color: stheme.colors.sand, fontSize: 12 }}>+ ADD SET</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <Pressable style={styles.restFab} onPress={handleRest}>
          <MaterialIcons name="coffee" size={24} color="rgba(242, 233, 216, 0.8)" />
          <Text style={styles.restFabText}>REST</Text>
        </Pressable>
        <Pressable style={styles.completeFab} onPress={handleCompleteSet}>
          <MaterialIcons name="check" size={40} color="#fff" />
        </Pressable>
      </View>

      {/* Up Next Footer */}
      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={styles.footerTitle}>UP NEXT</Text>
          <Text style={styles.footerSub}>{workout.exercises.length - currentExIdx - 1} Exercises Left</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, gap: 16 }}>
          {workout.exercises.slice(currentExIdx + 1).map((ex: any, idx: number) => {
            let thumbUrl = null;
            try {
              const parsed = typeof ex.images === 'string' ? JSON.parse(ex.images) : ex.images;
              if (parsed && parsed.length > 0) thumbUrl = `${CONFIG.ASSET_BASE_URL}/${parsed[0].replace(/\\/g, '/')}`;
            } catch (e) {}

            return (
              <View key={idx} style={styles.upcomingThumbnailRow}>
                <View style={styles.thumbPlaceholder}>
                  {thumbUrl ? (
                    <Image source={{ uri: thumbUrl }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons name="fitness-center" size={20} color={stheme.colors.inkLightest} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.thumbTitle} numberOfLines={2}>{ex.resolvedName}</Text>
                </View>
              </View>
            );
          })}
          {/* Add Workout Button Thumbnail */}
          <Pressable style={styles.addExerciseThumb} onPress={() => navigation.navigate('Library', { assignToPlanId: workout.id })}>
            <MaterialIcons name="add" size={24} color="rgba(242, 233, 216, 0.6)" />
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: stheme.colors.ink },
  header: { 
    paddingTop: 60, paddingHorizontal: 24, height: 120, 
    backgroundColor: 'rgba(38, 33, 29, 0.9)', borderBottomWidth: 1, borderColor: stheme.colors.inkLighter, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 
  },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: stheme.colors.inkLighter, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Unbounded_600SemiBold', fontSize: 20, color: stheme.colors.linen },
  headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)', marginTop: 4, letterSpacing: 1.5 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: stheme.colors.inkLighter, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, borderWidth: 1, borderColor: stheme.colors.inkLightest },
  timerText: { fontFamily: 'IBM Plex Mono', fontSize: 14, color: stheme.colors.linen, width: 48, textAlign: 'center' },
  
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 200 },
  heroImageContainer: { height: 200, width: '100%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: stheme.colors.inkLightest, marginBottom: 32, backgroundColor: stheme.colors.inkLighter },
  heroImage: { width: '100%', height: '100%', opacity: 0.8 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  heroTag: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: stheme.colors.ember, letterSpacing: 2 },
  
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: stheme.colors.inkLighter, paddingBottom: 8, marginBottom: 16, paddingHorizontal: 16 },
  th: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)', letterSpacing: 1 },
  
  // Set Rows
  setDetailsGrid: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 24 },
  prevCol: { flex: 1, justifyContent: 'center' },
  prevValText: { fontFamily: 'IBM Plex Mono', fontSize: 14, color: 'rgba(242, 233, 216, 0.5)' },
  prevValSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(242, 233, 216, 0.5)' },
  targetValSm: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)', marginTop: 4 },

  completedSetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: stheme.colors.inkLighter, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: stheme.colors.inkLightest, opacity: 0.8 },
  completedSetBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: stheme.colors.inkLightest, alignItems: 'center', justifyContent: 'center' },
  completedSetNum: { fontFamily: 'Unbounded_500Medium', fontSize: 18, color: stheme.colors.linen },
  targetColCompleted: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 32, paddingRight: 16 },
  targetValLg: { fontFamily: 'IBM Plex Mono', fontSize: 20, color: stheme.colors.linen },

  activeSetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: stheme.colors.inkLighter, borderRadius: 12, padding: 24, borderLeftWidth: 4, borderLeftColor: stheme.colors.ember, borderWidth: 1, borderColor: stheme.colors.inkLightest, transform: [{ scale: 1.02 }], shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  activeSetBadge: { width: 56, height: 56, borderRadius: 12, backgroundColor: stheme.colors.ink, borderWidth: 1, borderColor: 'rgba(226, 114, 90, 0.5)', alignItems: 'center', justifyContent: 'center' },
  activeSetNum: { fontFamily: 'Unbounded_500Medium', fontSize: 20, color: stheme.colors.ember },
  targetColActive: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 24, paddingRight: 8 },
  inputWrapper: { alignItems: 'center' },
  weightRepInput: { fontFamily: 'IBM Plex Mono', fontSize: 32, color: stheme.colors.linen, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: stheme.colors.inkLightest, minWidth: 64, paddingBottom: 4 },
  inputLabelActive: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: stheme.colors.ember, marginTop: 8, letterSpacing: 1 },
  inputDivider: { width: 1, height: 40, backgroundColor: stheme.colors.inkLightest },
  activeIndicator: { width: 32, height: 1, backgroundColor: stheme.colors.ember, marginTop: 12 },

  upcomingSetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(38, 33, 29, 0.5)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: stheme.colors.inkLightest, borderStyle: 'dashed' },
  upcomingSetBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: stheme.colors.inkLightest, alignItems: 'center', justifyContent: 'center' },
  upcomingSetNum: { fontFamily: 'Unbounded_500Medium', fontSize: 18, color: 'rgba(242, 233, 216, 0.6)' },
  targetColUpcoming: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 32, paddingRight: 16 },
  targetValUpcomingLg: { fontFamily: 'IBM Plex Mono', fontSize: 20, color: 'rgba(242, 233, 216, 0.8)' },

  // FABs
  fabContainer: { position: 'absolute', bottom: 130, right: 24, zIndex: 50, alignItems: 'center' },
  restFab: { width: 56, height: 56, marginBottom: 16, backgroundColor: stheme.colors.inkLighter, borderWidth: 1, borderColor: stheme.colors.inkLightest, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  restFabText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: 'rgba(242, 233, 216, 0.8)', letterSpacing: 0.5, marginTop: 2 },
  completeFab: { width: 80, height: 80, backgroundColor: stheme.colors.ember, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: stheme.colors.ember, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 10 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 112, backgroundColor: stheme.colors.inkLighter, borderTopWidth: 1, borderColor: stheme.colors.inkLightest, zIndex: 40, paddingHorizontal: 24, paddingVertical: 12 },
  footerTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)', letterSpacing: 1 },
  footerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)' },
  upcomingThumbnailRow: { width: 192, height: 56, backgroundColor: stheme.colors.ink, borderRadius: 8, borderWidth: 1, borderColor: stheme.colors.inkLightest, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbPlaceholder: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbTitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: stheme.colors.linen, maxWidth: 100 },
  thumbSub: { fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'rgba(242, 233, 216, 0.6)' },
  addExerciseThumb: { width: 56, height: 56, backgroundColor: 'rgba(38, 33, 29, 0.5)', borderRadius: 8, borderWidth: 1, borderColor: stheme.colors.inkLightest, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }
});
