'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMultiversX } from '@/components/providers/multiversx-provider'
import { Wallet, Smartphone, Globe, HardwareIcon as Hardware, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WalletConnectProps {
  isOpen: boolean
  onClose: () => void
}

const walletOptions = [
  {
    id: 'extension' as const,
    name: 'MultiversX DeFi Wallet',
    description: 'Connect using the MultiversX DeFi Wallet browser extension',
    icon: Wallet,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'webwallet' as const,
    name: 'Web Wallet',
    description: 'Connect using the MultiversX Web Wallet',
    icon: Globe,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'walletconnect' as const,
    name: 'WalletConnect',
    description: 'Connect using WalletConnect protocol',
    icon: Smartphone,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'hardware' as const,
    name: 'Ledger',
    description: 'Connect using Ledger hardware wallet',
    icon: Hardware,
    color: 'from-orange-500 to-orange-600',
  },
]

export function WalletConnect({ isOpen, onClose }: WalletConnectProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const { connectWallet, isLoading } = useMultiversX()

  const handleConnect = async (walletType: 'extension' | 'webwallet' | 'walletconnect' | 'hardware') => {
    try {
      setSelectedWallet(walletType)
      await connectWallet(walletType)
      toast.success('Wallet connected successfully!')
      onClose()
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect wallet. Please try again.'
      )
    } finally {
      setSelectedWallet(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-dark-100 border-primary-500/20">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-gaming bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Connect Your Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {walletOptions.map((wallet) => {
            const Icon = wallet.icon
            const isConnecting = selectedWallet === wallet.id && isLoading
            
            return (
              <Button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isLoading}
                className="w-full p-4 h-auto bg-dark-200/50 hover:bg-dark-200 border border-primary-500/20 hover:border-primary-400/40 transition-all duration-300"
                variant="ghost"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${wallet.color}`}>
                    {isConnecting ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">{wallet.name}</div>
                    <div className="text-sm text-gray-400">{wallet.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Info Section */}
        <div className="mt-6 p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary-400 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium mb-1">New to MultiversX?</p>
              <p className="text-gray-400">
                You'll need a MultiversX wallet to play games and earn NFT rewards. 
                We recommend starting with the DeFi Wallet extension.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          Your wallet will be used to interact with games and claim NFT rewards.
        </div>
      </DialogContent>
    </Dialog>
  )
}