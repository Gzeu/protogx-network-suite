import Link from 'next/link'
import { Github, Twitter, MessageCircle, Mail } from 'lucide-react'

const footerLinks = {
  games: [
    { name: 'Quantum DAO Simulator', href: '/games/quantum-dao' },
    { name: 'Cryptoverse Arbitrage', href: '/games/crypto-arbitrage' },
    { name: 'On-Chain Syndicate Wars', href: '/games/syndicate-wars' },
    { name: 'All Games', href: '/games' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/api-docs' },
    { name: 'Smart Contracts', href: '/contracts' },
    { name: 'Whitepaper', href: '/whitepaper' },
  ],
  community: [
    { name: 'Discord', href: 'https://discord.gg/protogx', external: true },
    { name: 'Telegram', href: 'https://t.me/protogxnetwork', external: true },
    { name: 'Twitter', href: 'https://twitter.com/protogxnetwork', external: true },
    { name: 'GitHub', href: 'https://github.com/Gzeu/protogx-network-suite', external: true },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Disclaimer', href: '/disclaimer' },
  ],
}

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/Gzeu/protogx-network-suite',
    icon: Github,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/protogxnetwork',
    icon: Twitter,
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/protogx',
    icon: MessageCircle,
  },
  {
    name: 'Email',
    href: 'mailto:hello@protogx.network',
    icon: Mail,
  },
]

export function Footer() {
  return (
    <footer className="bg-dark-50 border-t border-primary-500/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PX</span>
              </div>
              <div>
                <div className="font-gaming text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  PROTOGX NETWORK
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Ultra-modern serverless gaming suite on MultiversX blockchain. 
              10 professional mini-games with AI agents, smart contracts, and exclusive NFT rewards.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-dark-200"
                    aria-label={item.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Games */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Games
            </h3>
            <ul className="space-y-3">
              {footerLinks.games.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-primary-500/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} PROTOGX Network. All rights reserved.
            </div>
            <div className="text-gray-400 text-sm mt-4 md:mt-0">
              Built with ❤️ for the MultiversX community
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}