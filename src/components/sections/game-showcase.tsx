'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  TrendingUp, 
  Swords, 
  Target, 
  Search, 
  Scale, 
  Coins, 
  Share2, 
  Puzzle, 
  Trophy 
} from 'lucide-react'
import Link from 'next/link'

const games = [
  {
    id: 'quantum-dao',
    title: 'Quantum DAO Simulator',
    description: 'Master on-chain governance with AI-driven scenarios and strategic voting mechanics.',
    icon: Brain,
    status: 'Coming Soon',
    statusColor: 'yellow',
    nftReward: 'DAO Mastermind',
    features: ['AI Governance', 'Vote Staking', 'Proposal Creation'],
    gradient: 'from-blue-500/20 to-purple-500/20',
    borderGradient: 'from-blue-500/30 to-purple-500/30',
  },
  {
    id: 'crypto-arbitrage',
    title: 'Cryptoverse Arbitrage',
    description: 'Compete in AI-powered trading competitions with real-time market simulations.',
    icon: TrendingUp,
    status: 'In Development',
    statusColor: 'blue',
    nftReward: 'Arbitrage Champion',
    features: ['Real-time Data', 'AI Competition', 'Portfolio Tracking'],
    gradient: 'from-green-500/20 to-blue-500/20',
    borderGradient: 'from-green-500/30 to-blue-500/30',
  },
  {
    id: 'syndicate-wars',
    title: 'On-Chain Syndicate Wars',
    description: 'Strategic multiplayer warfare with blockchain-verified battle outcomes.',
    icon: Swords,
    status: 'Planning',
    statusColor: 'gray',
    nftReward: 'Syndicate Medal',
    features: ['Multiplayer PvP', 'Strategy Gaming', 'Battle Verification'],
    gradient: 'from-red-500/20 to-orange-500/20',
    borderGradient: 'from-red-500/30 to-orange-500/30',
  },
  {
    id: 'cyber-headhunters',
    title: 'Cyber Headhunters',
    description: 'Web3 talent acquisition game where you build the ultimate tech team.',
    icon: Target,
    status: 'Planning',
    statusColor: 'gray',
    nftReward: 'Talent Badge NFT',
    features: ['Team Building', 'Skill Matching', 'Career Paths'],
    gradient: 'from-cyan-500/20 to-teal-500/20',
    borderGradient: 'from-cyan-500/30 to-teal-500/30',
  },
  {
    id: 'insider-challenge',
    title: 'Insider Challenge GX',
    description: 'Business intelligence puzzles with corporate strategy elements.',
    icon: Search,
    status: 'Planning',
    statusColor: 'gray',
    nftReward: 'Insider Champion',
    features: ['Business Intel', 'Market Analysis', 'Strategic Thinking'],
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderGradient: 'from-purple-500/30 to-pink-500/30',
  },
  {
    id: 'regulatory-chess',
    title: 'Regulatory Chess',
    description: 'Navigate complex legal scenarios in this strategic compliance game.',
    icon: Scale,
    status: 'Planning',
    statusColor: 'gray',
    nftReward: 'Chess GrandRegulator',
    features: ['Legal Strategy', 'Compliance Rules', 'Risk Management'],
    gradient: 'from-indigo-500/20 to-blue-500/20',
    borderGradient: 'from-indigo-500/30 to-blue-500/30',
  },
]

const statusColors = {
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function GameShowcase() {
  return (
    <section className="py-24 bg-gradient-to-b from-dark-200 to-dark-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
            <span className="font-gaming bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Game Portfolio
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            10 professional mini-games designed for the modern blockchain era. 
            Each game features unique AI agents, smart contract mechanics, and exclusive NFT rewards.
          </p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => {
            const Icon = game.icon
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className={`h-full p-6 bg-gradient-to-br ${game.gradient} border-gradient-to-br ${game.borderGradient} hover:scale-105 transition-all duration-300`}>
                  {/* Game Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${game.gradient} border ${game.borderGradient.replace('from-', 'border-').replace('/30', '/50')}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={statusColors[game.statusColor as keyof typeof statusColors]}
                    >
                      {game.status}
                    </Badge>
                  </div>

                  {/* Game Info */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2 font-gaming">
                      {game.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {game.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 text-xs bg-dark-100/50 text-gray-300 rounded border border-primary-500/20"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* NFT Reward */}
                  <div className="mb-6 p-3 rounded-lg bg-dark-100/30 border border-primary-500/20">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">NFT Reward:</span>
                    </div>
                    <div className="text-sm text-primary-400 font-gaming mt-1">
                      "{game.nftReward}"
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    {game.status === 'Coming Soon' ? (
                      <Link href={`/games/${game.id}`}>
                        <Button className="w-full btn-gaming">
                          Learn More
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
                        disabled
                      >
                        {game.status}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* View All Games CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/games">
            <Button size="xl" className="btn-gaming">
              Explore All Games
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}