'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

const GeneViewer = dynamic(() => import('@/components/gene-viewer'), { ssr: false })

interface TDNALineDetail {
  lineId: string
  chromosome: string
  position: number
  hitRegion: string
  hm: string
  abrc: string
}

interface GeneData {
  gene: string
  chromosome: string
  start: number
  end: number
  strand: string
  features: any[]
}

export default function Home() {
  const [gene, setGene] = useState('')
  const [lines, setLines] = useState<string[]>([])
  const [lineDetails, setLineDetails] = useState<TDNALineDetail[]>([])
  const [geneData, setGeneData] = useState<GeneData | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [error, setError] = useState('')

  const search = async () => {
    setError('')
    setSelectedLine(null)
    const res = await fetch(`/api/tdna?gene=${gene}`)
    if (res.ok) {
      const data = await res.json()
      setLines(data.lines)
      setLineDetails(data.lineDetails)
      setGeneData(data.geneData)
    } else {
      const errorData = await res.json()
      setError(errorData.error)
      setLines([])
      setLineDetails([])
      setGeneData(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search()
    }
  }

  return (
    <main className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">T-DNA Line Viewer</h1>
      <div className="flex gap-2">
        <Input 
          value={gene} 
          onChange={e => setGene(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Gene ID (e.g., AT1G01010)" 
        />
        <Button onClick={search}>Search</Button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {lines.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">T-DNA Lines for {gene}</h2>
            <p className="text-sm text-gray-600 mb-2">Click on a line to view in genome browser:</p>
            <div className="space-y-1">
              {lines.map(line => (
                <button
                  key={line}
                  onClick={() => setSelectedLine(line)}
                  className={`block w-full text-left px-3 py-2 rounded border transition-colors ${
                    selectedLine === line
                      ? 'bg-blue-100 border-blue-300 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
          {selectedLine && geneData && (
            <div>
              <h3 className="font-semibold mb-2">Genome Browser - {selectedLine}</h3>
              <GeneViewer 
                gene={gene} 
                selectedLine={selectedLine} 
                lineDetails={lineDetails}
                geneData={geneData}
              />
            </div>
          )}
        </div>
      )}
    </main>
  )
}
