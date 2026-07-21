import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, TextInput } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DuoButton from '../components/DuoButton';


export default function WorkoutDetailScreen({ route }: any) {
  const { plan } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [exercises, setExercises] = useState(plan.exercises);
  const [planTitle, setPlanTitle] = useState(plan.title);
  const [planDesc, setPlanDesc] = useState(plan.description);
  const isFirstRender = useRef(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function syncFromDb() {
      if (plan.id) {
        try {
          const row = await db.getFirstAsync<any>('SELECT exercises_json FROM saved_plans WHERE id = ?', [plan.id]);
          if (row && row.exercises_json) {
            const dbEx = JSON.parse(row.exercises_json);
            if (JSON.stringify(dbEx) !== JSON.stringify(exercises)) {
              setExercises(dbEx);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (isFocused) {
      syncFromDb();
    }
  }, [isFocused, plan.id, db]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (plan.id) {
        db.runAsync('UPDATE saved_plans SET exercises_json = ?, title = ?, description = ? WHERE id = ?', [
          JSON.stringify(exercises), 
          planTitle || 'Custom Plan', 
          planDesc || '', 
          plan.id
        ]).catch(console.error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [exercises, planTitle, planDesc, db, plan.id]);

  useEffect(() => {
    async function enrichExercises() {
      try {
        const ids = exercises.map((e: any) => e.id).filter(Boolean);
        if (ids.length === 0) return;
        
        // Only enrich if there are missing images/equipment
        const needsEnrichment = exercises.some((e: any) => !e.equipment || !e.images);
        if (!needsEnrichment) return;

        const placeholders = ids.map(() => '?').join(',');
        const fullData = await db.getAllAsync<any>(`SELECT id, equipment, images, secondary_muscles FROM exercises WHERE id IN (${placeholders})`, ...ids);
        
        const enriched = exercises.map((ex: any) => {
          const match = fullData.find(d => d.id === ex.id);
          return match && (!ex.equipment || !ex.images) ? { ...ex, equipment: match.equipment, images: match.images, secondaryMuscles: match.secondary_muscles } : ex;
        });
        setExercises(enriched);
      } catch (e) {
        console.error(e);
      }
    }
    enrichExercises();
  }, [exercises, db]);



  const updateSets = (idx: number, delta: number) => {
    const newEx = [...exercises];
    const currentSets = newEx[idx].sets !== undefined ? newEx[idx].sets : 3;
    newEx[idx].sets = Math.max(1, currentSets + delta);
    setExercises(newEx);
  };

  const updateRest = (idx: number, delta: number) => {
    const newEx = [...exercises];
    const currentRest = newEx[idx].rest_seconds !== undefined ? newEx[idx].rest_seconds : 90;
    newEx[idx].rest_seconds = Math.max(0, currentRest + delta);
    setExercises(newEx);
  };

  const removeExercise = (idx: number) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const newEx = [...exercises];
        newEx.splice(idx, 1);
        setExercises(newEx);
      }}
    ]);
  };

  const handleBack = async () => {
    if (exercises.length === 0 && planTitle === 'Custom Plan') {
      try {
        await db.runAsync('DELETE FROM saved_plans WHERE id = ?', [plan.id]);
      } catch(e) {}
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginRight: 16 }}>
            <MaterialIcons name="arrow-back" size={28} color={theme.colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <TextInput 
              style={[styles.title, { padding: 0, margin: 0, borderWidth: 0 }]} 
              value={planTitle}
              onChangeText={setPlanTitle}
              placeholder="Workout Name"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>
        <TextInput 
          style={[styles.desc, { padding: 0, margin: 0, borderWidth: 0 }]} 
          value={planDesc}
          onChangeText={setPlanDesc}
          placeholder="Workout Description"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
        />



        <Text style={styles.sectionTitle}>Exercises & Config</Text>
        {exercises.map((ex: any, idx: number) => {
          let imagePath = null;
          try {
            const parsed = typeof ex.images === 'string' ? JSON.parse(ex.images) : ex.images;
            if (parsed && parsed.length > 0) imagePath = parsed[0].replace(/\\/g, '/');
          } catch (e) {}
          const imageUrl = imagePath ? (imagePath.startsWith('http') ? imagePath : `${CONFIG.ASSET_BASE_URL}/${imagePath}`) : null;

          return (
            <View key={idx} style={styles.exCard}>
              <Pressable 
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                onPress={() => navigation.navigate('ExerciseDetail', { exercise: ex })}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.exImage} />
                ) : (
                  <View style={[styles.exImage, { alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcons name="fitness-center" size={24} color={theme.colors.secondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  {ex.equipment && <Text style={styles.exEquip}>{ex.equipment.toUpperCase()}</Text>}
                </View>
                <Pressable 
                  onPress={() => removeExercise(idx)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove exercise"
                >
                  <MaterialIcons name="close" size={20} color={theme.colors.secondary} />
                </Pressable>
              </Pressable>
              
              <View style={styles.controlsRow}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Sets</Text>
                  <View style={styles.adjuster}>
                    <Pressable style={styles.controlBtn} onPress={() => updateSets(idx, -1)} accessibilityLabel="Decrease sets"><Text style={styles.controlBtnText}>-</Text></Pressable>
                    <Text style={styles.controlValue}>{ex.sets !== undefined ? ex.sets : 3}</Text>
                    <Pressable style={styles.controlBtn} onPress={() => updateSets(idx, 1)} accessibilityLabel="Increase sets"><Text style={styles.controlBtnText}>+</Text></Pressable>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Rest (s)</Text>
                  <View style={styles.adjuster}>
                    <Pressable style={styles.controlBtn} onPress={() => updateRest(idx, -15)} accessibilityLabel="Decrease rest"><Text style={styles.controlBtnText}>-</Text></Pressable>
                    <Text style={styles.controlValue}>{ex.rest_seconds !== undefined ? ex.rest_seconds : 90}</Text>
                    <Pressable style={styles.controlBtn} onPress={() => updateRest(idx, 15)} accessibilityLabel="Increase rest"><Text style={styles.controlBtnText}>+</Text></Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <Pressable 
          style={styles.addExerciseBtn} 
          onPress={() => navigation.navigate('LibraryModal', { assignToPlanId: plan.id })}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.fabContainer}>
        <DuoButton 
          title="START WORKOUT" 
          color="primary" 
          onPress={() => {
            if (exercises.length === 0) {
              Alert.alert('No Exercises', 'Please add some exercises to this plan before starting.');
              return;
            }
            navigation.navigate('ActiveSession', { workout: { ...plan, exercises } });
          }} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, maxWidth: 600, alignSelf: 'center', width: '100%' },
  content: { padding: 24, paddingBottom: 100 },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 32, color: theme.colors.onBackground, marginBottom: 8, flex: 1 },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.colors.onSurfaceVariant, marginBottom: 32, lineHeight: 24 },
  sectionTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: theme.colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' },
  exCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.colors.borderSubtle },
  exName: { fontFamily: 'Unbounded_600SemiBold', fontSize: 16, color: theme.colors.onSurface, marginBottom: 4 },
  exEquip: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 16 },
  exImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12, backgroundColor: theme.colors.background },
  controlsRow: { flexDirection: 'row', gap: 16, borderTopWidth: 2, borderTopColor: theme.colors.borderSubtle, paddingTop: 16 },
  controlGroup: { flex: 1 },
  controlLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: theme.colors.onSurfaceVariant, marginBottom: 8 },
  adjuster: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 8, padding: 4, borderWidth: 2, borderColor: theme.colors.borderSubtle },
  controlBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 6 },
  controlBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 16, color: theme.colors.onSurface },
  controlValue: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, color: theme.colors.onSurface, minWidth: 40, textAlign: 'center' },
  fabContainer: { position: 'absolute', bottom: 32, left: 24, right: 24 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: theme.colors.surfaceMuted, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, borderStyle: 'dashed', marginTop: 16, marginBottom: 32 },
  addExerciseText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, color: theme.colors.onSurfaceVariant, marginLeft: 8 }
});
