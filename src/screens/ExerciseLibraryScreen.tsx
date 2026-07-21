import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSQLiteContext } from 'expo-sqlite';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import ExerciseActionModal from '../components/ExerciseActionModal';

type ExerciseRow = {
  id: string; name: string; equipment: string; primary_muscles: string; images: string; category: string; instructions: string; level: string;
};

type ExerciseItem = {
  id: string; name: string; equipment: string; primaryMuscles: string[]; imageUrl: string | null; category: string;
  images: string; instructions: string; level: string;
};

const FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Equipment'];

const filterMap: Record<string, string[]> = {
  'Chest': ['chest'],
  'Back': ['lats', 'middle back', 'lower back', 'traps'],
  'Legs': ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  'Arms': ['biceps', 'triceps', 'forearms', 'shoulders'],
  'Core': ['abdominals'],
  'Equipment': ['bands', 'barbell', 'cable', 'dumbbell', 'e-z curl bar', 'exercise ball', 'foam roll', 'kettlebells', 'machine', 'medicine ball', 'other']
};

export default function ExerciseLibraryScreen({ route }: any) {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['All']);
  const [activeSubFilters, setActiveSubFilters] = useState<Record<string, string[]>>({});
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const assignToDay = route?.params?.assignToDay;
  const assignToPlanId = route?.params?.assignToPlanId;

  useEffect(() => {
    async function fetchExercises() {
      const result = await db.getAllAsync<ExerciseRow>('SELECT * FROM exercises LIMIT 300;');
      const parsed = result.map((row) => {
        let parsedImages = []; let parsedMuscles = [];
        try { parsedImages = JSON.parse(row.images); } catch (e) {}
        try { parsedMuscles = JSON.parse(row.primary_muscles); } catch (e) {}
        return {
          id: row.id, name: row.name, equipment: row.equipment, category: row.category,
          primaryMuscles: parsedMuscles,
          imageUrl: parsedImages.length > 0 ? `${CONFIG.ASSET_BASE_URL}/${parsedImages[0].replace(/\\/g, '/')}` : null,
          images: row.images,
          instructions: (row as any).instructions,
          level: row.level
        };
      });
      setExercises(parsed);
    }
    fetchExercises();
  }, [db]);

  const addExerciseToDay = async (exercise: ExerciseItem, dayIdx: number) => {
    try {
      const existingSchedule = await db.getFirstAsync<any>('SELECT * FROM scheduled_workouts WHERE day_of_week = ? ORDER BY id DESC LIMIT 1', [dayIdx]);
      if (existingSchedule) {
        const plan = await db.getFirstAsync<any>('SELECT * FROM saved_plans WHERE id = ?', [existingSchedule.plan_id]);
        const exToAdd = { ...exercise, sets: 3, rest_seconds: 90 };
        
        if (plan) {
          const planEx = JSON.parse(plan.exercises_json);
          planEx.push(exToAdd);
          await db.runAsync('UPDATE saved_plans SET exercises_json = ?, title = "Custom Workout" WHERE id = ?', [JSON.stringify(planEx), plan.id]);
        }
      } else {
        const exToAdd = { ...exercise, sets: 3, rest_seconds: 90 };
        const result = await db.runAsync('INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)', [exercise.name || 'Custom Workout', 'Workout created from library.', JSON.stringify([exToAdd])]);
        await db.runAsync('INSERT INTO scheduled_workouts (plan_id, day_of_week) VALUES (?, ?)', [result.lastInsertRowId, dayIdx]);
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  const addExerciseToPlan = async (exercise: ExerciseItem, planId: number) => {
    try {
      const plan = await db.getFirstAsync<any>('SELECT * FROM saved_plans WHERE id = ?', [planId]);
      if (plan) {
        const planEx = JSON.parse(plan.exercises_json);
        planEx.push(exercise);
        await db.runAsync('UPDATE saved_plans SET exercises_json = ? WHERE id = ?', [JSON.stringify(planEx), planId]);
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilters.includes('All')) return true;

    const activeMuscleFilters = activeFilters.filter(f => f !== 'Equipment');
    const hasEquipmentFilter = activeFilters.includes('Equipment');

    let matchesMuscles = activeMuscleFilters.length === 0;
    
    if (activeMuscleFilters.length > 0) {
      const acceptableMuscles = new Set<string>();
      activeMuscleFilters.forEach(mf => {
        const subs = activeSubFilters[mf];
        if (subs && subs.length > 0) {
          subs.forEach(s => acceptableMuscles.add(s.toLowerCase()));
        } else {
          (filterMap[mf] || []).forEach(s => acceptableMuscles.add(s.toLowerCase()));
        }
      });
      
      matchesMuscles = ex.primaryMuscles.some(m => acceptableMuscles.has(m.toLowerCase()));
    }

    let matchesEquipment = !hasEquipmentFilter;
    if (hasEquipmentFilter) {
      const equipSubs = activeSubFilters['Equipment'];
      if (equipSubs && equipSubs.length > 0) {
        matchesEquipment = Boolean(ex.equipment && equipSubs.includes(ex.equipment.toLowerCase()));
      } else {
        matchesEquipment = Boolean(!ex.equipment || ex.equipment === 'body only');
      }
    }

    return matchesMuscles && matchesEquipment;
  });

  const handleFilterPress = (filter: string) => {
    setExpandedFilter(null);

    if (filter === 'All') {
      setActiveFilters(['All']);
      setActiveSubFilters({});
      return;
    }

    setActiveFilters(prev => {
      let next = prev.filter(f => f !== 'All');
      if (next.includes(filter)) {
        next = next.filter(f => f !== filter);
        if (next.length === 0) {
          setActiveSubFilters({});
          return ['All'];
        }
        return next;
      }
      return [...next, filter];
    });
  };

  const handleFilterLongPress = (filter: string) => {
    if (filter === 'All') return;
    
    setActiveFilters(prev => {
      let next = prev.filter(f => f !== 'All');
      if (!next.includes(filter)) next = [...next, filter];
      return next;
    });

    setExpandedFilter(filter);
  };

  const handleSubFilterPress = (sub: string) => {
    if (!expandedFilter) return;
    setActiveSubFilters(prev => {
      const currentSubs = prev[expandedFilter] || [];
      if (currentSubs.includes(sub)) {
        return { ...prev, [expandedFilter]: currentSubs.filter(s => s !== sub) };
      }
      return { ...prev, [expandedFilter]: [...currentSubs, sub] };
    });
  };

  const clearSubFilters = () => {
    if (!expandedFilter) return;
    setActiveSubFilters(prev => ({ ...prev, [expandedFilter]: [] }));
  };

  const renderItem = ({ item }: { item: ExerciseItem }) => (
    <Pressable style={styles.card} onPress={() => {
      if (assignToDay !== undefined) {
        addExerciseToDay(item, assignToDay);
      } else if (assignToPlanId !== undefined) {
        addExerciseToPlan(item, assignToPlanId);
      } else {
        navigation.navigate('ExerciseDetail', { exercise: item });
      }
    }}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl || '' }} style={styles.image} contentFit="cover" transition={300} />
      </View>
      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={[styles.title, { marginBottom: 0, flex: 1, paddingRight: 8 }]} numberOfLines={1}>{item.name}</Text>
          <Pressable 
            onPress={(e) => { e.stopPropagation(); setSelectedExercise(item); }} 
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderSubtle }}
          >
            <Text style={{ fontSize: 20, color: theme.colors.primary, lineHeight: 22 }}>+</Text>
          </Pressable>
        </View>
        <View style={[styles.chipContainer, { flexWrap: 'wrap' }]}>
          {item.primaryMuscles.slice(0, 1).map((muscle, idx) => (
            <View key={`m-${idx}`} style={styles.chip}>
              <Text style={styles.chipText}>{muscle}</Text>
            </View>
          ))}
          {item.equipment && item.equipment !== 'body only' && (
            <View style={[styles.chip, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.chipText, { color: theme.colors.onPrimary }]}>{item.equipment}</Text>
            </View>
          )}
          {item.level && (
            <View style={[styles.chip, { backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.borderSubtle }]}>
              <Text style={styles.chipText}>{item.level}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const TypedFlashList = FlashList as any;

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={theme.colors.onPrimary}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map(filter => {
              const isActive = activeFilters.includes(filter);
              const subs = activeSubFilters[filter] || [];
              const isEquipmentNoSub = filter === 'Equipment' && subs.length === 0 && isActive;
              return (
                <Pressable 
                  key={filter} 
                  style={[styles.filterBtn, isActive && styles.filterBtnActive, isEquipmentNoSub && { borderColor: theme.colors.accentFocus }]}
                  onPress={() => handleFilterPress(filter)}
                  onLongPress={() => handleFilterLongPress(filter)}
                  delayLongPress={300}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive, isEquipmentNoSub && { textDecorationLine: 'line-through' }]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {expandedFilter && filterMap[expandedFilter] && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: theme.spacing.marginPage, marginTop: 12 }}>
              <Pressable 
                style={[styles.subFilterBtn, !(activeSubFilters[expandedFilter]?.length > 0) && styles.subFilterBtnActive]}
                onPress={clearSubFilters}
              >
                <Text style={[styles.subFilterText, !(activeSubFilters[expandedFilter]?.length > 0) && styles.subFilterTextActive]}>
                  {expandedFilter === 'Equipment' ? 'Body Only' : 'All ' + expandedFilter}
                </Text>
              </Pressable>
              {filterMap[expandedFilter].map(sub => {
                const isSelected = activeSubFilters[expandedFilter]?.includes(sub);
                return (
                  <Pressable 
                    key={sub} 
                    style={[styles.subFilterBtn, isSelected && styles.subFilterBtnActive]}
                    onPress={() => handleSubFilterPress(sub)}
                  >
                    <Text style={[styles.subFilterText, isSelected && styles.subFilterTextActive]}>{sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.marginPage }}>
        {filteredExercises.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5, paddingBottom: 100 }}>
            <Text style={{ fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 20, color: theme.colors.onPrimary, marginBottom: 8 }}>No exercises found</Text>
            <Text style={{ fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary, textAlign: 'center' }}>Try adjusting your search or filters.</Text>
          </View>
        ) : (
          <TypedFlashList
            data={filteredExercises}
            renderItem={renderItem}
            estimatedItemSize={250}
            ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
            contentContainerStyle={{ padding: theme.spacing.gutterPanel, paddingBottom: 40 }}
          />
        )}
      </View>
      <ExerciseActionModal 
        exercise={selectedExercise} 
        visible={!!selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchSection: { paddingHorizontal: theme.spacing.marginPage, paddingVertical: 16, marginBottom: 8 },
  searchInput: { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.borderSubtle, borderRadius: 14, padding: 12, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.onPrimary, marginBottom: 16 },
  filterSection: { marginBottom: 16 },
  filterScroll: { gap: 8, paddingHorizontal: theme.spacing.marginPage },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface },
  filterBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.secondary, textTransform: 'uppercase' },
  filterTextActive: { color: theme.colors.onPrimary },
  subFilterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceMuted },
  subFilterBtnActive: { backgroundColor: theme.colors.accentFocus, borderColor: theme.colors.accentFocus },
  subFilterText: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 10, color: theme.colors.secondary, textTransform: 'capitalize' },
  subFilterTextActive: { color: theme.colors.primary },
  card: { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.borderSubtle, borderRadius: theme.rounded.lg, overflow: 'hidden' },
  imageContainer: { width: '100%', height: 180, backgroundColor: theme.colors.surfaceMuted },
  image: { width: '100%', height: '100%', position: 'absolute' },
  cardContent: { padding: 16 },
  title: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 20, color: theme.colors.onPrimary, marginBottom: 8 },
  chipContainer: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipText: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' }
});
