import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import DuoButton from '../components/DuoButton';
import { CONFIG } from '../config';
import { useNavigation } from '@react-navigation/native';

export default function AgentBuilderScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation<any>();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);

  useEffect(() => {
    async function loadSession() {
      try {
        const row = await db.getFirstAsync<any>('SELECT * FROM ai_chat_session WHERE id = 1');
        if (row) {
          if (row.messages_json) setMessages(JSON.parse(row.messages_json));
          if (row.workout_json) setWorkout(JSON.parse(row.workout_json));
        }
        
        if (!row || !row.messages_json || JSON.parse(row.messages_json).length === 0) {
          setMessages([{ role: 'ai', text: "Hi, I'm Gymini. What do you want to train today? Let me know your available time, equipment, or focus area." }]);
        }
      } catch (e) {
        console.error("Could not load AI chat session", e);
      }
    }
    loadSession();
  }, [db]);

  useEffect(() => {
    async function saveSession() {
      try {
        await db.runAsync(
          'INSERT OR REPLACE INTO ai_chat_session (id, messages_json, workout_json) VALUES (1, ?, ?)',
          [JSON.stringify(messages), workout ? JSON.stringify(workout) : null]
        );
      } catch (e) {
        console.error("Could not save AI chat session", e);
      }
    }
    if (messages.length > 0) {
      saveSession();
    }
  }, [messages, workout, db]);

  const clearSession = () => {
    setMessages([{ role: 'ai', text: "Hi, I'm Gymini. What do you want to train today? Let me know your available time, equipment, or focus area." }]);
    setWorkout(null);
    db.runAsync('DELETE FROM ai_chat_session WHERE id = 1').catch(console.error);
  };

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
        Your job is to design the absolute best, most comprehensive workout plan for them.
        
        EXPERT EXERCISE SELECTION RULES:
        When asked to create a program for a specific muscle group, you MUST ensure that all parts/heads of that muscle are trained.
        - E.g., for Triceps, you must include exercises that target the long head, lateral head, and medial head.
        - E.g., for Chest, you must target the upper (clavicular), middle (sternal), and lower (costal) pectorals.
        - Use your elite biomechanics knowledge to ensure complete, balanced development without redundant overlapping exercises.
        
        CRITICAL FORMAT RULES:
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
        5. CRITICAL: Provide an appropriate number of UNIQUE exercises based on the user's request (e.g., if they ask for 7, give 7). If they don't specify a number, default to exactly 5 exercises. DO NOT repeat the same exercise twice.
        Note: If an exercise is timed (like a plank), set "reps" to "0" and provide "duration_seconds".

        VALID EXERCISES DATABASE (DO NOT USE ANY EXERCISE NOT ON THIS LIST):
        ${validNames}
      `;

      let aiData;

      if (CONFIG.OPENROUTER_API_KEY) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemma-4-31b-it:free",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userMessage }
            ]
          })
        });

        if (!response.ok) throw new Error(`OpenRouter API Error: ${await response.text()}`);
        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        const cleanText = jsonMatch ? jsonMatch[0] : generatedText;
        aiData = JSON.parse(cleanText);
      } else {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemInstruction + "\\n\\nUser Request: " + userMessage }] }],
            generationConfig: { responseMimeType: "application/json" }
          }),
        });

        if (!response.ok) throw new Error(`Gemini API Error: ${await response.text()}`);
        
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        aiData = JSON.parse(generatedText);
      }
      
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
        
        {messages.length > 0 && (
          <Pressable onPress={clearSession} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginBottom: 8 }}>
            <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontFamily: theme.typography.labelSm.fontFamily }}>RESET SESSION</Text>
          </Pressable>
        )}
        
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
                    <DuoButton title="Save Plan" color="surface" onPress={savePlan} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 0 }} textStyle={{ fontSize: 13 }} />
                    <View style={{ width: 12 }} />
                    <DuoButton title="Start Now" color="primary" onPress={() => navigation.navigate('ActiveSession', { workout })} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 0 }} textStyle={{ fontSize: 13 }} />
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
               <ActivityIndicator color={theme.colors.accentFocus} size="large" />
               <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: theme.colors.accentFocus, textAlign: 'center', marginTop: 8, letterSpacing: 1.5 }}>SYNTHESIZING...</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {messages.length === 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
          {["Quick 15m Core", "Full Body Strength", "Dumbbell Leg Day"].map((sug, i) => (
            <Pressable key={i} onPress={() => setPrompt(sug)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(255,179,71, 0.1)', borderRadius: 20 }}>
              <MaterialIcons name="auto-awesome" size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.labelMd.fontFamily, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{sug}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Instruct the builder..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={prompt}
          onChangeText={setPrompt}
          multiline={true}
          maxLength={500}
        />
        <Pressable style={styles.sendBtn} onPress={handleGenerate} disabled={loading}>
          <MaterialIcons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, maxWidth: 600, alignSelf: 'center', width: '100%' }, 
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  bubbleWrapper: { flexDirection: 'row', width: '100%' },
  userBubbleWrapper: { justifyContent: 'flex-end' },
  aiBubbleWrapper: { justifyContent: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 4, borderWidth: 2, borderColor: theme.colors.borderSubtle },
  aiAvatarIcon: { fontSize: 16 },
  bubble: { padding: 16, borderRadius: 16, maxWidth: '85%' },
  userBubble: { backgroundColor: theme.colors.secondary, borderTopRightRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: '#0F7BAA' },
  aiBubble: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 4, borderWidth: 2, borderBottomWidth: 4, borderColor: theme.colors.borderSubtle },
  bubbleText: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16 },
  userBubbleText: { color: theme.colors.onSecondary }, 
  aiBubbleText: { color: theme.colors.onSurface }, 
  planCard: { backgroundColor: theme.colors.surfaceMuted, borderWidth: 2, borderBottomWidth: 6, borderColor: theme.colors.borderSubtle, borderRadius: 16, padding: 16, marginTop: 16 },
  planHeader: { borderBottomWidth: 2, borderColor: theme.colors.borderSubtle, paddingBottom: 12, marginBottom: 16 },
  planTitle: { fontFamily: theme.typography.headlineMd.fontFamily, fontSize: 16, color: theme.colors.primary },
  planTable: { marginBottom: 16 },
  tableRowHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: theme.colors.borderSubtle, paddingBottom: 8, marginBottom: 8 },
  th: { fontFamily: theme.typography.labelSm.fontFamily, fontSize: 10, color: theme.colors.onSurfaceVariant, letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.colors.borderSubtle },
  td: { fontSize: 14, color: theme.colors.onSurface },
  planActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inputArea: { padding: 16, backgroundColor: theme.colors.background, borderTopWidth: 2, borderColor: theme.colors.borderSubtle, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.borderSubtle, color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 16, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderRadius: 24, minHeight: 52, maxHeight: 120 },
  sendBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderBottomWidth: 4, borderColor: '#D88D22' },
  sendBtnText: { color: theme.colors.onPrimary, fontSize: 18 }
});
