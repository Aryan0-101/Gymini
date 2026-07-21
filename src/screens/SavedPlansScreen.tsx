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
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', color: theme.colors.primary, marginLeft: 8 }}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{assignToDay !== undefined ? `Assign to ${days[assignToDay]}` : "My Plans"}</Text>
      <Text style={styles.subtitle}>{assignToDay !== undefined ? "Tap a plan to schedule it." : "Your AI-generated routines."}</Text>
    </View>
  );

  const renderEmpty = () => (
    <Pressable style={styles.emptyStateBtn} onPress={() => navigation.navigate('AgentBuilder')} accessibilityRole="button" accessibilityLabel="Build a workout">
      <MaterialIcons name="smart-toy" size={32} color={theme.colors.onPrimary} style={{ marginBottom: 12 }} />
      <Text style={styles.emptyStateTitle}>No plans yet</Text>
      <Text style={styles.emptyStateDesc}>Tap to ask Gymini to build your first workout.</Text>
    </Pressable>
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
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 32, color: theme.colors.primary },
  subtitle: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.secondary, marginBottom: 24 },
  emptyText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary },
  emptyStateBtn: { backgroundColor: theme.colors.primary, padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  emptyStateTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 18, color: theme.colors.onPrimary, marginBottom: 4 },
  emptyStateDesc: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 14, color: 'rgba(242, 233, 216, 0.7)', textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.stackDefault,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.stackDefault,
  },
  cardTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 20, color: theme.colors.primary, marginBottom: 4, paddingRight: 32 },
  cardDesc: { fontFamily: theme.typography.bodySm.fontFamily, fontSize: 14, color: theme.colors.secondary, marginBottom: 12 },
  cardMeta: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 12, color: theme.colors.accentFocus, textTransform: 'uppercase' }
});
