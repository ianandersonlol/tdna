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
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    try {
      const res = await fetch(`/api/genes?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.genes)
        setShowSuggestions(true)
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err)
    }
  }

  const handleInputChange = (value: string) => {
    setGene(value)
    fetchSuggestions(value)
  }

  const selectSuggestion = (suggestion: string) => {
    setGene(suggestion)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const search = async () => {
    if (!gene.trim()) {
      setError('Please enter a gene ID')
      return
    }
    
    setError('')
    setSelectedLine(null)
    setLoading(true)
    
    try {
      const res = await fetch(`/api/tdna?gene=${gene.trim()}`)
      if (res.ok) {
        const data = await res.json()
        setLines(data.lines)
        setLineDetails(data.lineDetails)
        setGeneData(data.geneData)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'An error occurred while searching')
        setLines([])
        setLineDetails([])
        setGeneData(null)
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      setLines([])
      setLineDetails([])
      setGeneData(null)
    } finally {
      setLoading(false)
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
        <div className="relative flex-1">
          <Input 
            value={gene} 
            onChange={e => handleInputChange(e.target.value)} 
            onKeyPress={handleKeyPress}
            onFocus={() => gene.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Gene ID (e.g., AT1G01010)" 
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={search} disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Searching...
            </div>
          ) : (
            'Search'
          )}
        </Button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          Searching for T-DNA lines in {gene}...
        </div>
      )}
      {lines.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">T-DNA Lines for {gene} ({lines.length} found)</h2>
            <p className="text-sm text-gray-600 mb-2">Click on a line to view in genome browser:</p>
            <div className="space-y-2">
              {lineDetails.map(lineDetail => (
                <button
                  key={lineDetail.lineId}
                  onClick={() => setSelectedLine(lineDetail.lineId)}
                  className={`block w-full text-left px-4 py-3 rounded border transition-colors ${
                    selectedLine === lineDetail.lineId
                      ? 'bg-blue-100 border-blue-300 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{lineDetail.lineId}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {lineDetail.chromosome}:{lineDetail.position.toLocaleString()} • {lineDetail.hitRegion}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        lineDetail.hm === 'HMc' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lineDetail.hm}
                      </div>
                      <div className="text-gray-500 mt-1">ABRC: {lineDetail.abrc}</div>
                    </div>
                  </div>
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
