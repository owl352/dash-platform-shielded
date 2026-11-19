// Public types. Importing does not load the proving module; construction does.
export * from '../ts/index.js'

import * as api from '../ts/index.js'
declare const shielded: typeof api
export default shielded
