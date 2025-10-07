'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Gamepad2, User, LogOut, Wallet } from 'lucide-react'
import { useMultiversX } from '@/components/providers/multiversx-provider'
import { WalletConnect } from '@/components/ui/wallet-connect'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Games', href: '/games' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'NFT Gallery', href: '/nfts' },
  { name: 'Community', href: '/community' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const pathname = usePathname()
  const { address, isConnected, disconnectWallet, balance } = useMultiversX()

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowWalletModal(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-primary-500/20 bg-dark-50/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Gamepad2 className="h-8 w-8 text-primary-500 transition-colors group-hover:text-primary-400" />
                <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full group-hover:bg-primary-400/30 transition-colors" />
              </div>
              <div className="hidden sm:block">
                <span className="font-gaming text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  PROTOGX
                </span>
                <div className="text-xs text-gray-400">NETWORK</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-primary-400'
                          : 'text-gray-300 hover:text-primary-400'
                      }`}
                    >
                      {item.name}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary-400 to-secondary-400"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Wallet & User Section */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {formatAddress(address!)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {parseFloat(balance) / 1e18} EGLD
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectWallet}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletModal(true)}
                  className="btn-gaming hidden sm:flex items-center space-x-2"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </Button>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-primary-400 hover:bg-dark-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-primary-500/20 bg-dark-100/90 backdrop-blur-md"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'text-primary-400 bg-primary-500/10'
                          : 'text-gray-300 hover:text-primary-400 hover:bg-dark-200'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
                
                {/* Mobile wallet section */}
                <div className="pt-4 pb-3 border-t border-primary-500/20">
                  {isConnected ? (
                    <div className="flex items-center justify-between px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {formatAddress(address!)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {parseFloat(balance) / 1e18} EGLD
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={disconnectWallet}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowWalletModal(true)
                        setIsOpen(false)
                      }}
                      className="btn-gaming w-full mx-3 flex items-center justify-center space-x-2"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Connect Wallet</span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Wallet Connect Modal */}
      <WalletConnect
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  )
}