import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import DuoButton from '../components/DuoButton';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleStart = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.logoBox}>
          <MaterialIcons name="fitness-center" size={40} color={theme.colors.accentFocus} />
        </View>

        <Text style={styles.title}>GYMINI</Text>
        <Text style={styles.subtitle}>Your autonomous AI fitness coach, designed for total privacy.</Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <MaterialIcons name="lock" size={20} color={theme.colors.accentFocus} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>100% PRIVATE</Text>
              <Text style={styles.featureDesc}>All workout data processed locally on your device.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <MaterialIcons name="psychology" size={20} color={theme.colors.accentFocus} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>AI-POWERED</Text>
              <Text style={styles.featureDesc}>Adaptive routines that evolve with your progress.</Text>
            </View>
          </View>
        </View>

        <DuoButton 
          title="START TRAINING" 
          color="primary" 
          onPress={handleStart} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, maxWidth: 600, alignSelf: 'center', width: '100%' },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.surfaceMuted, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 48, color: theme.colors.primary, letterSpacing: -1, marginBottom: 16 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 18, color: theme.colors.onSurfaceVariant, lineHeight: 26, marginBottom: 48 },
  features: { gap: 24, marginBottom: 48 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.borderSubtle },
  featureTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, color: theme.colors.onSurface, marginBottom: 4, letterSpacing: 0.5 },
  featureDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.colors.onSurfaceVariant }
});
