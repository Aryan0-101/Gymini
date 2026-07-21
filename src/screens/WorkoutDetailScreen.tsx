import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function WorkoutDetailScreen({ route }: any) {
  const { plan } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [exercises, setExercises] = useState(plan.exercises);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (plan.id) {
        const payload = exercises.map((e: any) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest_seconds: e.rest_seconds
        }));
        db.runAsync('UPDATE saved_plans SET exercises_json = ? WHERE id = ?', [JSON.stringify(payload), plan.id]).catch(console.error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [exercises, db, plan.id]);

  useEffect(() => {
    async function enrichExercises() {
      try {
        const ids = exercises.map((e: any) => e.id).filter(Boolean);
        if (ids.length === 0) return;
        const placeholders = ids.map(() => '?').join(',');
        const fullData = await db.getAllAsync<any>(`SELECT id, equipment, images FROM exercises WHERE id IN (${placeholders})`, ...ids);
        
        const enriched = exercises.map((ex: any) => {
          const match = fullData.find(d => d.id === ex.id);
          return match ? { ...ex, equipment: match.equipment, images: match.images } : ex;
        });
        setExercises(enriched);
      } catch (e) {
        console.error(e);
      }
    }
    enrichExercises();
  }, [plan.exercises, db]);



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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginRight: 16 }}>
            <MaterialIcons name="arrow-back" size={28} color={theme.colors.onPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{plan.title}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{plan.description}</Text>



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
      </ScrollView>

      <Pressable 
        style={styles.fab} 
        onPress={() => navigation.navigate('ActiveSession', { workout: { ...plan, exercises } })}
      >
        <Text style={styles.fabText}>Start Workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary, maxWidth: 600, alignSelf: 'center', width: '100%' },
  content: { padding: 24, paddingBottom: 100 },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 32, color: theme.colors.onPrimary, marginBottom: 8, flex: 1 },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.colors.secondary, marginBottom: 32, lineHeight: 24 },
  sectionTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: theme.colors.secondary, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' },
  exCard: { backgroundColor: theme.colors.surfaceMuted, borderRadius: 8, padding: 16, marginBottom: 12 },
  exName: { fontFamily: 'Unbounded_600SemiBold', fontSize: 16, color: theme.colors.primary, marginBottom: 4 },
  exEquip: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.secondary, textTransform: 'uppercase', marginBottom: 16 },
  exImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: theme.colors.background },
  controlsRow: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(38,33,29,0.1)', paddingTop: 16 },
  controlGroup: { flex: 1 },
  controlLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: theme.colors.secondary, marginBottom: 8 },
  adjuster: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(38,33,29,0.05)', borderRadius: 4, padding: 4 },
  controlBtn: { padding: 8, backgroundColor: 'rgba(38,33,29,0.05)', borderRadius: 4 },
  controlBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 16, color: theme.colors.primary },
  controlValue: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, color: theme.colors.primary, minWidth: 40, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 32, left: 24, right: 24, backgroundColor: theme.colors.accentFocus, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  fabText: { fontFamily: 'Unbounded_700Bold', fontSize: 16, color: theme.colors.primary }
});
