import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import { MaterialIcons } from '@expo/vector-icons';


export default function WorkoutDetailScreen({ route }: any) {
  const { plan } = route.params;
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();

  const [exercises, setExercises] = useState(plan.exercises);

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{plan.title}</Text>
        <Text style={styles.desc}>{plan.description}</Text>



        <Text style={styles.sectionTitle}>Exercises & Config</Text>
        {exercises.map((ex: any, idx: number) => {
          let imagePath = null;
          try {
            const parsed = typeof ex.images === 'string' ? JSON.parse(ex.images) : ex.images;
            if (parsed && parsed.length > 0) imagePath = parsed[0].replace(/\\/g, '/');
          } catch (e) {}
          const imageUrl = imagePath ? `${CONFIG.ASSET_BASE_URL}/${imagePath}` : null;

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
                  {ex.equipment && <Text style={styles.exSub}>{ex.equipment.toUpperCase()}</Text>}
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.secondary} style={{ opacity: 0.5 }} />
              </Pressable>
              
              <View style={styles.controlsRow}>
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Sets</Text>
                  <View style={styles.adjuster}>
                    <Pressable style={styles.adjBtn} onPress={() => updateSets(idx, -1)}><Text style={styles.adjText}>-</Text></Pressable>
                    <Text style={styles.adjVal}>{ex.sets !== undefined ? ex.sets : 3}</Text>
                    <Pressable style={styles.adjBtn} onPress={() => updateSets(idx, 1)}><Text style={styles.adjText}>+</Text></Pressable>
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Rest (s)</Text>
                  <View style={styles.adjuster}>
                    <Pressable style={styles.adjBtn} onPress={() => updateRest(idx, -15)}><Text style={styles.adjText}>-</Text></Pressable>
                    <Text style={styles.adjVal}>{ex.rest_seconds !== undefined ? ex.rest_seconds : 90}</Text>
                    <Pressable style={styles.adjBtn} onPress={() => updateRest(idx, 15)}><Text style={styles.adjText}>+</Text></Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable 
        style={styles.startBtn} 
        onPress={() => navigation.navigate('ActiveSession', { workout: { ...plan, exercises } })}
      >
        <Text style={styles.startBtnText}>Start Workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.gutterPanel, paddingBottom: 100 },
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 32, color: theme.colors.primary },
  desc: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.secondary, marginBottom: 24 },
  sectionTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 18, color: theme.colors.primary, marginBottom: 12 },

  exCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderSubtle, marginBottom: 12 },
  exName: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary, marginBottom: 4 },
  exSub: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 11, color: theme.colors.onSecondary, letterSpacing: 1 },
  exImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: theme.colors.surfaceMuted },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  controlGroup: { alignItems: 'center' },
  controlLabel: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 12, color: theme.colors.secondary, marginBottom: 4 },
  adjuster: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: 8 },
  adjBtn: { padding: 8, paddingHorizontal: 16 },
  adjText: { fontSize: 18, fontFamily: theme.typography.headlineMd.fontFamily, color: theme.colors.primary },
  adjVal: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, width: 30, textAlign: 'center' },
  startBtn: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: theme.colors.accentFocus, padding: 16, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: '#fff', fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 18 }
});
