use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Policy {
    pub wallet: Pubkey,
    pub daily_limit: u64,
    pub per_tx_limit: u64,
    pub approval_threshold: u64,
    pub swaps_enabled: bool,
    pub cooldown_seconds: u32,
    pub bump: u8,
}

impl Policy {
    pub const LEN: usize = 8  // discriminator
        + 32  // wallet
        + 8   // daily_limit
        + 8   // per_tx_limit
        + 8   // approval_threshold
        + 1   // swaps_enabled
        + 4   // cooldown_seconds
        + 1;  // bump
}
