use alloy_sol_types::sol;

mod project;
mod transformations;
mod layer;

pub use project::ImageProject;
pub use transformations::*;
pub use layer::Layer;

#[cfg(feature = "wasm")]
pub mod wasm;

sol! {
    struct ImageProofPublicValues {
        bytes32 original_image_hash;
        bytes32 transformed_image_hash;
        bytes32 signer_public_key;
        bool has_signature;
    }
}