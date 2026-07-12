import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CONFIG } from '../config';
import { useNavigation } from '@react-navigation/native';

export default function AgentBuilderScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const userMessage = prompt;
    setMessages([{ role: 'user', text: userMessage }]);
    setPrompt('');
    setLoading(true);
    setWorkout(null);
    
    try {
      const API_KEY = CONFIG.GEMINI_API_KEY;
      if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        alert("Please add your Gemini API Key in src/config.ts!");
        setLoading(false);
        return;
      }
      
      const allEx = await db.getAllAsync<{name: string}>('SELECT name FROM exercises');
      const validNames = allEx.map(e => e.name).join(', ');

      const systemInstruction = `
        You are an elite, highly professional personal trainer and fitness coach for the GymX mobile app.
        You possess deep, scientifically-backed knowledge of biomechanics, muscle hypertrophy, and strength training.
        The user will provide their available time, equipment, and goals. 
        Your job is to design the absolute best workout plan for them.
        
        CRITICAL RULES:
        1. NO CHAT. NEVER explain yourself or write conversational text.
        2. ONLY ask questions IF the user provides zero information about their goals, time, or equipment. In that rare case, return a JSON with a single "chat_response" field asking for clarification.
        3. Otherwise, IMMEDIATELY generate the workout plan as a raw JSON object.
        4. The JSON must match this structure exactly:
        {
          "title": "A catchy, professional title for the workout",
          "description": "Short motivational description detailing the focus of the workout",
          "exercises": [
            {
              "search_query": "The STRICT, EXACT name of the exercise. YOU MUST CHOOSE EXCLUSIVELY FROM THE PROVIDED LIST OF VALID EXERCISES BELOW.",
              "sets": 3,
              "reps": "10-12",
              "rest_seconds": 60,
              "duration_seconds": 0
            }
          ]
        }
        5. CRITICAL: You MUST return exactly 5 UNIQUE exercises. DO NOT repeat the same exercise twice.
        Note: If an exercise is timed (like a plank), set "reps" to "0" and provide "duration_seconds".

        VALID EXERCISES DATABASE (DO NOT USE ANY EXERCISE NOT ON THIS LIST):
        ${validNames}
      `;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemInstruction + "\\n\\nUser Request: " + userMessage }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const aiData = JSON.parse(generatedText);
      
      if (aiData.chat_response) {
        setMessages(prev => [...prev, { role: 'ai', text: aiData.chat_response }]);
        setLoading(false);
        return;
      }

      const resolvedExercises: any[] = [];
      for (const ex of aiData.exercises) {
        const terms = ex.search_query.split(' ').map((t: string) => `%${t}%`);
        let query = 'SELECT * FROM exercises WHERE ';
        let conditions = terms.map(() => '(name LIKE ? OR equipment LIKE ? OR primary_muscles LIKE ? OR secondary_muscles LIKE ? OR category LIKE ?)');
        const pickedIds = resolvedExercises.map((e: any) => e.id).filter((id: any) => id);
        if (pickedIds.length > 0) {
          query += conditions.join(' AND ') + ` AND id NOT IN (${pickedIds.map(() => '?').join(',')}) LIMIT 1`;
        } else {
          query += conditions.join(' AND ') + ' LIMIT 1';
        }

        const params = [];
        for (const term of terms) { params.push(term, term, term, term, term); }
        params.push(...pickedIds);

        const match = await db.getFirstAsync<any>(query, ...params);
        
        resolvedExercises.push({
          sets: 3,
          reps: "10-12",
          rest_seconds: 60,
          duration_seconds: 0,
          ...ex,
          ...match,
          name: match ? match.name : ex.search_query
        });
      }

      const builtWorkout = { ...aiData, exercises: resolvedExercises };
      setWorkout(builtWorkout);
      setMessages(prev => [...prev, { role: 'ai', text: builtWorkout.description }]);
      
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate workout.');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!workout) return;
    try {
      await db.runAsync(
        'INSERT INTO saved_plans (title, description, exercises_json) VALUES (?, ?, ?)',
        [workout.title, workout.description, JSON.stringify(workout.exercises)]
      );
      Alert.alert(
        "Success", 
        "Plan saved to your library!",
        [{ text: "OK", onPress: () => navigation.navigate('SavedPlans') }]
      );
    } catch (e) {
      Alert.alert("Error", "Could not save plan.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={90} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {messages.map((msg, idx) => (
          <View key={idx} style={[styles.bubbleWrapper, msg.role === 'user' ? styles.userBubbleWrapper : styles.aiBubbleWrapper]}>
            {msg.role === 'ai' && (
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={18} color={theme.colors.primary} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userBubbleText : styles.aiBubbleText]}>{msg.text}</Text>
              
              {msg.role === 'ai' && workout && (
                <View style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="fitness-center" size={16} color={theme.colors.primary} />
                      <Text style={styles.planTitle}>{workout.title}</Text>
                    </View>
                  </View>
                  <View style={styles.planTable}>
                    <View style={styles.tableRowHeader}>
                      <Text style={[styles.th, { flex: 3 }]}>EXERCISE</Text>
                      <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>SETSxREPS</Text>
                    </View>
                    {workout.exercises.map((ex: any, i: number) => (
                      <View key={i} style={styles.tableRow}>
                        <Text style={[styles.td, { flex: 3, fontFamily: theme.typography.headlineMd.fontFamily, color: theme.colors.primary }]}>{ex.name}</Text>
                        <Text style={[styles.td, { flex: 1, textAlign: 'right', fontFamily: theme.typography.labelMd.fontFamily }]}>
                           {ex.sets} x {ex.reps === "0" || ex.reps === 0 ? `${ex.duration_seconds}s` : ex.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.planActions}>
                    <Pressable style={styles.applyBtn} onPress={savePlan}>
                      <Text style={styles.applyBtnText}>Save Plan</Text>
                    </Pressable>
                    <Pressable style={styles.startBtn} onPress={() => navigation.navigate('ActiveSession', { workout })}>
                      <Text style={styles.startBtnText}>Start Now</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.aiBubbleWrapper}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="smart-toy" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.aiBubble}>
               <ActivityIndicator color={theme.colors.primary} size="large" />
               <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: theme.colors.primary, textAlign: 'center', marginTop: 8, letterSpacing: 1.5 }}>BUILDING...</Text>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Instruct the builder..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={handleGenerate}
        />
        <Pressable style={styles.sendBtn} onPress={handleGenerate} disabled={loading}>
          <MaterialIcons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary }, // Ink background
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  bubbleWrapper: { flexDirection: 'row', width: '100%' },
  userBubbleWrapper: { justifyContent: 'flex-end' },
  aiBubbleWrapper: { justifyContent: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.onPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 4 },
  aiAvatarIcon: { fontSize: 16 },
  bubble: { padding: 16, borderRadius: 16, maxWidth: '85%' },
  userBubble: { backgroundColor: theme.colors.accentFocus, borderTopRightRadius: 4 },
  aiBubble: { backgroundColor: theme.colors.onPrimary, borderTopLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.borderSubtle },
  bubbleText: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16 },
  userBubbleText: { color: '#fff' }, // Linen text
  aiBubbleText: { color: theme.colors.primary }, // Ink text
  planCard: { backgroundColor: '#F8F5F0', borderWidth: 1, borderColor: '#d6cfc7', borderRadius: 8, padding: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  planHeader: { borderBottomWidth: 1, borderColor: '#d6cfc7', paddingBottom: 8, marginBottom: 16 },
  planTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary },
  planTable: { marginBottom: 16 },
  tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EAE3DB', paddingBottom: 8, marginBottom: 8 },
  th: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 10, color: '#736A62', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EAE3DB' },
  td: { fontSize: 14, color: theme.colors.primary },
  planActions: { flexDirection: 'row', gap: 8 },
  applyBtn: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  applyBtnText: { color: theme.colors.onPrimary, fontFamily: theme.typography.labelMd.fontFamily, fontSize: 13 },
  startBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.primary, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  startBtnText: { color: theme.colors.primary, fontFamily: theme.typography.labelMd.fontFamily, fontSize: 13 },
  inputArea: { padding: 16, backgroundColor: theme.colors.primary, borderTopWidth: 1, borderColor: '#3A332C', flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: '#1F1B18', borderWidth: 1, borderColor: '#3A332C', color: theme.colors.onPrimary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accentFocus, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 18 }
});
