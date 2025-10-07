/**
 * 🔗 PROTOGX NETWORK - MultiversX Smart Contracts Integration
 * 
 * Optimized for testnet deployment with free tier gas management
 */

import {
  ApiNetworkProvider,
  SmartContract,
  Address,
  Account,
  Transaction,
  TransactionPayload,
  GasLimit,
  NetworkConfig,
  TokenTransfer,
  U64Value,
  StringValue,
  AddressValue,
  BytesValue,
  BigUIntValue
} from '@multiversx/sdk-core'
import { UserSigner, UserWallet } from '@multiversx/sdk-wallet'

// =============================================================================
// ⚙️ Configuration & Constants
// =============================================================================

const NETWORK_CONFIG = {
  testnet: {
    api: 'https://testnet-api.multiversx.com',
    gateway: 'https://testnet-gateway.multiversx.com',
    explorer: 'https://testnet-explorer.multiversx.com',
    chainId: 'T'
  },
  devnet: {
    api: 'https://devnet-api.multiversx.com', 
    gateway: 'https://devnet-gateway.multiversx.com',
    explorer: 'https://devnet-explorer.multiversx.com',
    chainId: 'D'
  }
}

// Contract addresses (to be filled after deployment)
const CONTRACT_ADDRESSES = {
  GAME_LOGIC: process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS || '',
  NFT_REWARDS: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
  TOKEN_ECONOMICS: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || ''
}

// Gas limits for different operations (optimized for low cost)
const GAS_LIMITS = {
  DEPLOY_CONTRACT: 60_000_000,
  CREATE_GAME: 5_000_000,
  JOIN_GAME: 3_000_000,
  SUBMIT_SCORE: 4_000_000,
  MINT_NFT: 8_000_000,
  CLAIM_REWARDS: 6_000_000,
  UPDATE_LEADERBOARD: 4_000_000
}

// =============================================================================
// 🏗️ MultiversX Service Manager
// =============================================================================

export class MultiversXService {
  private provider: ApiNetworkProvider
  private networkConfig: NetworkConfig
  private contracts: Map<string, SmartContract> = new Map()
  
  constructor(network: 'testnet' | 'devnet' = 'testnet') {
    const config = NETWORK_CONFIG[network]
    this.provider = new ApiNetworkProvider(config.api)
    this.networkConfig = NetworkConfig.getDefault().setChainID(config.chainId)
  }

