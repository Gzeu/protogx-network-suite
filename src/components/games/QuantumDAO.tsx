/**
 * 🧠 Quantum DAO Simulator - First Playable Game
 * Professional governance gaming with AI mentorship
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, Users, Vote, TrendingUp, Zap, Crown, 
  MessageSquare, Clock, Award, Sparkles 
} from 'lucide-react'
import { gameEngine, GameConfig, Player } from '@/lib/gaming/engine'
import { gameAI } from '@/lib/ai'
import { toast } from 'react-hot-toast'

interface Proposal {
  id: string
  title: string
  description: string
  author: string
  votes: { for: number; against: number; abstain: number }
  timeLeft: number
  aiAnalysis?: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  category: 'finance' | 'governance' | 'technical' | 'social'
}

interface DAOGameState {
  gameId: string
  status: 'waiting' | 'active' | 'finished'
  players: Player[]
  currentUser?: Player
  proposals: Proposal[]
  activeProposal?: Proposal
  reputation: number
  governanceTokens: number
  aiMentor: boolean
  leaderboard: Player[]
}

const MOCK_PROPOSALS: Omit<Proposal, 'id' | 'votes' | 'timeLeft'>[] = [
  {
    title: "Implement Quadratic Voting",
    description: "Transition from linear voting to quadratic voting to prevent plutocracy and ensure more democratic governance.",
    author: "governance_expert",
    impact: "high",
    category: "governance",
  },
  {
    title: "DeFi Treasury Diversification", 
    description: "Allocate 30% of treasury to stable DeFi protocols for sustainable yield generation.",
    author: "defi_strategist",
    impact: "critical",
    category: "finance"
  },
  {
    title: "Cross-chain Bridge Integration",
    description: "Deploy our token across 5 major chains to increase accessibility and liquidity.",
    author: "tech_lead",
    impact: "high", 
    category: "technical"
  },
  {
    title: "Community Grants Program",
    description: "Establish $500K quarterly grants for ecosystem development and innovation.",
    author: "community_manager",
    impact: "medium",
    category: "social"
  }
]

export default function QuantumDAO() {
  const [gameState, setGameState] = useState<DAOGameState>({
    gameId: '',
    status: 'waiting',
    players: [],
    proposals: [],
    reputation: 100,
    governanceTokens: 1000,
    aiMentor: true,
    leaderboard: []
  })
  
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | 'abstain'>('for')
  const [isVoting, setIsVoting] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout>()

  // Initialize game on mount
  useEffect(() => {
    initializeGame()
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [])

  const initializeGame = async () => {
    try {
      const gameConfig: GameConfig = {
        type: 'quantum_dao',
        title: 'Quantum DAO Governance Challenge',
        description: 'Master the art of decentralized governance',
        maxPlayers: 8,
        minPlayers: 2,
        duration: 10, // 10 minutes
        entryFee: 0,
        prizePool: 0,
        aiEnabled: true,
        nftRewards: true,
        difficulty: 3,
        customSettings: {
          proposalCount: 4,
          votingRounds: 3,
          reputationMultiplier: 1.5
        }
      }

      const gameId = await gameEngine.createGame(gameConfig, 'user123')
      
      // Mock player join
      await gameEngine.joinGame(gameId, {
        id: 'user123',
        walletAddress: 'erd1...',
        username: 'You',
        isAI: false
      })

      // Generate initial proposals
      const proposals: Proposal[] = MOCK_PROPOSALS.slice(0, 3).map((p, i) => ({
        ...p,
        id: `prop_${i}`,
        votes: { for: 0, against: 0, abstain: 0 },
        timeLeft: 180 - (i * 30) // Staggered timing
      }))

      setGameState(prev => ({
        ...prev,
        gameId,
        proposals,
        activeProposal: proposals[0],
        status: 'active'
      }))

      // Start game loop
      startGameLoop(gameId)
      
      toast.success('🏛️ DAO Governance simulation started!')
    } catch (error) {
      console.error('Failed to initialize game:', error)
      toast.error('Failed to start game')
    }
  }

  const startGameLoop = (gameId: string) => {
    gameLoopRef.current = setInterval(() => {
      setGameState(prev => {
        const updatedProposals = prev.proposals.map(p => ({
          ...p,
          timeLeft: Math.max(0, p.timeLeft - 1)
        }))

        // Auto-advance to next proposal when time expires
        const currentIndex = prev.proposals.findIndex(p => p.id === prev.activeProposal?.id)
        const nextProposal = updatedProposals.find(p => p.timeLeft > 0 && p.id !== prev.activeProposal?.id)
        
        return {
          ...prev,
          proposals: updatedProposals,
          activeProposal: nextProposal || prev.activeProposal
        }
      })
    }, 1000)
  }

  const castVote = async (vote: 'for' | 'against' | 'abstain') => {
    if (!gameState.activeProposal || isVoting) return

    setIsVoting(true)
    
    try {
      // Calculate vote weight based on reputation and tokens
      const voteWeight = Math.floor(
        (gameState.reputation * 0.3) + (gameState.governanceTokens * 0.0001)
      )

      // Process vote through game engine
      await gameEngine.processAction(gameState.gameId, {
        type: 'vote',
        playerId: 'user123',
        data: {
          proposalId: gameState.activeProposal.id,
          choice: vote,
          weight: voteWeight
        }
      })

      // Update local state
      setGameState(prev => ({
        ...prev,
        proposals: prev.proposals.map(p => 
          p.id === gameState.activeProposal?.id 
            ? {
                ...p,
                votes: {
                  ...p.votes,
                  [vote]: p.votes[vote] + voteWeight
                }
              }
            : p
        ),
        reputation: prev.reputation + (vote === 'for' ? 10 : vote === 'against' ? 5 : 2),
        governanceTokens: prev.governanceTokens + 50
      }))

      toast.success(`🗳️ Vote cast: ${vote.toUpperCase()}`)
      
      // Get AI insight after voting
      if (gameState.aiMentor) {
        await getAIInsight(gameState.activeProposal, vote)
      }
      
    } catch (error) {
      console.error('Voting failed:', error)
      toast.error('Failed to cast vote')
    } finally {
      setIsVoting(false)
    }
  }

  const getAIInsight = async (proposal: Proposal, userVote: string) => {
    try {
      const response = await gameAI.generateDAOAdvice(
        `Analyze this vote: ${userVote} on proposal: ${proposal.title}`,
        `User voted ${userVote} on ${proposal.description}`
      )
      
      setAiInsight(response.content)
      setShowAIPanel(true)
    } catch (error) {
      console.error('AI insight failed:', error)
    }
  }

  const createProposal = async () => {
    const newProposal: Proposal = {
      id: `user_prop_${Date.now()}`,
      title: "User Governance Proposal",
      description: "A community-driven proposal for platform improvement.",
      author: "You",
      votes: { for: 0, against: 0, abstain: 0 },
      timeLeft: 240,
      impact: "medium",
      category: "governance"
    }

    setGameState(prev => ({
      ...prev,
      proposals: [...prev.proposals, newProposal],
      reputation: prev.reputation + 25
    }))

    toast.success('📝 New proposal submitted!')
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400' 
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finance': return <TrendingUp className="w-4 h-4" />
      case 'governance': return <Vote className="w-4 h-4" />
      case 'technical': return <Zap className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="relative z-10 p-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quantum DAO Simulator
              </h1>
              <p className="text-gray-400 text-sm">Master decentralized governance</p>
            </div>
          </div>
          
          {/* Player Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{gameState.reputation}</div>
              <div className="text-xs text-gray-400">Reputation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{gameState.governanceTokens.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Gov Tokens</div>
            </div>
            <button 
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI Mentor</span>
            </button>
          </div>
        </motion.div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Proposal */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {gameState.activeProposal && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(gameState.activeProposal.category)}
                    <div>
                      <h3 className="text-xl font-bold">{gameState.activeProposal.title}</h3>
                      <p className="text-sm text-gray-400">by {gameState.activeProposal.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getImpactColor(gameState.activeProposal.impact)}`}>
                      {gameState.activeProposal.impact.toUpperCase()} IMPACT
                    </div>
                    <div className="flex items-center space-x-1 text-orange-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-lg">
                        {formatTime(gameState.activeProposal.timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {gameState.activeProposal.description}
                </p>
                
                {/* Voting Interface */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {(['for', 'against', 'abstain'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedVote(option)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedVote === option
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-lg font-bold capitalize">{option}</div>
                        <div className="text-2xl font-bold text-purple-400">
                          {gameState.activeProposal.votes[option]}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => castVote(selectedVote)}
                    disabled={isVoting || gameState.activeProposal.timeLeft === 0}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-xl font-bold text-lg transition-colors"
                  >
                    {isVoting ? 'Casting Vote...' : `Vote ${selectedVote.toUpperCase()}`}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Proposals Queue */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Upcoming Proposals</h3>
                <button
                  onClick={createProposal}
                  className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm transition-colors"
                >
                  + Create
                </button>
              </div>
              <div className="space-y-3">
                {gameState.proposals.filter(p => p.id !== gameState.activeProposal?.id).map((proposal) => (
                  <div key={proposal.id} className="p-3 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{proposal.title}</div>
                        <div className="text-xs text-gray-400">by {proposal.author}</div>
                      </div>
                      <div className="text-xs text-orange-400">
                        {formatTime(proposal.timeLeft)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                Governance Leaders
              </h3>
              <div className="space-y-2">
                {[1,2,3].map((rank) => (
                  <div key={rank} className="flex items-center justify-between p-2 bg-slate-700/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {rank}
                      </div>
                      <span className="text-sm">Player {rank}</span>
                    </div>
                    <div className="text-purple-400 font-bold text-sm">
                      {1000 - (rank * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700 p-6 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                AI Mentor
              </h3>
              <button 
                onClick={() => setShowAIPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {aiInsight && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-4">
                <h4 className="font-semibold mb-2 text-purple-300">Governance Insight</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{aiInsight}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Strategy Tips</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Vote early for maximum impact</li>
                  <li>• Create proposals to gain reputation</li>
                  <li>• Build alliances with other players</li>
                  <li>• Consider long-term DAO health</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  )
}