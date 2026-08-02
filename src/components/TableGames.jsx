import { useState } from 'react'
import SubNav from './SubNav'
import Placeholder from './Placeholder'

const SUBS = [
  { id: 'blackjack', label: 'Blackjack' },
  { id: 'holdem', label: 'Ultimate Holdem' },
  { id: 'roulette', label: 'Roulette' },
]

export default function TableGames() {
  const [sub, setSub] = useState('blackjack')
  const label = SUBS.find((s) => s.id === sub)?.label
  return (
    <div>
      <SubNav items={SUBS} active={sub} onChange={setSub} />
      <Placeholder title={label} />
    </div>
  )
}
