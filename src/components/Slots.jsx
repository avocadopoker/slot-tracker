import { useState } from 'react'
import SubNav from './SubNav'
import Guide from './Guide'
import Tracking from './Tracking'
import Database from './Database'
import Marketplace from './Marketplace'

const SUBS = [
  { id: 'plays', label: 'Plays' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'database', label: 'Database' },
  { id: 'sell', label: 'Sell' },
]

export default function Slots({ session }) {
  const [sub, setSub] = useState('plays')
  return (
    <div>
      <SubNav items={SUBS} active={sub} onChange={setSub} />
      {sub === 'plays' && <Guide />}
      {sub === 'tracking' && <Tracking session={session} />}
      {sub === 'database' && <Database />}
      {sub === 'sell' && <Marketplace session={session} />}
    </div>
  )
}
