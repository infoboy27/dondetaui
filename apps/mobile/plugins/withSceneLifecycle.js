// iOS 27 terminates apps at launch unless they adopt the UIScene life cycle
// (crash: _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
// Expo SDK 57 ships ExpoAppSceneDelegate for this, but its prebuild template
// still starts React Native from the app delegate. This plugin:
//   1. declares a single window scene handled by EXExpoAppSceneDelegate;
//   2. makes AppDelegate an ExpoReactNativeFactoryProvider and stops it from
//      creating its own window (the scene delegate creates it now).
// Remove once the Expo template does this itself.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins')

const SCENE_DELEGATE = 'EXExpoAppSceneDelegate'

function withSceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: SCENE_DELEGATE,
          },
        ],
      },
    }
    return cfg
  })
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle: expected a Swift AppDelegate')
    }
    let src = cfg.modResults.contents
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      const declaration = 'class AppDelegate: ExpoAppDelegate {'
      if (!src.includes(declaration)) {
        throw new Error('withSceneLifecycle: AppDelegate declaration not found')
      }
      src = src.replace(
        declaration,
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
      )
    }
    // The template's window + startReactNative block; the scene delegate does this.
    const windowStart =
      /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/
    src = src.replace(windowStart, '')
    if (src.includes('window = UIWindow(frame:')) {
      throw new Error('withSceneLifecycle: could not remove the AppDelegate window setup')
    }
    cfg.modResults.contents = src
    return cfg
  })
}

module.exports = function withSceneLifecycle(config) {
  return withSceneAppDelegate(withSceneManifest(config))
}
