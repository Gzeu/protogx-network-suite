#![no_std]

use multiversx_sc::imports::*;

/// Quantum DAO Simulator Smart Contract
/// Players participate in governance decisions and compete for the highest DAO score
#[multiversx_sc::contract]
pub trait QuantumDaoGame {
    #[init]
    fn init(&self, game_duration_blocks: u64, nft_reward_token_id: TokenIdentifier) {
        self.game_duration_blocks().set(game_duration_blocks);
        self.nft_reward_token_id().set(&nft_reward_token_id);
        self.game_start_block().set(self.blockchain().get_block_nonce());
        self.current_proposal_id().set(1u32);
    }

    /// Create a new governance proposal
    #[endpoint(createProposal)]
    fn create_proposal(
        &self,
        title: ManagedBuffer,
        description: ManagedBuffer,
        voting_duration_blocks: u64,
    ) {
        self.require_game_active();
        
        let caller = self.blockchain().get_caller();
        let proposal_id = self.current_proposal_id().get();
        let current_block = self.blockchain().get_block_nonce();
        
        let proposal = Proposal {
            id: proposal_id,
            creator: caller.clone(),
            title,
            description,
            votes_for: BigUint::zero(),
            votes_against: BigUint::zero(),
            start_block: current_block,
            end_block: current_block + voting_duration_blocks,
            executed: false,
        };
        
        self.proposals(proposal_id).set(&proposal);
        self.current_proposal_id().set(proposal_id + 1);
        
        // Reward creator with DAO points
        self.add_dao_points(&caller, 10u64);
        
        self.proposal_created_event(proposal_id, &caller, &proposal.title);
    }

    /// Vote on a proposal
    #[endpoint(vote)]
    #[payable("EGLD")]
    fn vote(&self, proposal_id: u32, vote_for: bool) {
        self.require_game_active();
        
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().egld_value().clone_value();
        
        require!(payment > 0, "Must stake EGLD to vote");
        require!(self.proposals(proposal_id).is_empty() == false, "Proposal does not exist");
        
        let mut proposal = self.proposals(proposal_id).get();
        let current_block = self.blockchain().get_block_nonce();
        
        require!(current_block >= proposal.start_block, "Voting not started");
        require!(current_block <= proposal.end_block, "Voting ended");
        require!(self.user_votes(proposal_id, &caller).is_empty(), "Already voted");
        
        // Record the vote
        let vote = Vote {
            voter: caller.clone(),
            proposal_id,
            vote_for,
            stake_amount: payment.clone(),
            block_number: current_block,
        };
        
        self.user_votes(proposal_id, &caller).set(&vote);
        
        // Update proposal vote counts
        if vote_for {
            proposal.votes_for += &payment;
        } else {
            proposal.votes_against += &payment;
        }
        
        self.proposals(proposal_id).set(&proposal);
        
        // Reward voter with DAO points based on stake
        let dao_points = (payment.clone() / BigUint::from(1_000_000_000_000_000_000u64)).to_u64().unwrap_or(1);
        self.add_dao_points(&caller, dao_points * 2); // 2x multiplier for voting
        
        self.vote_cast_event(proposal_id, &caller, vote_for, &payment);
    }

    /// Execute a proposal if it has passed
    #[endpoint(executeProposal)]
    fn execute_proposal(&self, proposal_id: u32) {
        require!(self.proposals(proposal_id).is_empty() == false, "Proposal does not exist");
        
        let mut proposal = self.proposals(proposal_id).get();
        let current_block = self.blockchain().get_block_nonce();
        
        require!(current_block > proposal.end_block, "Voting still active");
        require!(!proposal.executed, "Proposal already executed");
        
        // Check if proposal passed (more votes for than against)
        if proposal.votes_for > proposal.votes_against {
            proposal.executed = true;
            self.proposals(proposal_id).set(&proposal);
            
            // Reward proposal creator with bonus points for successful proposal
            self.add_dao_points(&proposal.creator, 50u64);
            
            self.proposal_executed_event(proposal_id, true);
        } else {
            self.proposal_executed_event(proposal_id, false);
        }
    }

