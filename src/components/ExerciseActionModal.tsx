import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function ExerciseActionModal({ exercise, visible, onClose }: any) {
  const navigation = useNavigation<any>();
  const db = useSQLiteContext();
  const [view, setView] = useState<'menu' | 'add_to_plan' | 'create_plan'>('menu');
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanName, setNewPlanName] = useState('');

  useEffect(() => {
    if (visible) {
      setView('menu');
      setNewPlanName('');
    }
  }, [visible]);

  const loadPlans = async () => {
    try {
      const res = await db.getAllAsync('SELECT * FROM saved_plans ORDER BY created_at DESC');
      setPlans(res);
      setView('add_to_plan');
    } catch (e) {
      Alert.alert('Error', 'Failed to load plans');
    }
  };

  const handleStartSession = () => {
    onClose();
    const workout = {
      title: 'Quick Session',
      description: `Single exercise: ${exercise.name}`,
      exercises: [{
        ...exercise,
        resolvedName: exercise.name,
        sets: 3,
        reps: "10-12",
        duration_seconds: 0
      }]
    };
    navigation.navigate('ActiveSession', { workout });
  };

  const handleAddToPlan = async (plan: any) => {
    try {
      const exList = JSON.parse(plan.exercises_json);
      exList.push({
        ...exercise,
        resolvedName: exercise.name,
        sets: 3,
        reps: "10-12",
        duration_seconds: 0
      });
      await db.runAsync('UPDATE saved_plans SET exercises_json = ? WHERE id = ?', [JSON.stringify(exList), plan.id]);
      Alert.alert('Success', `Added to ${plan.title}`);
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to add to plan');
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;
    try {
      const exList = [{
        ...exercise,
        resolvedName: exercise.name,
        sets: 3,
        reps: "10-12",
        duration_seconds: 0
      }];
      await db.runAsync('INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)', [
        newPlanName,
        'Custom Plan',
        JSON.stringify(exList)
      ]);
      Alert.alert('Success', 'Plan created');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to create plan');
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />
          <Text style={styles.title}>{exercise?.name}</Text>
          
          {view === 'menu' && (
            <View style={styles.menuContainer}>
              <Pressable style={styles.btn} onPress={handleStartSession}>
                <MaterialIcons name="play-arrow" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                <Text style={styles.btnText}>Start Quick Session</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={loadPlans}>
                <MaterialIcons name="add" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                <Text style={styles.btnText}>Add to Existing Plan</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => setView('create_plan')}>
                <MaterialIcons name="edit" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                <Text style={styles.btnText}>Create New Plan</Text>
              </Pressable>
            </View>
          )}

          {view === 'add_to_plan' && (
            <View style={styles.listContainer}>
              <Text style={styles.subTitle}>Select a Plan</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {plans.map((p) => (
                  <Pressable key={p.id} style={styles.planCard} onPress={() => handleAddToPlan(p)}>
                    <Text style={styles.planTitle}>{p.title}</Text>
                    <Text style={styles.planDesc}>{JSON.parse(p.exercises_json).length} exercises</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={styles.backBtn} onPress={() => setView('menu')}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            </View>
          )}

          {view === 'create_plan' && (
            <View style={styles.createContainer}>
              <Text style={styles.subTitle}>New Plan Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Push Day" 
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={newPlanName} 
                onChangeText={setNewPlanName} 
                autoFocus
              />
              <Pressable style={styles.saveBtn} onPress={handleCreatePlan}>
                <Text style={styles.saveBtnText}>Create & Add</Text>
              </Pressable>
              <Pressable style={styles.backBtn} onPress={() => setView('menu')}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            </View>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: theme.colors.borderSubtle, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 24, color: theme.colors.primary, marginBottom: 24, textAlign: 'center' },
  menuContainer: { gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  btnIcon: { fontSize: 20, marginRight: 16 },
  btnText: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary },
  listContainer: { gap: 12 },
  subTitle: { fontFamily: theme.typography.labelMd.fontFamily, color: theme.colors.secondary, marginBottom: 8, textTransform: 'uppercase' },
  planCard: { backgroundColor: theme.colors.background, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderSubtle, marginBottom: 8 },
  planTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary },
  planDesc: { fontFamily: theme.typography.bodySm.fontFamily, color: theme.colors.secondary, marginTop: 4 },
  backBtn: { marginTop: 16, padding: 12, alignItems: 'center' },
  backBtnText: { fontFamily: theme.typography.labelMd.fontFamily, color: theme.colors.secondary },
  createContainer: { gap: 12 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.borderSubtle, borderRadius: 8, padding: 16, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, color: theme.colors.primary, marginBottom: 16 },
  saveBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { fontFamily: theme.typography.labelMd.fontFamily, color: theme.colors.onPrimary, fontSize: 16 }
});
