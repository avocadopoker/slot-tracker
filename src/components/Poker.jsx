import { useState } from 'react'
import SubNav from './SubNav'
import Placeholder from './Placeholder'
import News from './News'

const SUBS = [
  { id: 'news', label: 'News' },
  { id: 'courses', label: 'Courses' },
]

export default function Poker() {
  const [sub, setSub] = useState('news')
  return (
    <div>
      <SubNav items={SUBS} active={sub} onChange={setSub} />
      {sub === 'news' && <News />}
      {sub === 'courses' && <Placeholder title="Poker Courses" />}
    </div>
  )
}
