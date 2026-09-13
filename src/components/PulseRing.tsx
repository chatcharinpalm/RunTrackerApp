import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Expanding radar-ping ring around a status dot — the "live GPS lock" cue from the original HUD mockup. */
export function PulseRing({ color, size = 10 }: { color: string; size?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 + progress.value * 2.4 }],
  }));

  return (
    <View style={[styles.wrapper, { width: size * 3, height: size * 3 }]}>
      <Animated.View
        style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color }, ringStyle]}
      />
      <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5 },
  dot: {},
});
