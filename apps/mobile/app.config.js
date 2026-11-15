const fs = require('fs')
const path = require('path')
const { withEntitlementsPlist } = require('expo/config-plugins')

// Local development switches, all off unless their env var is set. Release
// builds (EAS) never set them, so they always use app.json as is.
//
// EXPO_GO_ANON=1: lets Expo Go open the project without an Expo login by
// dropping the EAS owner/projectId.
//
// DONDETA_DEVICE_TEAM=<Apple team id>: install on your own iPhone with a free
// (personal) Apple team. The production bundle id belongs to the publishing
// team, so this uses DONDETA_DEVICE_BUNDLE_ID (default
// com.jonatanmaria.dondeta.dev), and drops the push-notification entitlement,
// which free teams can't sign. Push alerts don't work in that build.
//
// Android push (FCM v1) needs the Firebase google-services.json. It is used
// only when present: GOOGLE_SERVICES_JSON (an EAS "file" environment
// variable, the recommended way) or apps/mobile/google-services.json. Without
// it the app builds fine, just without push on Android. See docs/MOBILE.md.
module.exports = ({ config }) => {
  let result = config

  const googleServices = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined)
  if (googleServices) {
    result = { ...result, android: { ...result.android, googleServicesFile: googleServices } }
  }

  if (process.env.EXPO_GO_ANON === '1') {
    const { owner, ...rest } = result
    const extra = { ...rest.extra }
    delete extra.eas
    result = { ...rest, extra }
  }

  const team = process.env.DONDETA_DEVICE_TEAM
  if (team) {
    result = {
      ...result,
      ios: {
        ...result.ios,
        appleTeamId: team,
        bundleIdentifier: process.env.DONDETA_DEVICE_BUNDLE_ID || 'com.jonatanmaria.dondeta.dev',
      },
    }
    result = withEntitlementsPlist(result, cfg => {
      delete cfg.modResults['aps-environment']
      return cfg
    })
  }

  return result
}
