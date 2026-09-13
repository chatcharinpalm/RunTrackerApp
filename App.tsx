import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { useAppFonts } from './src/theme/useAppFonts';
import { colors } from './src/theme/theme';

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </LanguageProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
