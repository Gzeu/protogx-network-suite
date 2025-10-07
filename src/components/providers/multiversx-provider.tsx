'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ExtensionProvider } from '@multiversx/sdk-extension-provider'
import { WebWalletProvider } from '@multiversx/sdk-web-wallet-provider'
import { WalletConnectV2Provider } from '@multiversx/sdk-wallet-connect-provider'
import { HWProvider } from '@multiversx/sdk-hw-provider'
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers'
import { Address } from '@multiversx/sdk-core'

type WalletProvider = ExtensionProvider | WebWalletProvider | WalletConnectV2Provider | HWProvider | null

interface MultiversXContextType {
  provider: WalletProvider
  address: string | null
  isConnected: boolean
  isLoading: boolean
  balance: string
  networkProvider: ApiNetworkProvider
  connectWallet: (type: 'extension' | 'webwallet' | 'walletconnect' | 'hardware') => Promise<void>
  disconnectWallet: () => void
  refreshBalance: () => Promise<void>
}

const MultiversXContext = createContext<MultiversXContextType | null>(null)

interface MultiversXProviderProps {
  children: ReactNode
}

const NETWORK_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_MULTIVERSX_CHAIN || 'devnet',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://devnet-api.multiversx.com',
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://devnet-gateway.multiversx.com',
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://devnet-explorer.multiversx.com',
  walletConnectBridge: process.env.NEXT_PUBLIC_WALLET_CONNECT_BRIDGE || 'https://bridge.walletconnect.org',
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
}

export function MultiversXProvider({ children }: MultiversXProviderProps) {
  const [provider, setProvider] = useState<WalletProvider>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState('0')
  const [networkProvider] = useState(() => new ApiNetworkProvider(NETWORK_CONFIG.apiUrl))

  const refreshBalance = async () => {
    if (!address) return
    
    try {
      const account = await networkProvider.getAccount(new Address(address))
      setBalance(account.balance.toString())
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const connectWallet = async (type: 'extension' | 'webwallet' | 'walletconnect' | 'hardware') => {
    setIsLoading(true)
    
    try {
      let newProvider: WalletProvider = null
      
      switch (type) {
        case 'extension':
          newProvider = ExtensionProvider.getInstance()
          if (!await newProvider.init()) {
            throw new Error('Extension provider initialization failed')
          }
          break
          
        case 'webwallet':
          newProvider = new WebWalletProvider(NETWORK_CONFIG.gatewayUrl)
          break
          
        case 'walletconnect':
          if (!NETWORK_CONFIG.walletConnectProjectId) {
            throw new Error('WalletConnect project ID not configured')
          }
          newProvider = new WalletConnectV2Provider({
            projectId: NETWORK_CONFIG.walletConnectProjectId,
            chainId: NETWORK_CONFIG.chainId,
            relayUrl: 'wss://relay.walletconnect.com',
            metadata: {
              description: 'PROTOGX Network - Ultra-Modern Blockchain Gaming Suite',
              url: 'https://protogx.network',
              icons: ['https://protogx.network/logo.png'],
              name: 'PROTOGX Network',
            },
          })
          break
          
        case 'hardware':
          newProvider = new HWProvider()
          break
          
        default:
          throw new Error(`Unsupported wallet type: ${type}`)
      }
      
      if (newProvider) {
        await newProvider.login({ callbackUrl: window.location.href })
        const userAddress = newProvider.getAddress()
        
        setProvider(newProvider)
        setAddress(userAddress)
        setIsConnected(true)
        
        // Store connection info in localStorage
        localStorage.setItem('protogx_wallet_type', type)
        localStorage.setItem('protogx_wallet_address', userAddress)
      }
    } catch (error) {
      console.error(`Error connecting ${type} wallet:`, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    if (provider) {
      provider.logout()
    }
    
    setProvider(null)
    setAddress(null)
    setIsConnected(false)
    setBalance('0')
    
    // Clear localStorage
    localStorage.removeItem('protogx_wallet_type')
    localStorage.removeItem('protogx_wallet_address')
  }

  // Auto-reconnect on page load
  useEffect(() => {
    const savedWalletType = localStorage.getItem('protogx_wallet_type') as 'extension' | 'webwallet' | 'walletconnect' | 'hardware' | null
    const savedAddress = localStorage.getItem('protogx_wallet_address')
    
    if (savedWalletType && savedAddress) {
      // Only auto-reconnect for extension wallet to avoid popups
      if (savedWalletType === 'extension') {
        connectWallet(savedWalletType).catch(() => {
          // Silent fail for auto-reconnect
          localStorage.removeItem('protogx_wallet_type')
          localStorage.removeItem('protogx_wallet_address')
        })
      }
    }
  }, [])

  // Refresh balance when address changes
  useEffect(() => {
    if (address && isConnected) {
      refreshBalance()
      // Set up interval to refresh balance every 30 seconds
      const interval = setInterval(refreshBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [address, isConnected])

  const value: MultiversXContextType = {
    provider,
    address,
    isConnected,
    isLoading,
    balance,
    networkProvider,
    connectWallet,
    disconnectWallet,
    refreshBalance,
  }

  return (
    <MultiversXContext.Provider value={value}>
      {children}
    </MultiversXContext.Provider>
  )
}

export function useMultiversX() {
  const context = useContext(MultiversXContext)
  if (!context) {
    throw new Error('useMultiversX must be used within MultiversXProvider')
  }
  return context
}