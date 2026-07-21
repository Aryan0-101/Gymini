import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Line, Rect } from 'react-native-svg';
import { theme } from '../theme';

export default function RestTimerScreen({ route }: any) {
  const { restSeconds = 90, nextExerciseName = "Next Exercise", nextExerciseSetsInfo = "" } = route.params || {};
  const navigation = useNavigation<any>();
  const [timeLeft, setTimeLeft] = useState(restSeconds);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, [floatAnim]);

  useEffect(() => {
    if (timeLeft <= 0) {
      navigation.goBack();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t: number) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, navigation]);

  const addTime = () => setTimeLeft((prev: number) => prev + 30);
  const subTime = () => setTimeLeft((prev: number) => Math.max(0, prev - 15));

  const handleFinish = () => {
    Alert.alert(
      "Finish Session",
      "Are you sure you want to exit your workout? Unsaved progress may be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Finish", style: "destructive", onPress: () => navigation.pop(2) }
      ]
    );
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MaterialIcons name="timer" size={24} color={theme.colors.onPrimary} />
          <Text style={styles.headerTitle}>Rest & Recover</Text>
        </View>
        <Text style={styles.headerSub}>STAY HYDRATED</Text>
      </View>

      <View style={styles.main}>
        <Animated.View style={[styles.animationContainer, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }]}>
          {/* Animated SVG representation */}
          <Svg viewBox="0 0 200 60" width="100%" height={80}>
            {/* Barbell Shaft */}
            <Line x1="10" y1="30" x2="190" y2="30" stroke={theme.colors.borderSubtle} strokeWidth="4" strokeLinecap="round" />
            
            {/* Collars */}
            <Rect x="40" y="20" width="4" height="20" rx="1" fill={theme.colors.borderSubtle} />
            <Rect x="156" y="20" width="4" height="20" rx="1" fill={theme.colors.borderSubtle} />
            
            {/* Left Plates (Outside collar) */}
            <Rect x="31" y="10" width="8" height="40" rx="2" fill={theme.colors.accentFocus} stroke={theme.colors.primary} strokeWidth="1.5" />
            <Rect x="22" y="10" width="8" height="40" rx="2" fill={theme.colors.accentFocus} stroke={theme.colors.primary} strokeWidth="1.5" />
            <Rect x="15" y="15" width="6" height="30" rx="2" fill="#EAA765" stroke={theme.colors.primary} strokeWidth="1.5" />
            
            {/* Right Plates (Outside collar) */}
            <Rect x="161" y="10" width="8" height="40" rx="2" fill={theme.colors.accentFocus} stroke={theme.colors.primary} strokeWidth="1.5" />
            <Rect x="170" y="10" width="8" height="40" rx="2" fill={theme.colors.accentFocus} stroke={theme.colors.primary} strokeWidth="1.5" />
            <Rect x="179" y="15" width="6" height="30" rx="2" fill="#EAA765" stroke={theme.colors.primary} strokeWidth="1.5" />
          </Svg>
          <Text style={styles.recoveringText}>RECOVERING ATP</Text>
        </Animated.View>

        <Text style={styles.timerDisplay}>{mins}:{secs}</Text>
        
        <View style={styles.adjusterRow}>
          <Pressable style={styles.adjustBtn} onPress={subTime}>
            <Text style={styles.adjustBtnText}>-15s</Text>
          </Pressable>
          <Pressable style={styles.adjustBtn} onPress={addTime}>
            <Text style={styles.adjustBtnText}>+30s</Text>
          </Pressable>
        </View>

        <View style={styles.upNextCard}>
          <View style={styles.upNextIcon}>
            <MaterialIcons name="fitness-center" size={32} color={theme.colors.onPrimary} style={{ opacity: 0.5 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Text style={styles.upNextName}>{nextExerciseName}</Text>
            <Text style={styles.upNextInfo}>{nextExerciseSetsInfo}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.skipBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.skipBtnText}>SKIP REST</Text>
          </Pressable>
          <Pressable style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>FINISH SESSION</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary },
  header: { 
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, 
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  headerTitle: { fontFamily: 'Unbounded_700Bold', fontSize: 20, color: theme.colors.onPrimary },
  headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: 'rgba(250, 245, 234, 0.6)', letterSpacing: 2 },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  animationContainer: { width: '100%', maxWidth: 320, alignItems: 'center', marginBottom: 32 },
  recoveringText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: '#FB923C', letterSpacing: 3, marginTop: 16, opacity: 0.8 },
  timerDisplay: { fontFamily: 'IBM Plex Mono', fontSize: 110, fontWeight: '600', color: theme.colors.onPrimary, marginBottom: 16, includeFontPadding: false },
  adjusterRow: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  adjustBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.borderSubtle, backgroundColor: 'rgba(255,255,255,0.05)' },
  adjustBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, color: theme.colors.onPrimary },
  upNextCard: { width: '100%', maxWidth: 320, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 48 },
  upNextIcon: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  upNextLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: theme.colors.secondary, letterSpacing: 1, marginBottom: 4 },
  upNextName: { fontFamily: 'Unbounded_600SemiBold', fontSize: 20, color: theme.colors.onPrimary, marginBottom: 4 },
  upNextInfo: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(250, 245, 234, 0.4)' },
  controls: { width: '100%', maxWidth: 320, gap: 16 },
  skipBtn: { width: '100%', paddingVertical: 16, borderWidth: 2, borderColor: theme.colors.secondary, alignItems: 'center', borderRadius: 4 },
  skipBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, color: theme.colors.secondary, letterSpacing: 2 },
  finishBtn: { width: '100%', paddingVertical: 8, alignItems: 'center' },
  finishBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: 'rgba(250, 245, 234, 0.3)', letterSpacing: 2 }
});
