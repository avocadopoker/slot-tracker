import { useState } from 'react'
import SubNav from './SubNav'
import Placeholder from './Placeholder'

const SUBS = [
  { id: 'guides', label: 'Guides' },
  { id: 'tracking', label: 'Tracking' },
]

export default function Sportsbook() {
  const [sub, setSub] = useState('guides')
  const label = SUBS.find((s) => s.id === sub)?.label
  return (
    <div>
      <SubNav items={SUBS} active={sub} onChange={setSub} />
      <Placeholder title={`Sportsbook ${label}`} />
    </div>
  )
}
