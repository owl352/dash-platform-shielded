import { dpp as dppNapi } from 'pshenmic-dpp'
import type { DashPlatformProtocol } from 'pshenmic-dpp'
import { loadShielded } from '../napi.js'
import type { ShieldedProtocol } from '../napi.js'

class DppProvider {
  private static instance?: DppProvider
  private _shielded: ShieldedProtocol | null = null

  private constructor () {}

  static getInstance (): DppProvider {
    if (DppProvider.instance == null) {
      DppProvider.instance = new DppProvider()
    }

    return DppProvider.instance
  }

  get dpp (): DashPlatformProtocol {
    return dppNapi as unknown as DashPlatformProtocol
  }

  get hasShielded (): boolean {
    return this._shielded != null
  }

  /**
   * The proving (Orchard/Halo 2) NAPI surface owned by this package. Loaded on
   * first access so the lazy entry stays deferred.
   */
  get shielded (): ShieldedProtocol {
    if (this._shielded == null) {
      this._shielded = loadShielded()
    }

    return this._shielded
  }
}

export const dppProvider = DppProvider.getInstance()