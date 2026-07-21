import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSQLiteContext } from 'expo-sqlite';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { CONFIG } from '../config';
import ExerciseActionModal from '../components/ExerciseActionModal';

type ExerciseRow = {
  id: string; name: string; equipment: string; primary_muscles: string; images: string; category: string; instructions: string; level: string;
};

type ExerciseItem = {
  id: string; name: string; equipment: string; primaryMuscles: string[]; secondaryMuscles: string[]; imageUrl: string | null; category: string;
  images: string; instructions: string; level: string;
};

const FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Equipment'];

const filterMap: Record<string, string[]> = {
  'Chest': ['pectorals', 'serratus anterior'],
  'Back': ['lats', 'spine', 'traps', 'levator scapulae', 'upper back'],
  'Shoulders': ['delts'],
  'Legs': ['quads', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  'Arms': ['biceps', 'triceps', 'forearms'],
  'Core': ['abs'],
  'Equipment': ['band', 'barbell', 'cable', 'dumbbell', 'ez barbell', 'kettlebell', 'leverage machine', 'medicine ball', 'smith machine', 'resistance band']
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
  const [page, setPage] = useState(1);
  const listRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const assignToDay = route?.params?.assignToDay;
  const assignToPlanId = route?.params?.assignToPlanId;

  useEffect(() => {
    async function fetchExercises() {
      try {
        const result = await db.getAllAsync<ExerciseRow>('SELECT id, name, equipment, primary_muscles, secondary_muscles, images, category, instructions, level FROM exercises;');
        const parsed = result.map((row) => {
        let parsedImages = []; let parsedMuscles = []; let parsedSecondary = [];
        try { parsedImages = JSON.parse(row.images); } catch (e) {}
        try { parsedMuscles = JSON.parse(row.primary_muscles); } catch (e) {}
        try { parsedSecondary = JSON.parse(row.secondary_muscles); } catch (e) {}
        
        const img = parsedImages[0];
        const imageUrl = img ? (img.startsWith('http') ? img : `${CONFIG.ASSET_BASE_URL}/${img.replace(/\\/g, '/')}`) : null;

        return {
          id: row.id, name: row.name, equipment: row.equipment, category: row.category,
          primaryMuscles: parsedMuscles,
          imageUrl,
          images: row.images,
          instructions: (row as any).instructions,
          level: row.level,
          secondaryMuscles: parsedSecondary
        };
      });
      setExercises(parsed);
      } catch (e) {
        console.error('Error fetching exercises:', e);
      }
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
        planEx.push({ ...exercise, sets: 3, reps: 10, rest_seconds: 90 });
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

  useEffect(() => {
    setPage(1);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search, activeFilters, activeSubFilters]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE) || 1;
  const paginatedExercises = filteredExercises.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

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
        <Image 
          source={{ uri: item.imageUrl || '' }} 
          style={styles.image} 
          contentFit="cover" 
          transition={300} 
          cachePolicy="memory-disk"
        />
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
      <View style={[styles.searchSection, { paddingTop: Math.max(insets.top, 16) }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
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
          <>
            <TypedFlashList
              ref={listRef}
              data={paginatedExercises}
              renderItem={renderItem}
              estimatedItemSize={250}
              numColumns={2}
              contentContainerStyle={{ padding: 8, paddingBottom: 16 }}
            />
            <View style={styles.paginationContainer}>
              <Pressable 
                disabled={page === 1} 
                onPress={() => handlePageChange(page - 1)}
                style={[styles.pageBtn, page === 1 && { opacity: 0.5 }]}
              >
                <Text style={styles.pageBtnText}>PREV</Text>
              </Pressable>
              <Text style={styles.pageText}>PAGE {page} OF {totalPages}</Text>
              <Pressable 
                disabled={page >= totalPages} 
                onPress={() => handlePageChange(page + 1)}
                style={[styles.pageBtn, page >= totalPages && { opacity: 0.5 }]}
              >
                <Text style={styles.pageBtnText}>NEXT</Text>
              </Pressable>
            </View>
          </>
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
  searchInput: { backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, borderRadius: 14, padding: 16, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginBottom: 16 },
  filterSection: { marginBottom: 16 },
  filterScroll: { gap: 8, paddingHorizontal: theme.spacing.marginPage },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface },
  filterBtnActive: { backgroundColor: theme.colors.primary, borderColor: '#D88D22' },
  filterText: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.secondary, textTransform: 'uppercase' },
  filterTextActive: { color: theme.colors.onPrimary },
  subFilterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceMuted },
  subFilterBtnActive: { backgroundColor: theme.colors.accentFocus, borderColor: '#B33434' },
  subFilterText: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 10, color: theme.colors.secondary, textTransform: 'capitalize' },
  subFilterTextActive: { color: theme.colors.onPrimary },
  card: { flex: 1, margin: 6, backgroundColor: theme.colors.surface, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.colors.borderSubtle, borderRadius: theme.rounded.lg, overflow: 'hidden' },
  imageContainer: { width: '100%', height: 120, backgroundColor: theme.colors.surfaceMuted, borderBottomWidth: 2, borderColor: theme.colors.borderSubtle },
  image: { width: '100%', height: '100%', position: 'absolute' },
  cardContent: { padding: 12 },
  title: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 15, color: theme.colors.onSurface, marginBottom: 8 },
  chipContainer: { flexDirection: 'row', gap: 6 },
  chip: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  chipText: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 9, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 2, borderColor: theme.colors.borderSubtle },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle },
  pageBtnText: { fontFamily: 'JetBrainsMono_500Medium', color: theme.colors.primary, fontSize: 14 },
  pageText: { fontFamily: 'JetBrainsMono_500Medium', color: theme.colors.onSurfaceVariant, fontSize: 12 }
});
