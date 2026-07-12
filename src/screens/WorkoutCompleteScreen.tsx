import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function WorkoutCompleteScreen() {
  const navigation = useNavigation<any>();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    const timer = setTimeout(() => {
      navigation.navigate('Home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <MaterialIcons name="done-all" size={80} color="#E2725A" />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>WORKOUT COMPLETE</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: opacityAnim }]}>Logged to your recent activity</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#26211D', justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(226, 114, 90, 0.1)', borderWidth: 2, borderColor: 'rgba(226, 114, 90, 0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: 'Unbounded_700Bold', fontSize: 28, color: '#FAF5EA', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: 'rgba(250, 245, 234, 0.6)', letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase' }
});
