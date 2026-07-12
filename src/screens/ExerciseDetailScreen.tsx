import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import ExerciseActionModal from '../components/ExerciseActionModal';

export default function ExerciseDetailScreen({ route }: any) {
  const { exercise } = route.params;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  let parsedImages = [];
  let parsedInstructions = [];
  let parsedMuscles = [];
  try {
    parsedImages = typeof exercise.images === 'string' ? JSON.parse(exercise.images) : (exercise.images || []);
    parsedInstructions = typeof exercise.instructions === 'string' ? JSON.parse(exercise.instructions) : (exercise.instructions || []);
    const pm = exercise.primary_muscles || exercise.primaryMuscles;
    parsedMuscles = typeof pm === 'string' ? JSON.parse(pm) : (pm || []);
  } catch (e) {}

  const imagePath = parsedImages.length > 0 ? parsedImages[0].replace(/\\/g, '/') : null;
  const imageUrl = imagePath ? `${CONFIG.ASSET_BASE_URL}/${imagePath}` : 'https://via.placeholder.com/800x600?text=GymX';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {parsedImages.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={{ height: 350, backgroundColor: theme.colors.surfaceMuted }}>
            {parsedImages.map((imgPath: string, idx: number) => (
              <Image 
                key={idx}
                source={{ uri: `${CONFIG.ASSET_BASE_URL}/${imgPath.replace(/\\/g, '/')}` }} 
                style={styles.heroImage} 
                resizeMode="cover" 
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.heroImage} />
        )}
        
        <View style={styles.content}>
          <Text style={styles.categoryBadge}>{exercise.category}</Text>
          <Text style={styles.title}>{exercise.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Equipment</Text>
              <Text style={styles.metaValue}>{exercise.equipment || 'Body Only'}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Primary Muscle</Text>
              <Text style={styles.metaValue}>{parsedMuscles[0] || 'Core'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {parsedInstructions.map((step: string, idx: number) => (
              <View key={idx} style={styles.instructionStep}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      
      <ExerciseActionModal exercise={exercise} visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  fabText: { color: theme.colors.onPrimary, fontSize: 32, lineHeight: 34 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 60 },
  heroImage: { width: width, height: 350, backgroundColor: theme.colors.surfaceMuted },
  content: { padding: theme.spacing.gutterPanel, marginTop: -30, backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  categoryBadge: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.accentFocus, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  title: { fontFamily: theme.typography.displayLg.fontFamily, fontSize: 36, color: theme.colors.primary, lineHeight: 40, marginBottom: 24 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metaBox: { flex: 1, backgroundColor: theme.colors.surfaceMuted, padding: 16, borderRadius: theme.rounded.lg, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  metaLabel: { fontFamily: theme.typography.labelSm.fontFamily, color: theme.colors.secondary, marginBottom: 4, textTransform: 'uppercase' },
  metaValue: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary },
  section: { marginTop: 16 },
  sectionTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 24, color: theme.colors.primary, marginBottom: 16 },
  instructionStep: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stepNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 2 },
  stepNumberText: { color: theme.colors.onPrimary, fontFamily: theme.typography.labelMd.fontFamily, fontSize: 12 },
  stepText: { flex: 1, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, lineHeight: 24, color: theme.colors.secondary }
});
