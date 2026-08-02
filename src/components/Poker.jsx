import { useState } from 'react'
import SubNav from './SubNav'
import Placeholder from './Placeholder'

const SUBS = [
  { id: 'news', label: 'News' },
  { id: 'courses', label: 'Courses' },
]

export default function Poker() {
  const [sub, setSub] = useState('news')
  const label = SUBS.find((s) => s.id === sub)?.label
  return (
    <div>
      <SubNav items={SUBS} active={sub} onChange={setSub} />
      <Placeholder title={`Poker ${label}`} />
    </div>
  )
}
