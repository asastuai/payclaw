use anchor_lang::prelude::*;
use crate::state::AgentWallet;

#[derive(Accounts)]
pub struct DenyRequest<'info> {
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"wallet", wallet.owner.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key(),
    )]
    pub wallet: Account<'info, AgentWallet>,
}

pub fn handler(
    _ctx: Context<DenyRequest>,
    _request_id: u64,
) -> Result<()> {
    msg!("deny_request() stub — not yet implemented");
    Ok(())
}
