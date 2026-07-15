import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import LoadingBarbell from '../components/LoadingBarbell';
import { theme } from '../theme';

export function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupDb() {
      try {
        // Create table for saved workout plans
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS saved_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            exercises_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create table for scheduling workouts to days of the week (0=Sun, 1=Mon, ..., 6=Sat)
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS scheduled_workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER,
            day_of_week INTEGER,
            is_completed BOOLEAN DEFAULT 0,
            completed_at DATETIME,
            FOREIGN KEY(plan_id) REFERENCES saved_plans(id)
          );
        `);

        // Create table to persist the AI chat session state
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS ai_chat_session (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            messages_json TEXT,
            workout_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        setIsReady(true);
      } catch (e) {
        console.error("Failed to initialize local DB extensions:", e);
      }
    }

    setupDb();
  }, [db]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.primary }}>Preparing Database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
