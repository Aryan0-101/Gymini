import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function SavedPlansScreen({ route }: any) {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [plans, setPlans] = useState<any[]>([]);
  const assignToDay = route?.params?.assignToDay;

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          <Text style={{ fontFamily: 'Manrope_600SemiBold', color: theme.colors.primary, marginLeft: 8 }}>Back</Text>
        </Pressable>
        <Text style={styles.title}>My Plans</Text>
        <Text style={styles.subtitle}>Your AI-generated routines.</Text>

        {plans.length === 0 ? (
          <Text style={styles.emptyText}>No saved plans yet. Go to the AI Builder!</Text>
        ) : (
          plans.map((plan: any) => {
            const exercises = JSON.parse(plan.exercises_json);
            return (
              <Pressable 
                key={plan.id} 
                style={styles.card}
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
                >
                  <MaterialIcons name="delete-outline" size={24} color="#f1e8d7" />
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.gutterPanel, paddingTop: 64, paddingBottom: 40 },
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 32, color: theme.colors.primary },
  subtitle: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.secondary, marginBottom: 24 },
  emptyText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary },
  card: {
    backgroundColor: "#5D1800",
    padding: theme.spacing.stackDefault,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.stackDefault,
  },
  cardTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 20, color: "#f1e8d7", marginBottom: 4 },
  cardDesc: { fontFamily: theme.typography.bodySm.fontFamily, fontSize: 14, color: "#f1e8d7", marginBottom: 12 },
  cardMeta: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 12, color: theme.colors.accentFocus, textTransform: 'uppercase' }
});