    /// Claim NFT reward if player is in top 10
    #[endpoint(claimReward)]
    fn claim_nft_reward(&self) {
        self.require_game_ended();
        
        let caller = self.blockchain().get_caller();
        require!(self.nft_claimed(&caller).is_empty(), "NFT already claimed");
        
        let player_score = self.dao_scores(&caller).get();
        require!(player_score > 0, "No DAO score recorded");
        
        // Check if player is in top 10 (simplified - in production would need proper ranking)
        require!(self.is_eligible_for_reward(&caller), "Not eligible for reward");
        
        // Mint NFT reward (simplified - would use proper NFT minting)
        self.nft_claimed(&caller).set(true);
        
        self.nft_claimed_event(&caller, player_score);
    }

    // View functions
    #[view(getProposal)]
    fn get_proposal(&self, proposal_id: u32) -> Proposal<Self::Api> {
        self.proposals(proposal_id).get()
    }

    #[view(getPlayerScore)]
    fn get_player_score(&self, player: &ManagedAddress) -> u64 {
        self.dao_scores(player).get()
    }

    #[view(getLeaderboard)]
    fn get_leaderboard(&self) -> MultiValueEncoded<MultiValue2<ManagedAddress, u64>> {
        // Simplified leaderboard - in production would use proper sorting
        let mut result = MultiValueEncoded::new();
        // Implementation would iterate through all players and sort by score
        result
    }

    #[view(isGameActive)]
    fn is_game_active(&self) -> bool {
        let current_block = self.blockchain().get_block_nonce();
        let game_end = self.game_start_block().get() + self.game_duration_blocks().get();
        current_block <= game_end
    }

    // Private functions
    fn require_game_active(&self) {
        require!(self.is_game_active(), "Game has ended");
    }

    fn require_game_ended(&self) {
        require!(!self.is_game_active(), "Game is still active");
    }

    fn add_dao_points(&self, player: &ManagedAddress, points: u64) {
        let current_score = self.dao_scores(player).get();
        self.dao_scores(player).set(current_score + points);
    }

    fn is_eligible_for_reward(&self, _player: &ManagedAddress) -> bool {
        // Simplified eligibility check
        // In production, would check actual ranking
        true
    }

    // Storage
    #[storage_mapper("game_duration_blocks")]
    fn game_duration_blocks(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("game_start_block")]
    fn game_start_block(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("nft_reward_token_id")]
    fn nft_reward_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("current_proposal_id")]
    fn current_proposal_id(&self) -> SingleValueMapper<u32>;

    #[storage_mapper("proposals")]
    fn proposals(&self, proposal_id: u32) -> SingleValueMapper<Proposal<Self::Api>>;

    #[storage_mapper("dao_scores")]
    fn dao_scores(&self, player: &ManagedAddress) -> SingleValueMapper<u64>;

    #[storage_mapper("user_votes")]
    fn user_votes(
        &self,
        proposal_id: u32,
        voter: &ManagedAddress,
    ) -> SingleValueMapper<Vote<Self::Api>>;

    #[storage_mapper("nft_claimed")]
    fn nft_claimed(&self, player: &ManagedAddress) -> SingleValueMapper<bool>;

    // Events
    #[event("proposal_created")]
    fn proposal_created_event(
        &self,
        #[indexed] proposal_id: u32,
        #[indexed] creator: &ManagedAddress,
        title: &ManagedBuffer,
    );

    #[event("vote_cast")]
    fn vote_cast_event(
        &self,
        #[indexed] proposal_id: u32,
        #[indexed] voter: &ManagedAddress,
        vote_for: bool,
        stake_amount: &BigUint,
    );

    #[event("proposal_executed")]
    fn proposal_executed_event(&self, #[indexed] proposal_id: u32, passed: bool);

    #[event("nft_claimed")]
    fn nft_claimed_event(&self, #[indexed] player: &ManagedAddress, score: u64);
}

#[derive(TopEncode, TopDecode, TypeAbi, Clone, PartialEq, Eq, Debug)]
pub struct Proposal<M: ManagedTypeApi> {
    pub id: u32,
    pub creator: ManagedAddress<M>,
    pub title: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub votes_for: BigUint<M>,
    pub votes_against: BigUint<M>,
    pub start_block: u64,
    pub end_block: u64,
    pub executed: bool,
}

#[derive(TopEncode, TopDecode, TypeAbi, Clone, PartialEq, Eq, Debug)]
pub struct Vote<M: ManagedTypeApi> {
    pub voter: ManagedAddress<M>,
    pub proposal_id: u32,
    pub vote_for: bool,
    pub stake_amount: BigUint<M>,
    pub block_number: u64,
}