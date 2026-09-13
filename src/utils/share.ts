import { Platform, Share } from 'react-native';

/**
 * react-native-web does not implement the Share module at all (Share.share
 * is undefined there), so this cross-platform wrapper is required for the
 * "Share Activity" button to work in the web preview and not just on native.
 */
export async function shareText(message: string): Promise<void> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ text: message });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(message);
      if (typeof window !== 'undefined') window.alert('Copied to clipboard');
      return;
    }
    return;
  }

  await Share.share({ message });
}
