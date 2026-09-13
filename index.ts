import { registerRootComponent } from 'expo';

// Side-effect import: registers the background location task at JS bundle
// load time, which expo-task-manager requires happen before any screen mounts.
import './src/services/backgroundLocationTask';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
