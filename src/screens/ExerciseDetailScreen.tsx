import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import ExerciseActionModal from '../components/ExerciseActionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DuoButton from '../components/DuoButton';
import MuscleMap from '../components/MuscleMap';

export default function ExerciseDetailScreen({ route }: any) {
  const { exercise } = route.params;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  let parsedImages = [];
  let parsedInstructions = [];
  let parsedMuscles = [];
  let parsedSecondaryMuscles = [];
  try {
    parsedImages = typeof exercise.images === 'string' ? JSON.parse(exercise.images) : (exercise.images || []);
    parsedInstructions = typeof exercise.instructions === 'string' ? JSON.parse(exercise.instructions) : (exercise.instructions || []);
    const pm = exercise.primary_muscles || exercise.primaryMuscles;
    parsedMuscles = typeof pm === 'string' ? JSON.parse(pm) : (pm || []);
    const sm = exercise.secondary_muscles || exercise.secondaryMuscles;
    parsedSecondaryMuscles = typeof sm === 'string' ? JSON.parse(sm) : (sm || []);
  } catch (e) {}

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={{ position: 'relative' }}>
          {parsedImages.length > 0 ? (
            <View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                pagingEnabled 
                style={{ height: 350, backgroundColor: theme.colors.background }} 
                onScroll={handleScroll} 
                scrollEventThrottle={16}
              >
                {parsedImages.map((imgPath: string, idx: number) => (
                  <View key={idx} style={{ width: 600, maxWidth: '100%', height: 350 }}>
                    <Image 
                      source={{ uri: imgPath.startsWith('http') ? imgPath : `${CONFIG.ASSET_BASE_URL}/${imgPath.replace(/\\/g, '/')}` }} 
                      style={styles.heroImage} 
                      contentFit="cover" 
                      transition={300}
                    />
                  </View>
                ))}
              </ScrollView>
              {parsedImages.length > 1 && (
                <View style={styles.paginationDots}>
                  {parsedImages.map((_: any, idx: number) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.dot,
                        idx === activeIndex ? styles.dotActive : styles.dotInactive
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.heroImage, { height: 350, alignItems: 'center', justifyContent: 'center' }]}>
               <MaterialIcons name="image-not-supported" size={48} color={theme.colors.borderSubtle} />
            </View>
          )}

          <Pressable 
            style={({ pressed }) => [
              styles.backButton, 
              { top: Math.max(insets.top, 16), opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.categoryBadge}>{exercise.category}</Text>
          <Text style={styles.title}>{exercise.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Equipment</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{exercise.equipment || 'Body Only'}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Primary Muscle</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{parsedMuscles[0] || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Muscles</Text>
            <View style={styles.muscleMapWrapper}>
              <MuscleMap muscles={parsedMuscles} secondaryMuscles={parsedSecondaryMuscles} size={280} />
            </View>
            <View style={styles.legendContainer}>
              <View style={styles.legendGroup}>
                <Text style={styles.legendTitle}>Primary</Text>
                <View style={styles.chipRow}>
                  {parsedMuscles.map((m: string) => (
                    <View key={m} style={[styles.muscleChip, { borderColor: theme.colors.primary }]}>
                      <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                      <Text style={styles.muscleChipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {parsedSecondaryMuscles.length > 0 && (
                <View style={styles.legendGroup}>
                  <Text style={styles.legendTitle}>Secondary</Text>
                  <View style={styles.chipRow}>
                    {parsedSecondaryMuscles.map((m: string) => (
                      <View key={m} style={[styles.muscleChip, { borderColor: theme.colors.secondary }]}>
                        <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
                        <Text style={styles.muscleChipText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {parsedInstructions.length > 0 ? parsedInstructions.map((step: string, idx: number) => (
              <View key={idx} style={styles.instructionStep}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            )) : (
              <Text style={styles.stepText}>No instructions available.</Text>
            )}
          </View>

        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <DuoButton 
          title="ADD TO WORKOUT" 
          color="primary" 
          onPress={() => setModalVisible(true)} 
        />
      </View>
      
      <ExerciseActionModal exercise={exercise} visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, maxWidth: 600, alignSelf: 'center', width: '100%' },
  scrollContent: { paddingBottom: 100 },
  heroImage: { width: '100%', height: '100%', backgroundColor: theme.colors.surface },
  paginationDots: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: theme.colors.primary },
  dotInactive: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  backButton: { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', zIndex: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle },
  content: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: theme.colors.background, marginTop: -32 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.surface, borderRadius: 16, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase', borderWidth: 2, borderColor: theme.colors.borderSubtle },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 32, color: theme.colors.onBackground, marginBottom: 24 },
  
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metaBox: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle },
  metaLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  metaValue: { fontFamily: 'Unbounded_600SemiBold', fontSize: 14, color: theme.colors.onSurface },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Unbounded_600SemiBold', fontSize: 20, color: theme.colors.onBackground, marginBottom: 16 },
  muscleMapWrapper: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, marginBottom: 16 },
  
  legendContainer: { gap: 16 },
  legendGroup: { gap: 8 },
  legendTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  muscleChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: theme.colors.onSurface, textTransform: 'capitalize' },

  instructionStep: { flexDirection: 'row', marginBottom: 16, paddingRight: 16 },
  stepNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumberText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: theme.colors.primary },
  stepText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.colors.onSurfaceVariant, lineHeight: 24 },
  
  fabContainer: { position: 'absolute', bottom: 32, left: 24, right: 24 }
});
