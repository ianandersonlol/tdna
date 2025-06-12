'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

const GeneViewer = dynamic(() => import('@/components/gene-viewer'), { ssr: false })

export default function Home() {
  const [gene, setGene] = useState('')
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState('')

  const search = async () => {
    setError('')
    const res = await fetch(`/api/tdna?gene=${gene}`)
    if (res.ok) {
      const data = await res.json()
      setLines(data.lines)
    } else {
      setError('Error fetching data')
      setLines([])
    }
  }

  return (
    <main className="p-4 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">tdna web</h1>
      <div className="flex gap-2">
        <Input value={gene} onChange={e => setGene(e.target.value)} placeholder="Gene ID" />
        <Button onClick={search}>Search</Button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {lines.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Lines</h2>
          <ul className="list-disc pl-4">
            {lines.map(l => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <GeneViewer gene={gene} lines={lines} />
        </div>
      )}
    </main>
  )
}
