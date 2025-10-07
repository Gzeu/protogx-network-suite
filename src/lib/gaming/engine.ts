/**
 * 🎮 PROTOGX NETWORK - Gaming Engine Core
 * 
 * High-performance gaming engine with AI integration and blockchain connectivity
 */

import { EventEmitter } from 'events'
import { aiManager, gameAI } from '../ai'
import { multiversxService } from '../multiversx/contracts'
import { z } from 'zod'

// =============================================================================
// 🔧 Types & Schemas
// =============================================================================

export type GameType = 'quantum_dao' | 'crypto_arbitrage' | 'syndicate_wars' | 
                      'cyber_headhunters' | 'insider_challenge' | 'regulatory_chess' |
                      'nft_tycoon' | 'social_broker' | 'escape_room' | 'proprietary_league'

export type GameStatus = 'waiting' | 'starting' | 'active' | 'paused' | 'finished' | 'cancelled'

export interface Player {
  id: string
  walletAddress: string
  username: string
  avatar?: string
  score: number
  rank: number
  isAI: boolean
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  joinedAt: Date
  lastAction: Date
}

export interface GameConfig {
  type: GameType
  title: string
  description: string
  maxPlayers: number
  minPlayers: number
  duration: number // minutes
  entryFee: number
  prizePool: number
  aiEnabled: boolean
  nftRewards: boolean
  difficulty: 1 | 2 | 3 | 4 | 5
  customSettings: Record<string, any>
}

export interface GameState {
  id: string
  config: GameConfig
  status: GameStatus
  players: Map<string, Player>
  currentTurn?: string
  turnCount: number
  startTime?: Date
  endTime?: Date
  winner?: string
  leaderboard: Player[]
  gameData: Record<string, any>
  aiInteractions: number
  blockchainTxs: string[]
}

const GameActionSchema = z.object({
  type: z.string(),
  playerId: z.string(),
  data: z.record(z.any()),
  timestamp: z.number().optional()
})

type GameAction = z.infer<typeof GameActionSchema>

// =============================================================================
// 🏗️ Core Game Engine
// =============================================================================

export class GameEngine extends EventEmitter {
  private games: Map<string, GameState> = new Map()
  private gameLoops: Map<string, NodeJS.Timeout> = new Map()
  private aiPlayers: Map<string, NodeJS.Timeout> = new Map()
  
  constructor() {
    super()
    this.setupEventHandlers()
  }

  /**
   * Create new game session
   */
  async createGame(config: GameConfig, creatorAddress: string): Promise<string> {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const gameState: GameState = {
      id: gameId,
      config,
      status: 'waiting',
      players: new Map(),
      turnCount: 0,
      leaderboard: [],
      gameData: {},
      aiInteractions: 0,
      blockchainTxs: []
    }
    
    this.games.set(gameId, gameState)
    
    // Create on-chain game session
    try {
      const txHash = await multiversxService.createGameSession(
        creatorAddress,
        config.type,
        config.maxPlayers,
        config.entryFee
      )
      gameState.blockchainTxs.push(txHash)
      console.log(`✅ Game ${gameId} created on-chain: ${txHash}`)
    } catch (error) {
      console.warn('⚠️ Failed to create on-chain session:', error)
    }
    
    this.emit('gameCreated', { gameId, config, creatorAddress })
    return gameId
  }

  /**
   * Add player to game
   */
  async joinGame(gameId: string, playerData: Omit<Player, 'score' | 'rank' | 'joinedAt' | 'lastAction'>): Promise<boolean> {
    const game = this.games.get(gameId)
    if (!game || game.status !== 'waiting') return false
    
    if (game.players.size >= game.config.maxPlayers) return false
    if (game.players.has(playerData.id)) return false
    
    const player: Player = {
      ...playerData,
      score: 0,
      rank: game.players.size + 1,
      joinedAt: new Date(),
      lastAction: new Date()
    }
    
    game.players.set(playerData.id, player)
    
    // Join on-chain if not AI player
    if (!player.isAI) {
      try {
        const txHash = await multiversxService.joinGameSession(
          player.walletAddress,
          gameId,
          game.config.entryFee
        )
        game.blockchainTxs.push(txHash)
      } catch (error) {
        console.warn('⚠️ Failed to join on-chain:', error)
      }
    }
    
    this.emit('playerJoined', { gameId, player })
    
    // Auto-start if min players reached
    if (game.players.size >= game.config.minPlayers) {
      setTimeout(() => this.startGame(gameId), 5000) // 5 second delay
    }
    
    return true
  }

