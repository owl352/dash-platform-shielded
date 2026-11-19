use drive::drive::Drive;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

use super::{parse_platform_version, parse_token_id};

#[napi(js_name = "VerifiedMostRecentShieldedAnchorNAPI")]
pub struct VerifiedMostRecentShieldedAnchorNAPI {
    pub root_hash: Uint8Array,
    pub anchor: Option<Uint8Array>,
}

#[napi(js_name = "verifyMostRecentShieldedAnchorProof")]
pub fn verify_most_recent_shielded_anchor(
    proof: Uint8Array,
    verify_subset_of_proof: bool,
    js_platform_version: u32,
    js_token_id: Option<Uint8Array>,
) -> Result<VerifiedMostRecentShieldedAnchorNAPI, napi::Error> {
    let platform_version = parse_platform_version(js_platform_version)?;
    let token_id = parse_token_id(js_token_id)?;

    // `tokenId` selects that token's shielded pool; without it the credits pool.
    let (root_hash, anchor) = match token_id {
        Some(token_id) => Drive::verify_most_recent_token_shielded_pool_anchor(
            &proof,
            token_id,
            verify_subset_of_proof,
            &platform_version,
        ),
        None => Drive::verify_most_recent_shielded_anchor(
            &proof,
            verify_subset_of_proof,
            &platform_version,
        ),
    }
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?;

    Ok(VerifiedMostRecentShieldedAnchorNAPI {
        root_hash: root_hash.into(),
        anchor: anchor.map(|a| a.to_vec().into()),
    })
}