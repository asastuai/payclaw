use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct AgentWallet {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub agent_active: bool,
    pub bump: u8,
    pub created_at: i64,
    pub total_spent_today: u64,
    pub last_reset_timestamp: i64,
    pub last_tx_timestamp: i64,
}

impl AgentWallet {
    pub const LEN: usize = 8  // discriminator
        + 32  // owner
        + 32  // agent
        + 1   // agent_active
        + 1   // bump
        + 8   // created_at
        + 8   // total_spent_today
        + 8   // last_reset_timestamp
        + 8;  // last_tx_timestamp
}
