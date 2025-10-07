'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Zap, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { icon: Play, label: 'Games', value: '10', suffix: '' },
  { icon: Users, label: 'Players', value: '1', suffix: 'K+' },
  { icon: Trophy, label: 'NFT Rewards', value: '500', suffix: '+' },
  { icon: Zap, label: 'AI Agents', value: '10', suffix: '' },
]

const gameTypes = [
  'Quantum DAO Simulator',
  'Cryptoverse Arbitrage',
  'On-Chain Syndicate Wars',
  'Cyber Headhunters',
  'Insider Challenge GX',
]

export function Hero() {
  const [currentGameIndex, setCurrentGameIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGameIndex((prev) => (prev + 1) % gameTypes.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen items-center justify-center py-20">
          <div className="text-center">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block font-gaming bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                  PROTOGX
                </span>
                <span className="block text-white mt-2">
                  NETWORK
                </span>
              </h1>
              
              <div className="text-xl sm:text-2xl text-gray-300 mb-4">
                Ultra-Modern Serverless Gaming Suite
              </div>
              
              {/* Dynamic Game Type Display */}
              <div className="h-8 mb-6">
                <motion.div
                  key={currentGameIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg text-primary-400 font-gaming"
                >
                  {gameTypes[currentGameIndex]}
                </motion.div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto max-w-3xl text-lg text-gray-300 mb-10 leading-relaxed"
            >
              Experience <span className="text-primary-400 font-semibold">10 professional mini-games</span> powered by 
              AI agents, MultiversX smart contracts, and exclusive NFT rewards. 
              Built serverless for maximum performance and zero backend costs.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link href="/games">
                <Button size="xl" className="btn-gaming group">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Start Playing
                </Button>
              </Link>
              
              <Link href="/community">
                <Button variant="outline" size="xl" className="border-primary-500/50 text-primary-400 hover:bg-primary-500/10">
                  <Users className="mr-2 h-5 w-5" />
                  Join Community
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center group">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 group-hover:border-primary-400/50 transition-colors">
                      <Icon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white font-gaming">
                      {stat.value}
                      <span className="text-primary-400">{stat.suffix}</span>
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                )
              })}
            </motion.div>

            {/* Tech Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-16"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
                <span className="text-sm text-gray-300">
                  Powered by <span className="text-primary-400 font-semibold">MultiversX</span> Blockchain
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-200 to-transparent" />
    </section>
  )
}