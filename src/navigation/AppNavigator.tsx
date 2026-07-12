import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { theme } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import AgentBuilderScreen from '../screens/AgentBuilderScreen';
import SavedPlansScreen from '../screens/SavedPlansScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import RestTimerScreen from '../screens/RestTimerScreen';
import WorkoutCompleteScreen from '../screens/WorkoutCompleteScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { fontFamily: 'Manrope_600SemiBold', color: theme.colors.primary },
          headerTintColor: theme.colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Library" component={ExerciseLibraryScreen} options={{ title: 'Exercise Library' }} />
        <Stack.Screen name="Builder" component={AgentBuilderScreen} options={{ title: 'AI Builder' }} />
        <Stack.Screen name="SavedPlans" component={SavedPlansScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Plan Details' }} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise Details', headerTransparent: true, headerTitle: '' }} />
        <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="RestTimer" component={RestTimerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
