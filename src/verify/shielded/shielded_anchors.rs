use drive::drive::Drive;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

use super::{parse_platform_version, parse_token_id};

#[napi(js_name = "VerifiedShieldedAnchorsNAPI")]
pub struct VerifiedShieldedAnchorsNAPI {
    pub root_hash: Uint8Array,
    pub(crate) anchors: Vec<[u8; 32]>,
}

#[napi]
impl VerifiedShieldedAnchorsNAPI {
    #[napi(getter, js_name = "anchors")]
    pub fn anchors(&self) -> Vec<Uint8Array> {
        self.anchors
            .iter()
            .map(|a| Uint8Array::from(a.to_vec()))
            .collect()
    }
}

#[napi(js_name = "verifyShieldedAnchorsProof")]
pub fn verify_shielded_anchors(
    proof: Uint8Array,
    verify_subset_of_proof: bool,
    js_platform_version: u32,
    js_token_id: Option<Uint8Array>,
) -> Result<VerifiedShieldedAnchorsNAPI, napi::Error> {
    let platform_version = parse_platform_version(js_platform_version)?;
    let token_id = parse_token_id(js_token_id)?;

    // `tokenId` selects that token's shielded pool; without it the credits pool.
    let (root_hash, anchors) = match token_id {
        Some(token_id) => Drive::verify_token_shielded_pool_anchors(
            &proof,
            token_id,
            verify_subset_of_proof,
            &platform_version,
        ),
        None => Drive::verify_shielded_anchors(&proof, verify_subset_of_proof, &platform_version),
    }
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, e.to_string()))?;

    Ok(VerifiedShieldedAnchorsNAPI {
        root_hash: root_hash.into(),
        anchors,
    })
}