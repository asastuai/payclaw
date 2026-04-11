use anchor_lang::prelude::*;
use crate::state::AgentWallet;

#[derive(Accounts)]
pub struct ApproveRequest<'info> {
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"wallet", wallet.owner.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key(),
    )]
    pub wallet: Account<'info, AgentWallet>,
    // TODO Phase 3: Add pending_approval account
}

pub fn handler(
    _ctx: Context<ApproveRequest>,
    _request_id: u64,
) -> Result<()> {
    msg!("approve_request() stub — not yet implemented");
    Ok(())
}