  /**
   * Start game session
   */
  async startGame(gameId: string): Promise<boolean> {
    const game = this.games.get(gameId)
    if (!game || game.status !== 'waiting') return false
    
    game.status = 'starting'
    game.startTime = new Date()
    
    // Add AI players if needed
    if (game.config.aiEnabled && game.players.size < game.config.maxPlayers) {
      await this.addAIPlayers(game)
    }
    
    game.status = 'active'
    
    // Start game loop
    this.startGameLoop(game)
    
    // Initialize AI players
    this.initializeAIPlayers(game)
    
    this.emit('gameStarted', { gameId, players: Array.from(game.players.values()) })
    return true
  }

  /**
   * Process game action
   */
  async processAction(gameId: string, action: GameAction): Promise<boolean> {
    const game = this.games.get(gameId)
    if (!game || game.status !== 'active') return false
    
    // Validate action
    try {
      GameActionSchema.parse(action)
    } catch (error) {
      console.error('Invalid game action:', error)
      return false
    }
    
    const player = game.players.get(action.playerId)
    if (!player) return false
    
    // Update player last action
    player.lastAction = new Date()
    
    // Process action based on game type
    const success = await this.processGameSpecificAction(game, action)
    
    if (success) {
      game.turnCount++
      this.updateLeaderboard(game)
      this.emit('actionProcessed', { gameId, action, turnCount: game.turnCount })
      
      // Check win conditions
      this.checkWinConditions(game)
    }
    
    return success
  }

  /**
   * Process game-specific actions
   */
  private async processGameSpecificAction(game: GameState, action: GameAction): Promise<boolean> {
    switch (game.config.type) {
      case 'quantum_dao':
        return this.processDAOAction(game, action)
      case 'crypto_arbitrage':
        return this.processArbitrageAction(game, action)
      case 'syndicate_wars':
        return this.processSyndicateAction(game, action)
      case 'nft_tycoon':
        return this.processTycoonAction(game, action)
      default:
        return this.processGenericAction(game, action)
    }
  }

  /**
   * DAO-specific action processing
   */
  private async processDAOAction(game: GameState, action: GameAction): Promise<boolean> {
    const player = game.players.get(action.playerId)!
    
    switch (action.type) {
      case 'propose':
        const proposalScore = this.calculateDAOProposalScore(action.data)
        player.score += proposalScore
        game.gameData.proposals = game.gameData.proposals || []
        game.gameData.proposals.push({ ...action.data, score: proposalScore, author: action.playerId })
        return true
        
      case 'vote':
        const voteWeight = this.calculateVoteWeight(action.data, player)
        player.score += voteWeight
        game.gameData.votes = game.gameData.votes || {}
        game.gameData.votes[action.data.proposalId] = game.gameData.votes[action.data.proposalId] || []
        game.gameData.votes[action.data.proposalId].push({ 
          voter: action.playerId, 
          choice: action.data.choice,
          weight: voteWeight 
        })
        return true
        
      default:
        return false
    }
  }

  /**
   * Arbitrage-specific action processing
   */
  private async processArbitrageAction(game: GameState, action: GameAction): Promise<boolean> {
    const player = game.players.get(action.playerId)!
    
    switch (action.type) {
      case 'trade':
        const profit = this.calculateArbitrageProfit(action.data)
        player.score += profit
        game.gameData.trades = game.gameData.trades || []
        game.gameData.trades.push({ ...action.data, profit, trader: action.playerId })
        return true
        
      case 'spot_opportunity':
        const opportunityScore = this.calculateOpportunityScore(action.data)
        player.score += opportunityScore
        return true
        
      default:
        return false
    }
  }

  /**
   * Syndicate Wars action processing
   */
  private async processSyndicateAction(game: GameState, action: GameAction): Promise<boolean> {
    const player = game.players.get(action.playerId)!
    
    switch (action.type) {
      case 'attack':
        const target = game.players.get(action.data.targetId)
        if (!target) return false
        
        const damage = this.calculateAttackDamage(action.data, player, target)
        target.score = Math.max(0, target.score - damage)
        player.score += Math.floor(damage * 0.1) // 10% of damage as points
        
        game.gameData.battles = game.gameData.battles || []
        game.gameData.battles.push({ 
          attacker: action.playerId, 
          target: action.data.targetId, 
          damage,
          timestamp: Date.now()
        })
        return true
        
      case 'defend':
        player.gameData = player.gameData || {}
        player.gameData.defending = true
        player.gameData.defenseBonus = 1.5
        return true
        
      default:
        return false
    }
  }

