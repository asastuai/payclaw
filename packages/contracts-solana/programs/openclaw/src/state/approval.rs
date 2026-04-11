use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Pending,
    Approved,
    Denied,
    Expired,
}

impl Default for RequestStatus {
    fn default() -> Self {
        Self::Pending
    }
}

#[account]
#[derive(Default)]
pub struct PendingApproval {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub to: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub memo: [u8; 32],
    pub created_at: i64,
    pub expires_at: i64,
    pub status: RequestStatus,
    pub bump: u8,
}

impl PendingApproval {
    pub const LEN: usize = 8  // discriminator
        + 32  // wallet
        + 8   // request_id
        + 32  // to
        + 32  // token_mint
        + 8   // amount
        + 32  // memo
        + 8   // created_at
        + 8   // expires_at
        + 1   // status (enum)
        + 1;  // bump
}
