import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;
type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Circular glowing icon badge — the small recurring visual accent used across every screen's cards. */
export function IconBadge({
  name,
  set = 'ionicons',
  size = 40,
  color = colors.primary,
}: {
  name: IoniconName | MCIName;
  set?: 'ionicons' | 'mci';
  size?: number;
  color?: string;
}) {
  const iconSize = size * 0.52;
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          shadowColor: color,
        },
      ]}
    >
      {set === 'mci' ? (
        <MaterialCommunityIcons name={name as MCIName} size={iconSize} color={color} />
      ) : (
        <Ionicons name={name as IoniconName} size={iconSize} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
