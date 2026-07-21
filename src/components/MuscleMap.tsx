import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { theme } from '../theme';

interface MuscleMapProps {
  muscles: string[];
  secondaryMuscles?: string[];
  size?: number;
  gender?: 'male' | 'female';
}

const MUSCLE_MAP: Record<string, string[]> = {
  abductors: ['abductors'],
  abs: ['abs'],
  abdominals: ['abs'],
  core: ['abs', 'obliques'],
  adductors: ['adductors'],
  biceps: ['biceps'],
  calves: ['calves'],
  delts: ['deltoids'],
  deltoids: ['deltoids'],
  shoulders: ['deltoids'],
  forearms: ['forearm'],
  glutes: ['gluteal'],
  hamstrings: ['hamstring'],
  lats: ['upper-back', 'lower-back'],
  'levator scapulae': ['trapezius', 'neck'],
  pectorals: ['chest'],
  chest: ['chest'],
  quads: ['quadriceps'],
  quadriceps: ['quadriceps'],
  'serratus anterior': ['obliques'],
  spine: ['lower-back'],
  'lower back': ['lower-back'],
  'middle back': ['upper-back', 'lower-back'],
  'upper back': ['upper-back'],
  traps: ['trapezius'],
  triceps: ['triceps'],
  'hip flexors': ['quadriceps', 'abs']
};

const MuscleMap = React.memo(({ muscles, secondaryMuscles = [], size = 150, gender = 'male' }: MuscleMapProps) => {
  const data = useMemo(() => {
    const activeSlugs = new Map<string, string>();
    
    muscles.forEach(m => {
      const slugs = MUSCLE_MAP[m.toLowerCase()];
      if (slugs) slugs.forEach(s => activeSlugs.set(s, theme.colors.primary));
    });

    secondaryMuscles.forEach(m => {
      const slugs = MUSCLE_MAP[m.toLowerCase()];
      if (slugs) {
        slugs.forEach(s => {
          if (!activeSlugs.has(s)) {
            activeSlugs.set(s, theme.colors.secondary);
          }
        });
      }
    });
    
    return Array.from(activeSlugs.entries()).map(([slug, color]) => ({
      slug,
      intensity: 1,
      color: color,
      styles: { fill: color }
    }));
  }, [muscles, secondaryMuscles]);

  return (
    <View style={styles.container}>
      <View style={styles.bodyWrapper}>
        <Body 
          data={data}
          gender={gender}
          side="front"
          scale={size / 400}
          border={theme.colors.borderSubtle}
          defaultFill={theme.colors.surfaceMuted}
          colors={[theme.colors.primary]}
        />
      </View>
      <View style={styles.bodyWrapper}>
        <Body 
          data={data}
          gender={gender}
          side="back"
          scale={size / 400}
          border={theme.colors.borderSubtle}
          defaultFill={theme.colors.surfaceMuted}
          colors={[theme.colors.primary]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16
  },
  bodyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  }
});

export default MuscleMap;
