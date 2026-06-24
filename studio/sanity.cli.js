import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'szr2k18n',
    dataset: 'production'
  },
  deployment: {
    appId: 'xpomsoirw3j7ki59liqkxxnh',
    autoUpdates: true,
  },
})
