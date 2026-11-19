// dash-platform-shielded entry. Importing it does NOT load the proving module:
// construct `new DashPlatformShielded()` (or call loadShielded()) when shielded
// proving is needed. The instance is passed to the SDK explicitly.
export * from '../ts/index.js'

import * as api from '../ts/index.js'

export default { ...api }
