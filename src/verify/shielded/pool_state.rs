use drive::drive::Drive;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

use super::{parse_platform_version, parse_token_id};

#[napi(js_name = "VerifiedShieldedPoolStateNAPI")]
pub struct VerifiedShieldedPoolStateNAPI {
    pub root_hash: Uint8Array,
    pub total_balance: Option<String>,
}

#[napi(js_name = "verifyShieldedPoolStateProof")]
pub fn verify_shielded_pool_state(
    proof: Uint8Array,
    verify_subset_of_proof: bool,
    js_platform_version: u32,
    js_token_id: Option<Uint8Array>,
) -> Result<VerifiedShieldedPoolStateNAPI, napi::Error> {
    let platform_version = parse_platform_version(js_platform_version)?;
    let token_id = parse_token_id(js_token_id)?;

    // `tokenId` selects that token's shielded pool; without it the credits pool.
    let (root_hash, total_balance) = match token_id {
        Some(token_id) => Drive::verify_token_shielded_pool_state(
            &proof,
            token_id,
            verify_subset_of_proof,
            &platform_version,
        ),
        None => {
            Drive::verify_shielded_pool_state(&proof, verify_subset_of_proof, &platform_version)
        }
    }
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?;

    Ok(VerifiedShieldedPoolStateNAPI {
        root_hash: root_hash.into(),
        total_balance: total_balance.map(|b| b.to_string()),
    })
}