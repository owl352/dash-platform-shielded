use drive::drive::Drive;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

use super::{parse_platform_version, parse_token_id};

#[napi(js_name = "VerifiedShieldedNotesCountNAPI")]
pub struct VerifiedShieldedNotesCountNAPI {
    pub root_hash: Uint8Array,
    pub count: Option<String>,
}

#[napi(js_name = "verifyShieldedNotesCountProof")]
pub fn verify_shielded_notes_count(
    proof: Uint8Array,
    verify_subset_of_proof: bool,
    js_platform_version: u32,
    js_token_id: Option<Uint8Array>,
) -> Result<VerifiedShieldedNotesCountNAPI, napi::Error> {
    let platform_version = parse_platform_version(js_platform_version)?;
    let token_id = parse_token_id(js_token_id)?;

    // `tokenId` selects that token's shielded pool; without it the credits pool.
    let (root_hash, count) = match token_id {
        Some(token_id) => Drive::verify_token_shielded_pool_notes_count(
            &proof,
            token_id,
            verify_subset_of_proof,
            &platform_version,
        ),
        None => Drive::verify_shielded_notes_count(&proof, verify_subset_of_proof, &platform_version),
    }
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?;

    Ok(VerifiedShieldedNotesCountNAPI {
        root_hash: root_hash.into(),
        count: count.map(|c| c.to_string()),
    })
}