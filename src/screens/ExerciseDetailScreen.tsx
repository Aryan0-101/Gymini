import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CONFIG } from '../config';
import ExerciseActionModal from '../components/ExerciseActionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

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
  try {
    parsedImages = typeof exercise.images === 'string' ? JSON.parse(exercise.images) : (exercise.images || []);
    parsedInstructions = typeof exercise.instructions === 'string' ? JSON.parse(exercise.instructions) : (exercise.instructions || []);
    const pm = exercise.primary_muscles || exercise.primaryMuscles;
    parsedMuscles = typeof pm === 'string' ? JSON.parse(pm) : (pm || []);
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
                      resizeMode="cover" 
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

      <Pressable 
        style={({ pressed }) => [styles.fab, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} 
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add exercise"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      
      <ExerciseActionModal exercise={exercise} visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary, maxWidth: 600, alignSelf: 'center', width: '100%' },
  scrollContent: { paddingBottom: 100 },
  heroImage: { width: '100%', height: '100%', backgroundColor: theme.colors.surfaceMuted },
  paginationDots: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: theme.colors.primary },
  dotInactive: { backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  backButton: { position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(250, 245, 234, 0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  content: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.colors.primary, marginTop: -24 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(250, 245, 234, 0.1)', borderRadius: 16, fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.onPrimary, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 32, color: theme.colors.onPrimary, marginBottom: 24 },
  
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metaBox: { flex: 1, backgroundColor: theme.colors.surfaceMuted, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  metaLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.secondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  metaValue: { fontFamily: 'Unbounded_600SemiBold', fontSize: 14, color: theme.colors.onPrimary },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Unbounded_600SemiBold', fontSize: 20, color: theme.colors.onPrimary, marginBottom: 16 },
  
  instructionStep: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  stepNumberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(226, 114, 90, 0.1)', borderWidth: 1, borderColor: theme.colors.accentFocus, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumberText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: theme.colors.accentFocus },
  stepText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: theme.colors.secondary, lineHeight: 24 },
  
  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.accentFocus, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.accentFocus, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  fabText: { fontFamily: 'Unbounded_600SemiBold', fontSize: 32, color: theme.colors.primary, marginTop: -4 }
});
