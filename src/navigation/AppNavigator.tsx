import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

import AuthScreen from '../screens/AuthScreen';
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
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'dashboard';
          if (route.name === 'Library') iconName = 'menu-book';
          else if (route.name === 'SavedPlans') iconName = 'history';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSubtle,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.labelSm.fontFamily,
          fontSize: 11,
          marginBottom: 4,
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Library" component={ExerciseLibraryScreen} options={{ title: 'Library' }} />
      <Tab.Screen name="SavedPlans" component={SavedPlansScreen} options={{ title: 'My Plans' }} />
    </Tab.Navigator>
  );
}

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
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Builder" component={AgentBuilderScreen} options={{ title: 'AI Builder' }} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LibraryModal" component={ExerciseLibraryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise Details', headerTransparent: true, headerTitle: '' }} />
        <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="RestTimer" component={RestTimerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
