import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, SafeAreaView, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';

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

        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>START TRAINING</Text>
          <MaterialIcons name="arrow-forward" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary, maxWidth: 600, alignSelf: 'center', width: '100%' },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(226, 114, 90, 0.1)', borderWidth: 1, borderColor: 'rgba(226, 114, 90, 0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 48, color: theme.colors.onPrimary, letterSpacing: -1, marginBottom: 16 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 18, color: theme.colors.secondary, lineHeight: 26, marginBottom: 48 },
  features: { gap: 24, marginBottom: 48 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(250, 245, 234, 0.05)', alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14, color: theme.colors.onPrimary, marginBottom: 4, letterSpacing: 0.5 },
  featureDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: theme.colors.secondary },
  startBtn: { backgroundColor: theme.colors.accentFocus, paddingVertical: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startBtnText: { fontFamily: 'Unbounded_600SemiBold', fontSize: 16, color: theme.colors.primary }
});
