import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';

/**
 * Full-screen atmosphere used behind every screen: base gradient + the same
 * faint cyberpunk grid pattern from the original Stitch mockup's HUD map
 * viewport, plus two soft ambient glow blobs (volt green / hyper orange).
 */
export function HudGridBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[colors.canvas, colors.background, colors.canvas]} style={StyleSheet.absoluteFill} />

      <Svg style={StyleSheet.absoluteFill} opacity={0.35}>
        <Defs>
          <Pattern id="hud-grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M 28 0 L 0 0 0 28" fill="none" stroke={colors.primary} strokeWidth={0.5} opacity={0.25} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hud-grid)" />
      </Svg>

      <View style={[styles.glow, styles.glowPrimary]} />
      <View style={[styles.glow, styles.glowSecondary]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  glowPrimary: {
    top: -60,
    right: -60,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  glowSecondary: {
    bottom: -40,
    left: -80,
    backgroundColor: colors.secondary,
    opacity: 0.06,
  },
});
