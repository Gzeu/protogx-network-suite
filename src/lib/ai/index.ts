/**
 * 🤖 PROTOGX NETWORK - AI Services Integration
 * 
 * Centralized AI services with free tier optimization and fallback strategies
 * Supports: OpenAI, Anthropic, Google Cloud AI, IBM Watson, Local LLM (Ollama)
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// =============================================================================
// 🔧 Configuration & Types
// =============================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ibm' | 'ollama' | 'auto'

interface AIConfig {
  provider: AIProvider
  model: string
  maxTokens: number
  temperature: number
  timeout: number
}

interface AIResponse {
  content: string
  provider: AIProvider
  model: string
  tokens: number
  cost: number
  cached: boolean
}

// Request validation schema
const AIRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  context: z.string().optional(),
  gameType: z.enum(['dao', 'arbitrage', 'syndicate', 'headhunter', 'insider', 'chess', 'tycoon', 'broker', 'escape', 'league']).optional(),
  userId: z.string().optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional()
})

type AIRequest = z.infer<typeof AIRequestSchema>

// =============================================================================
// 🏗️ AI Service Manager
// =============================================================================

export class AIServiceManager {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private requestCount: Map<AIProvider, number> = new Map()
  private cache: Map<string, AIResponse> = new Map()
  private lastReset: Date = new Date()
  
  // Free tier limits (per hour)
  private readonly LIMITS = {
    openai: 50,      // $5 free credit ≈ 50 requests/hour
    anthropic: 30,   // Free tier limit
    google: 60,      // Google Cloud free tier
    ibm: 100,        // IBM Watson free tier
    ollama: 1000     // Local, no limits
  }

  constructor() {
    this.initializeProviders()
    this.resetCountersHourly()
  }

  /**
   * Initialize AI providers with environment variables
   */
  private initializeProviders(): void {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 10000,
          maxRetries: 2
        })
      }

      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeout: 10000,
          maxRetries: 2
        })
      }
    } catch (error) {
      console.error('❌ Failed to initialize AI providers:', error)
    }
  }

  /**
   * Reset request counters every hour to manage free tier limits
   */
  private resetCountersHourly(): void {
    setInterval(() => {
      const now = new Date()
      if (now.getTime() - this.lastReset.getTime() >= 3600000) { // 1 hour
        this.requestCount.clear()
        this.lastReset = now
        console.log('🔄 AI request counters reset')
      }
    }, 60000) // Check every minute
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: AIRequest, provider: AIProvider): string {
    return `${provider}:${JSON.stringify(request)}`
  }

  /**
   * Check if provider is available and within limits
   */
  private isProviderAvailable(provider: AIProvider): boolean {
    const count = this.requestCount.get(provider) || 0
    const limit = this.LIMITS[provider] || 0
    return count < limit
  }

  /**
   * Get the best available provider
   */
  private getBestProvider(): AIProvider {
    // Priority order: Local (Ollama) → OpenAI → Anthropic → Google → IBM
    const providers: AIProvider[] = ['ollama', 'openai', 'anthropic', 'google', 'ibm']
    
    for (const provider of providers) {
      if (this.isProviderAvailable(provider)) {
        return provider
      }
    }
    
    // Fallback to least used provider
    return Array.from(this.requestCount.entries())
      .sort(([,a], [,b]) => a - b)[0]?.[0] || 'ollama'
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateWithOpenAI(request: AIRequest): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI not initialized')
    
    const response = await this.openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI gaming assistant for PROTOGX NETWORK, a professional blockchain gaming platform. ${request.gameType ? `Current game: ${request.gameType}` : ''}`
        },
        {
          role: 'user',
          content: request.context ? `${request.context}\n\n${request.prompt}` : request.prompt
        }
      ],
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature || 0.7,
      stream: false
    })

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      model: response.model,
      tokens: response.usage?.total_tokens || 0,
      cost: (response.usage?.total_tokens || 0) * 0.00002, // Approx cost
      cached: false
    }
  }

  /**
   * Generate AI response using Anthropic Claude
   */
  private async generateWithAnthropic(request: AIRequest): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Anthropic not initialized')
    
    const response = await this.anthropic.messages.create({
      model: process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature || 0.7,
      system: `You are an AI gaming assistant for PROTOGX NETWORK, a professional blockchain gaming platform. ${request.gameType ? `Current game: ${request.gameType}` : ''}`,
      messages: [
        {
          role: 'user',
          content: request.context ? `${request.context}\n\n${request.prompt}` : request.prompt
        }
      ]
    })

    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
    
    return {
      content,
      provider: 'anthropic',
      model: response.model,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
      cost: response.usage.input_tokens * 0.00025 + response.usage.output_tokens * 0.00125, // Approx cost
      cached: false
    }
  }

  /**
   * Generate AI response using local Ollama
   */
  private async generateWithOllama(request: AIRequest): Promise<AIResponse> {
    const host = process.env.NEXT_PUBLIC_OLLAMA_HOST || 'http://localhost:11434'
    const model = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b'
    
    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: request.context ? `${request.context}\n\n${request.prompt}` : request.prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 500
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.response || '',
      provider: 'ollama',
      model,
      tokens: data.eval_count || 0,
      cost: 0, // Free local model
      cached: false
    }
  }

  /**
   * Main generate method with automatic provider selection and fallback
   */
  public async generate(
    request: AIRequest,
    preferredProvider: AIProvider = 'auto'
  ): Promise<AIResponse> {
    // Validate request
    const validatedRequest = AIRequestSchema.parse(request)
    
    // Check cache first
    const provider = preferredProvider === 'auto' ? this.getBestProvider() : preferredProvider
    const cacheKey = this.getCacheKey(validatedRequest, provider)
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return { ...cached, cached: true }
    }

    try {
      let response: AIResponse
      
      // Try preferred provider first
      switch (provider) {
        case 'openai':
          response = await this.generateWithOpenAI(validatedRequest)
          break
        case 'anthropic':
          response = await this.generateWithAnthropic(validatedRequest)
          break
        case 'ollama':
          response = await this.generateWithOllama(validatedRequest)
          break
        default:
          // Fallback to available provider
          const fallbackProvider = this.getBestProvider()
          if (fallbackProvider === 'ollama') {
            response = await this.generateWithOllama(validatedRequest)
          } else if (fallbackProvider === 'openai' && this.openai) {
            response = await this.generateWithOpenAI(validatedRequest)
          } else if (fallbackProvider === 'anthropic' && this.anthropic) {
            response = await this.generateWithAnthropic(validatedRequest)
          } else {
            throw new Error('No AI providers available')
          }
      }
      
      // Update request counter
      this.requestCount.set(response.provider, (this.requestCount.get(response.provider) || 0) + 1)
      
      // Cache response (limit cache size)
      if (this.cache.size < 100) {
        this.cache.set(cacheKey, response)
      }
      
      return response
      
    } catch (error) {
      console.error(`❌ AI generation failed with ${provider}:`, error)
      
      // Try fallback provider if primary fails
      if (preferredProvider !== 'auto' && preferredProvider !== 'ollama') {
        try {
          return await this.generate(validatedRequest, 'ollama')
        } catch (fallbackError) {
          console.error('❌ Fallback to Ollama also failed:', fallbackError)
        }
      }
      
      throw new Error(`AI generation failed: ${error}`)
    }
  }

  /**
   * Get usage statistics
   */
  public getUsageStats() {
    return {
      requestCount: Object.fromEntries(this.requestCount),
      limits: this.LIMITS,
      cacheSize: this.cache.size,
      lastReset: this.lastReset.toISOString()
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear()
  }
}

// =============================================================================
// 🎮 Game-Specific AI Helpers
// =============================================================================

/**
 * Generate game-specific AI responses
 */
export class GameAI {
  constructor(private aiManager: AIServiceManager) {}

  /**
   * DAO Governance advice
   */
  async generateDAOAdvice(proposal: string, context?: string): Promise<AIResponse> {
    return this.aiManager.generate({
      prompt: `Analyze this DAO proposal and provide strategic governance advice: ${proposal}`,
      context: context || 'You are a blockchain governance expert analyzing DAO proposals for optimal decision-making.',
      gameType: 'dao'
    })
  }

  /**
   * Trading strategy for Arbitrage game
   */
  async generateTradingStrategy(marketData: string): Promise<AIResponse> {
    return this.aiManager.generate({
      prompt: `Generate an arbitrage trading strategy based on this market data: ${marketData}`,
      context: 'You are a crypto trading expert specializing in arbitrage opportunities across DEXs.',
      gameType: 'arbitrage'
    })
  }

  /**
   * Strategic advice for Syndicate Wars
   */
  async generateSyndicateStrategy(gameState: string): Promise<AIResponse> {
    return this.aiManager.generate({
      prompt: `Provide strategic advice for this syndicate war situation: ${gameState}`,
      context: 'You are a strategic warfare expert in decentralized syndicate conflicts.',
      gameType: 'syndicate'
    })
  }

  /**
   * Talent assessment for Headhunters
   */
  async assessTalent(profile: string): Promise<AIResponse> {
    return this.aiManager.generate({
      prompt: `Assess this Web3 talent profile and provide hiring recommendations: ${profile}`,
      context: 'You are a Web3 talent acquisition expert specializing in blockchain developers and DeFi professionals.',
      gameType: 'headhunter'
    })
  }

  /**
   * Business intelligence insights
   */
  async generateInsights(data: string): Promise<AIResponse> {
    return this.aiManager.generate({
      prompt: `Analyze this business data and provide actionable insights: ${data}`,
      context: 'You are a business intelligence expert specializing in crypto and blockchain market analysis.',
      gameType: 'insider'
    })
  }
}

// =============================================================================
// 🎯 Export Singleton Instance
// =============================================================================

export const aiManager = new AIServiceManager()
export const gameAI = new GameAI(aiManager)

// Export types for use in other modules
export type { AIProvider, AIRequest, AIResponse }