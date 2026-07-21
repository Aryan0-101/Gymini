import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, FlatList } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export default function SavedPlansScreen({ route }: any) {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [plans, setPlans] = useState<any[]>([]);
  const assignToDay = route?.params?.assignToDay;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const insets = useSafeAreaInsets();

  const loadPlans = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT * FROM saved_plans 
        WHERE title != 'Rest Day' 
        AND title != 'Quick Session'
        AND description != 'Workout created from library.'
        AND description NOT LIKE 'Single exercise:%'
        ORDER BY created_at DESC
      `);
      setPlans(result);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadPlans();
    }
  }, [isFocused, db]);

  const assignPlanToDay = async (planId: number, dayIdx: number) => {
    try {
      await db.runAsync('DELETE FROM scheduled_workouts WHERE day_of_week = ?', [dayIdx]);
      await db.runAsync('INSERT INTO scheduled_workouts (plan_id, day_of_week) VALUES (?, ?)', [planId, dayIdx]);
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM saved_plans WHERE id = ?', [id]);
              loadPlans();
            } catch (e) {
              Alert.alert("Error", "Could not delete plan.");
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={{ marginBottom: 24 }}>
      <Pressable 
        onPress={() => navigation.goBack()} 
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', color: theme.colors.onSurface, marginLeft: 8 }}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{assignToDay !== undefined ? `Assign to ${days[assignToDay]}` : "My Plans"}</Text>
      <Text style={styles.subtitle}>{assignToDay !== undefined ? "Tap a plan to schedule it." : "Your routines."}</Text>
    </View>
  );

  const handleCreateCustomPlan = async () => {
    try {
      const result = await db.runAsync('INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)', ['Custom Plan', 'Build your own routine.', '[]']);
      const newPlanId = result.lastInsertRowId;
      loadPlans(); // Reload just in case
      navigation.navigate('WorkoutDetail', { 
        plan: { id: newPlanId, title: 'Custom Plan', description: 'Build your own routine.', exercises: [] } 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderEmpty = () => (
    <View style={{ gap: 16, marginTop: 32 }}>
      <Pressable style={styles.emptyStateBtn} onPress={() => navigation.navigate('Builder')} accessibilityRole="button" accessibilityLabel="Build a workout">
        <MaterialIcons name="smart-toy" size={32} color={theme.colors.onPrimary} style={{ marginBottom: 12 }} />
        <Text style={styles.emptyStateTitle}>Build with Gymini</Text>
        <Text style={styles.emptyStateDesc}>Tap to ask Gymini to build a personalized AI workout.</Text>
      </Pressable>
      
      <Pressable style={[styles.emptyStateBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle }]} onPress={handleCreateCustomPlan} accessibilityRole="button" accessibilityLabel="Create Custom Plan">
        <MaterialIcons name="add-box" size={32} color={theme.colors.primary} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>Create Custom Plan</Text>
        <Text style={[styles.emptyStateDesc, { color: theme.colors.onSurfaceVariant }]}>Build a workout from scratch.</Text>
      </Pressable>
    </View>
  );

  const renderItem = ({ item: plan }: { item: any }) => {
    const exercises = JSON.parse(plan.exercises_json);
    return (
      <Pressable 
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`View plan ${plan.title}`}
        onPress={() => {
          if (assignToDay !== undefined) {
            assignPlanToDay(plan.id, assignToDay);
          } else {
            navigation.navigate('WorkoutDetail', { 
              plan: { id: plan.id, title: plan.title, description: plan.description, exercises } 
            });
          }
        }}
      >
        <Text style={styles.cardTitle} numberOfLines={1}>{plan.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{plan.description}</Text>
        <Text style={styles.cardMeta}>{exercises.length} Exercises</Text>
        
        <Pressable 
          style={{ position: 'absolute', top: 16, right: 16, padding: 4 }}
          onPress={() => handleDelete(plan.id, plan.title)}
          accessibilityRole="button"
          accessibilityLabel="Delete plan"
        >
          <MaterialIcons name="delete-outline" size={24} color={theme.colors.secondary} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList 
        data={plans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, maxWidth: 600, alignSelf: 'center', width: '100%' },
  content: { padding: theme.spacing.gutterPanel, paddingBottom: 40 },
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 32, color: theme.colors.onSurface },
  subtitle: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.secondary, marginBottom: 24 },
  emptyText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary },
  emptyStateBtn: { backgroundColor: theme.colors.primary, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderBottomWidth: 6, borderColor: '#D88D22' },
  emptyStateTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 18, color: theme.colors.onPrimary, marginBottom: 4 },
  emptyStateDesc: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 14, color: theme.colors.onPrimary, textAlign: 'center', opacity: 0.8 },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.stackDefault,
    borderRadius: theme.rounded.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.stackDefault,
  },
  cardTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 20, color: theme.colors.onSurface, marginBottom: 4, paddingRight: 32 },
  cardDesc: { fontFamily: theme.typography.bodySm.fontFamily, fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12 },
  cardMeta: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 12, color: theme.colors.primary, textTransform: 'uppercase' }
});