  /**
   * Initialize smart contracts
   */
  async initializeContracts(): Promise<void> {
    try {
      // Game Logic Contract
      if (CONTRACT_ADDRESSES.GAME_LOGIC) {
        const gameContract = new SmartContract({
          address: new Address(CONTRACT_ADDRESSES.GAME_LOGIC)
        })
        this.contracts.set('GAME_LOGIC', gameContract)
      }

      // NFT Rewards Contract  
      if (CONTRACT_ADDRESSES.NFT_REWARDS) {
        const nftContract = new SmartContract({
          address: new Address(CONTRACT_ADDRESSES.NFT_REWARDS)
        })
        this.contracts.set('NFT_REWARDS', nftContract)
      }

      // Token Economics Contract
      if (CONTRACT_ADDRESSES.TOKEN_ECONOMICS) {
        const tokenContract = new SmartContract({
          address: new Address(CONTRACT_ADDRESSES.TOKEN_ECONOMICS)
        })
        this.contracts.set('TOKEN_ECONOMICS', tokenContract)
      }

      console.log('✅ MultiversX contracts initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error)
      throw new Error(`Contract initialization failed: ${error}`)
    }
  }

  /**
   * Get contract instance by name
   */
  getContract(name: keyof typeof CONTRACT_ADDRESSES): SmartContract | null {
    return this.contracts.get(name) || null
  }

  /**
   * Create a new game session on-chain
   */
  async createGameSession(
    userAddress: string,
    gameType: string,
    maxPlayers: number,
    entryFee: number = 0
  ): Promise<string> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    const transaction = contract.methods
      .createGame([
        new StringValue(gameType),
        new U64Value(maxPlayers),
        new BigUIntValue(entryFee * Math.pow(10, 18)) // Convert to wei
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(new GasLimit(GAS_LIMITS.CREATE_GAME))
      .withChainID(this.networkConfig.ChainID)
      .buildTransaction()

    const txHash = await this.provider.sendTransaction(transaction)
    return txHash.getHash().toString()
  }

  /**
   * Join existing game session
   */
  async joinGameSession(
    userAddress: string,
    gameId: string,
    entryFee: number = 0
  ): Promise<string> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    let transaction = contract.methods
      .joinGame([new StringValue(gameId)])
      .withSender(new Address(userAddress))
      .withGasLimit(new GasLimit(GAS_LIMITS.JOIN_GAME))
      .withChainID(this.networkConfig.ChainID)

    // Add entry fee if required
    if (entryFee > 0) {
      transaction = transaction.withValue(TokenTransfer.egldFromAmount(entryFee))
    }

    const tx = transaction.buildTransaction()
    const txHash = await this.provider.sendTransaction(tx)
    return txHash.getHash().toString()
  }

  /**
   * Submit game score and results
   */
  async submitGameScore(
    userAddress: string,
    gameId: string,
    score: number,
    movesData: any[] = []
  ): Promise<string> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    const transaction = contract.methods
      .submitScore([
        new StringValue(gameId),
        new U64Value(score),
        new BytesValue(Buffer.from(JSON.stringify(movesData)))
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(new GasLimit(GAS_LIMITS.SUBMIT_SCORE))
      .withChainID(this.networkConfig.ChainID)
      .buildTransaction()

    const txHash = await this.provider.sendTransaction(transaction)
    return txHash.getHash().toString()
  }

  /**
   * Mint NFT reward for game achievement
   */
  async mintNFTReward(
    userAddress: string,
    gameType: string,
    achievement: string,
    metadataURI: string
  ): Promise<string> {
    const contract = this.getContract('NFT_REWARDS')
    if (!contract) throw new Error('NFT contract not initialized')

    const transaction = contract.methods
      .mintReward([
        new AddressValue(new Address(userAddress)),
        new StringValue(gameType),
        new StringValue(achievement), 
        new StringValue(metadataURI)
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(new GasLimit(GAS_LIMITS.MINT_NFT))
      .withChainID(this.networkConfig.ChainID)
      .buildTransaction()

    const txHash = await this.provider.sendTransaction(transaction)
    return txHash.getHash().toString()
  }

  /**
   * Get user's game statistics from blockchain
   */
  async getUserStats(userAddress: string): Promise<any> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    const query = contract.createQuery({
      func: 'getUserStats',
      args: [new AddressValue(new Address(userAddress))]
    })

    const response = await this.provider.queryContract(query)
    return response.returnData
  }

  /**
   * Get active games list
   */
  async getActiveGames(): Promise<any[]> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    const query = contract.createQuery({
      func: 'getActiveGames',
      args: []
    })

    const response = await this.provider.queryContract(query)
    return response.returnData || []
  }

  /**
   * Get user's NFT collection
   */
  async getUserNFTs(userAddress: string): Promise<any[]> {
    const contract = this.getContract('NFT_REWARDS')
    if (!contract) throw new Error('NFT contract not initialized')

    const query = contract.createQuery({
      func: 'getUserNFTs',
      args: [new AddressValue(new Address(userAddress))]
    })

    const response = await this.provider.queryContract(query)
    return response.returnData || []
  }

  /**
   * Get leaderboard for specific game type
   */
  async getLeaderboard(gameType: string, limit: number = 10): Promise<any[]> {
    const contract = this.getContract('GAME_LOGIC')
    if (!contract) throw new Error('Game contract not initialized')

    const query = contract.createQuery({
      func: 'getLeaderboard',
      args: [
        new StringValue(gameType),
        new U64Value(limit)
      ]
    })

    const response = await this.provider.queryContract(query)
    return response.returnData || []
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(
    operation: keyof typeof GAS_LIMITS
  ): Promise<{ gasLimit: number; estimatedCost: string }> {
    const gasLimit = GAS_LIMITS[operation]
    const gasPrice = await this.provider.getNetworkConfig().then(config => config.MinGasPrice)
    const estimatedCost = (gasLimit * gasPrice / Math.pow(10, 18)).toFixed(6)
    
    return {
      gasLimit,
      estimatedCost: `${estimatedCost} EGLD`
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(txHash: string): Promise<any> {
    return await this.provider.getTransaction(txHash)
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<Account> {
    return await this.provider.getAccount(new Address(address))
  }
}

// =============================================================================
// 🎮 Game-Specific Contract Interactions
// =============================================================================

export class GameContractManager {
  constructor(private multiversx: MultiversXService) {}

  /**
   * Quantum DAO Simulator interactions
   */
  async createDAOProposal(
    userAddress: string,
    title: string,
    description: string,
    votingPeriod: number
  ): Promise<string> {
    // Implementation for DAO-specific contract calls
    return await this.multiversx.createGameSession(userAddress, 'quantum_dao', 50)
  }

  /**
   * Crypto Arbitrage game interactions
   */
  async submitArbitrageStrategy(
    userAddress: string,
    gameId: string,
    trades: any[]
  ): Promise<string> {
    return await this.multiversx.submitGameScore(userAddress, gameId, trades.length, trades)
  }

  /**
   * Syndicate Wars interactions
   */
  async makeSyndicateMove(
    userAddress: string,
    gameId: string,
    moveType: string,
    target: string
  ): Promise<string> {
    const moveData = { moveType, target, timestamp: Date.now() }
    return await this.multiversx.submitGameScore(userAddress, gameId, 1, [moveData])
  }

  /**
   * NFT Tycoon portfolio actions
   */
  async updatePortfolio(
    userAddress: string,
    gameId: string,
    assets: any[]
  ): Promise<string> {
    const portfolioValue = assets.reduce((sum, asset) => sum + asset.value, 0)
    return await this.multiversx.submitGameScore(userAddress, gameId, portfolioValue, assets)
  }
}

// =============================================================================
// 🎯 Export Singleton Instances
// =============================================================================

export const multiversxService = new MultiversXService()
export const gameContractManager = new GameContractManager(multiversxService)

// Initialize contracts on module load
if (typeof window !== 'undefined') {
  multiversxService.initializeContracts().catch(console.error)
}