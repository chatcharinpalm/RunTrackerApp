import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrackingScreen from '../screens/TrackingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageContext';
import type { HistoryStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

function HistoryStackNavigator() {
  const { t } = useLanguage();
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{
          headerShown: true,
          headerTitle: t('activityDetailTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
    </HistoryStack.Navigator>
  );
}

export default function RootNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Track" component={TrackingScreen} options={{ tabBarLabel: t('tabTrack') }} />
      <Tab.Screen name="History" component={HistoryStackNavigator} options={{ tabBarLabel: t('tabHistory') }} />
      <Tab.Screen name="Heatmap" component={HeatmapScreen} options={{ tabBarLabel: t('tabHeatmap') }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: t('tabStats') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tabProfile') }} />
    </Tab.Navigator>
  );
}
