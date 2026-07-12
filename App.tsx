import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DatabaseInitializer } from './src/db/DatabaseInitializer';
import LoadingBarbell from './src/components/LoadingBarbell';
import { theme } from './src/theme';

export default function App() {
  let [fontsLoaded] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    JetBrainsMono_500Medium,
    Unbounded_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.primary }}>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName="gymx.db" assetSource={{ assetId: require('./assets/gymx.db') }}>
      <DatabaseInitializer>
        <AppNavigator />
        <StatusBar style="auto" />
      </DatabaseInitializer>
    </SQLiteProvider>
  );
}