  /**
   * NFT Tycoon action processing
   */
  private async processTycoonAction(game: GameState, action: GameAction): Promise<boolean> {
    const player = game.players.get(action.playerId)!
    
    switch (action.type) {
      case 'buy_nft':
        const purchaseValue = this.calculateNFTValue(action.data)
        player.score += purchaseValue
        
        player.gameData = player.gameData || {}
        player.gameData.portfolio = player.gameData.portfolio || []
        player.gameData.portfolio.push({ ...action.data, purchaseValue, timestamp: Date.now() })
        return true
        
      case 'sell_nft':
        const saleProfit = this.calculateSaleProfit(action.data, player)
        player.score += saleProfit
        return true
        
      default:
        return false
    }
  }

  /**
   * Generic action processing
   */
  private async processGenericAction(game: GameState, action: GameAction): Promise<boolean> {
    const player = game.players.get(action.playerId)!
    const baseScore = Math.floor(Math.random() * 100) + 50
    player.score += baseScore
    return true
  }

  // =============================================================================
  // 🤖 AI Player Management
  // =============================================================================

  /**
   * Add AI players to fill game
   */
  private async addAIPlayers(game: GameState): Promise<void> {
    const aiCount = Math.min(
      game.config.maxPlayers - game.players.size,
      Math.floor(game.config.maxPlayers * 0.3) // Max 30% AI players
    )
    
    for (let i = 0; i < aiCount; i++) {
      const aiPlayer: Player = {
        id: `ai_${Date.now()}_${i}`,
        walletAddress: '',
        username: `AI_Agent_${i + 1}`,
        avatar: '/avatars/ai-bot.png',
        score: 0,
        rank: game.players.size + 1,
        isAI: true,
        aiDifficulty: this.getRandomAIDifficulty(),
        joinedAt: new Date(),
        lastAction: new Date()
      }
      
      game.players.set(aiPlayer.id, aiPlayer)
    }
  }

  /**
   * Initialize AI player behaviors
   */
  private initializeAIPlayers(game: GameState): void {
    for (const player of game.players.values()) {
      if (player.isAI) {
        this.startAIPlayerLoop(game, player)
      }
    }
  }

  /**
   * Start AI player decision loop
   */
  private startAIPlayerLoop(game: GameState, aiPlayer: Player): void {
    const interval = this.getAIActionInterval(aiPlayer.aiDifficulty!)
    
    const aiLoop = setInterval(async () => {
      if (game.status !== 'active') {
        clearInterval(aiLoop)
        return
      }
      
      try {
        const action = await this.generateAIAction(game, aiPlayer)
        if (action) {
          await this.processAction(game.id, action)
        }
      } catch (error) {
        console.error('AI action failed:', error)
      }
    }, interval)
    
    this.aiPlayers.set(aiPlayer.id, aiLoop)
  }

  /**
   * Generate AI action using AI services
   */
  private async generateAIAction(game: GameState, aiPlayer: Player): Promise<GameAction | null> {
    try {
      const gameContext = this.buildGameContext(game, aiPlayer)
      const aiResponse = await gameAI.generateDAOAdvice(
        `Generate next action for ${game.config.type}`,
        gameContext
      )
      
      game.aiInteractions++
      
      // Parse AI response into game action
      return this.parseAIResponseToAction(aiResponse.content, game, aiPlayer)
    } catch (error) {
      console.error('AI generation failed:', error)
      return this.generateRandomAction(game, aiPlayer)
    }
  }

  // =============================================================================
  // ⚙️ Utility Methods
  // =============================================================================

  private setupEventHandlers(): void {
    this.on('gameFinished', async ({ gameId, winner }) => {
      await this.finalizeGame(gameId, winner)
    })
  }

  private startGameLoop(game: GameState): void {
    const loop = setInterval(() => {
      if (game.status !== 'active') {
        clearInterval(loop)
        return
      }
      
      // Check game duration
      if (game.startTime) {
        const elapsed = Date.now() - game.startTime.getTime()
        const duration = game.config.duration * 60 * 1000
        
        if (elapsed >= duration) {
          this.endGame(game.id, 'timeout')
        }
      }
      
      // Update game state every second
      this.emit('gameUpdate', { gameId: game.id, status: game.status })
    }, 1000)
    
    this.gameLoops.set(game.id, loop)
  }

