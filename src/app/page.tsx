import { Hero } from '@/components/sections/hero'
import { GameShowcase } from '@/components/sections/game-showcase'
import { Features } from '@/components/sections/features'
import { TechStack } from '@/components/sections/tech-stack'
import { Roadmap } from '@/components/sections/roadmap'
import { Community } from '@/components/sections/community'

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <GameShowcase />
      <Features />
      <TechStack />
      <Roadmap />
      <Community />
    </div>
  )
}