import { loadShielded } from '../napi.js'
import type { ShieldedProtocol } from '../napi.js'

/**
 * Provider for this package's own proving NAPI surface. There is no dpp here:
 * the shielded module is completely independent.
 */
class ShieldedProvider {
  private static instance?: ShieldedProvider
  private _shielded: ShieldedProtocol | null = null

  private constructor () {}

  static getInstance (): ShieldedProvider {
    if (ShieldedProvider.instance == null) {
      ShieldedProvider.instance = new ShieldedProvider()
    }

    return ShieldedProvider.instance
  }

  get hasShielded (): boolean {
    return this._shielded != null
  }

  get shielded (): ShieldedProtocol {
    if (this._shielded == null) {
      this._shielded = loadShielded()
    }

    return this._shielded
  }
}

export const shieldedProvider = ShieldedProvider.getInstance()