  private updateLeaderboard(game: GameState): void {
    game.leaderboard = Array.from(game.players.values())
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({ ...player, rank: index + 1 }))
  }

  private checkWinConditions(game: GameState): void {
    // Implementation depends on game type
    const leader = game.leaderboard[0]
    if (leader && leader.score >= this.getWinThreshold(game.config.type)) {
      this.endGame(game.id, 'victory', leader.id)
    }
  }

  private async endGame(gameId: string, reason: string, winnerId?: string): Promise<void> {
    const game = this.games.get(gameId)
    if (!game) return
    
    game.status = 'finished'
    game.endTime = new Date()
    game.winner = winnerId
    
    // Clean up loops
    const gameLoop = this.gameLoops.get(gameId)
    if (gameLoop) {
      clearInterval(gameLoop)
      this.gameLoops.delete(gameId)
    }
    
    // Clean up AI loops
    for (const player of game.players.values()) {
      if (player.isAI) {
        const aiLoop = this.aiPlayers.get(player.id)
        if (aiLoop) {
          clearInterval(aiLoop)
          this.aiPlayers.delete(player.id)
        }
      }
    }
    
    this.emit('gameFinished', { gameId, reason, winner: winnerId, leaderboard: game.leaderboard })
  }

  private async finalizeGame(gameId: string, winnerId?: string): Promise<void> {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Submit final scores to blockchain
    for (const player of game.players.values()) {
      if (!player.isAI) {
        try {
          const txHash = await multiversxService.submitGameScore(
            player.walletAddress,
            gameId,
            player.score
          )
          game.blockchainTxs.push(txHash)
        } catch (error) {
          console.warn('Failed to submit score on-chain:', error)
        }
      }
    }
    
    // Mint NFT rewards
    if (game.config.nftRewards && winnerId) {
      const winner = game.players.get(winnerId)
      if (winner && !winner.isAI) {
        try {
          const txHash = await multiversxService.mintNFTReward(
            winner.walletAddress,
            game.config.type,
            'winner',
            `ipfs://winner-${game.config.type}-${gameId}`
          )
          game.blockchainTxs.push(txHash)
        } catch (error) {
          console.warn('Failed to mint NFT reward:', error)
        }
      }
    }
  }

  // Game calculation methods
  private calculateDAOProposalScore(data: any): number {
    return Math.floor(Math.random() * 200) + 100
  }

  private calculateVoteWeight(data: any, player: Player): number {
    return Math.floor(Math.random() * 50) + 25
  }

  private calculateArbitrageProfit(data: any): number {
    return Math.floor(Math.random() * 500) + 100
  }

  private calculateOpportunityScore(data: any): number {
    return Math.floor(Math.random() * 150) + 50
  }

  private calculateAttackDamage(data: any, attacker: Player, target: Player): number {
    return Math.floor(Math.random() * 100) + 50
  }

  private calculateNFTValue(data: any): number {
    return Math.floor(Math.random() * 300) + 200
  }

  private calculateSaleProfit(data: any, player: Player): number {
    return Math.floor(Math.random() * 400) + 100
  }

  private getRandomAIDifficulty(): 'easy' | 'medium' | 'hard' | 'expert' {
    const difficulties = ['easy', 'medium', 'hard', 'expert']
    return difficulties[Math.floor(Math.random() * difficulties.length)] as any
  }

  private getAIActionInterval(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 8000   // 8 seconds
      case 'medium': return 5000 // 5 seconds
      case 'hard': return 3000   // 3 seconds
      case 'expert': return 2000 // 2 seconds
      default: return 5000
    }
  }

  private buildGameContext(game: GameState, player: Player): string {
    return JSON.stringify({
      gameType: game.config.type,
      currentScore: player.score,
      rank: player.rank,
      turnCount: game.turnCount,
      playersCount: game.players.size,
      gameData: game.gameData
    })
  }

  private parseAIResponseToAction(response: string, game: GameState, aiPlayer: Player): GameAction {
    // Simple parsing - in production, use more sophisticated NLP
    return {
      type: 'ai_action',
      playerId: aiPlayer.id,
      data: { response, timestamp: Date.now() }
    }
  }

  private generateRandomAction(game: GameState, aiPlayer: Player): GameAction {
    return {
      type: 'random_action',
      playerId: aiPlayer.id,
      data: { value: Math.random(), timestamp: Date.now() }
    }
  }

  private getWinThreshold(gameType: GameType): number {
    switch (gameType) {
      case 'quantum_dao': return 1000
      case 'crypto_arbitrage': return 5000
      case 'syndicate_wars': return 2000
      case 'nft_tycoon': return 10000
      default: return 1000
    }
  }

  // Public API methods
  public getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId)
  }

  public getAllGames(): GameState[] {
    return Array.from(this.games.values())
  }

  public getActiveGames(): GameState[] {
    return Array.from(this.games.values()).filter(game => 
      ['waiting', 'active'].includes(game.status)
    )
  }
}

// =============================================================================
// 🎯 Export Singleton Instance
// =============================================================================

export const gameEngine = new GameEngine()

// Export types
export type { GameType, GameStatus, Player, GameConfig, GameState, GameAction }