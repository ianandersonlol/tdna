'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

const GeneViewer = dynamic(() => import('@/components/gene-viewer'), { ssr: false })
const MultiGeneViewer = dynamic(() => import('@/components/multi-gene-viewer'), { ssr: false })

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
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<'gene' | 'line'>('gene')
  const [reverseSearchResults, setReverseSearchResults] = useState<any[]>([])
  const [reverseSearchLoading, setReverseSearchLoading] = useState(false)

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

  const toggleLineSelection = (lineId: string) => {
    if (viewMode === 'single') {
      setSelectedLine(lineId)
    } else {
      setSelectedLines(prev => 
        prev.includes(lineId) 
          ? prev.filter(id => id !== lineId)
          : [...prev, lineId]
      )
    }
  }

  const handleViewModeChange = (mode: 'single' | 'multi') => {
    setViewMode(mode)
    if (mode === 'single') {
      setSelectedLines([])
      setSelectedLine(null)
    } else {
      setSelectedLine(null)
    }
  }

  const reverseSearch = async () => {
    if (!gene.trim()) {
      setError('Please enter a T-DNA line ID')
      return
    }
    
    setError('')
    setReverseSearchLoading(true)
    setReverseSearchResults([])
    
    try {
      const res = await fetch(`/api/reverse-search?lineId=${encodeURIComponent(gene.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setReverseSearchResults(data.genes)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'An error occurred while searching')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setReverseSearchLoading(false)
    }
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

  const exportResults = () => {
    if (searchMode === 'gene' && lineDetails.length > 0) {
      const csvContent = [
        'Line ID,Chromosome,Position,Hit Region,HM,ABRC',
        ...lineDetails.map(line => 
          `${line.lineId},${line.chromosome},${line.position},${line.hitRegion},${line.hm},${line.abrc}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tdna_lines_${gene}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else if (searchMode === 'line' && reverseSearchResults.length > 0) {
      const csvContent = [
        'Gene,Chromosome,Start,End,Strand,Insertion Position,HM,ABRC',
        ...reverseSearchResults.map(result => 
          `${result.gene},${result.geneData?.chromosome || ''},${result.geneData?.start || ''},${result.geneData?.end || ''},${result.geneData?.strand || ''},${result.lineDetail?.position || ''},${result.lineDetail?.hm || ''},${result.lineDetail?.abrc || ''}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `genes_affected_by_${gene}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const shareResults = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('search', gene)
    url.searchParams.set('mode', searchMode)
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert('Share link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link. URL: ' + url.toString())
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchMode === 'gene') {
        search()
      } else {
        reverseSearch()
      }
    }
  }

  return (
    <main className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">T-DNA Line Viewer</h1>
      
      {/* Search Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSearchMode('gene')}
          className={`px-4 py-2 rounded ${
            searchMode === 'gene' 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          Search by Gene ID
        </button>
        <button
          onClick={() => setSearchMode('line')}
          className={`px-4 py-2 rounded ${
            searchMode === 'line' 
              ? 'bg-blue-100 text-blue-800 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}
        >
          Search by T-DNA Line
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input 
            value={gene} 
            onChange={e => handleInputChange(e.target.value)} 
            onKeyPress={handleKeyPress}
            onFocus={() => gene.length >= 2 && searchMode === 'gene' && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={searchMode === 'gene' ? "Gene ID (e.g., AT1G01010)" : "T-DNA Line ID (e.g., SALK_001234)"} 
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
        <Button 
          onClick={searchMode === 'gene' ? search : reverseSearch} 
          disabled={loading || reverseSearchLoading}
        >
          {(loading || reverseSearchLoading) ? (
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
      {reverseSearchLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          Searching for genes affected by {gene}...
        </div>
      )}
      
      {/* Reverse Search Results */}
      {reverseSearchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Genes affected by T-DNA line {gene} ({reverseSearchResults.length} found)</h2>
            <div className="flex gap-2">
              <Button onClick={exportResults} className="text-sm px-3 py-1">Export CSV</Button>
              <Button onClick={shareResults} className="text-sm px-3 py-1">Share Link</Button>
            </div>
          </div>
          <div className="space-y-3">
            {reverseSearchResults.map(result => (
              <div key={result.gene} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{result.gene}</h3>
                  {result.lineDetail && (
                    <div className="text-sm">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        result.lineDetail.hm === 'HMc' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.lineDetail.hm}
                      </div>
                    </div>
                  )}
                </div>
                {result.lineDetail && (
                  <div className="text-sm text-gray-600 mb-3">
                    Insertion at {result.lineDetail.chromosome}:{result.lineDetail.position.toLocaleString()} • {result.lineDetail.hitRegion} • ABRC: {result.lineDetail.abrc}
                  </div>
                )}
                {result.geneData && (
                  <div className="text-sm text-gray-600">
                    Location: {result.geneData.chromosome}:{result.geneData.start.toLocaleString()}-{result.geneData.end.toLocaleString()} ({result.geneData.strand})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {lines.length > 0 && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">T-DNA Lines for {gene} ({lines.length} found)</h2>
              <div className="flex gap-2">
                <Button onClick={exportResults} className="text-sm px-3 py-1">Export CSV</Button>
                <Button onClick={shareResults} className="text-sm px-3 py-1">Share Link</Button>
                <button
                  onClick={() => handleViewModeChange('single')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'single' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Single View
                </button>
                <button
                  onClick={() => handleViewModeChange('multi')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'multi' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Compare Multiple
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {viewMode === 'single' 
                ? 'Click on a line to view in genome browser:' 
                : 'Select multiple lines to compare in genome browser:'
              }
            </p>
            <div className="space-y-2">
              {lineDetails.map(lineDetail => {
                const isSelected = viewMode === 'single' 
                  ? selectedLine === lineDetail.lineId
                  : selectedLines.includes(lineDetail.lineId)
                
                return (
                  <button
                    key={lineDetail.lineId}
                    onClick={() => toggleLineSelection(lineDetail.lineId)}
                    className={`block w-full text-left px-4 py-3 rounded border transition-colors ${
                      isSelected
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
                )
              })}
            </div>
          </div>
          {((viewMode === 'single' && selectedLine && geneData) || 
            (viewMode === 'multi' && selectedLines.length > 0 && geneData)) && (
            <div>
              <h3 className="font-semibold mb-2">
                Genome Browser - {
                  viewMode === 'single' 
                    ? selectedLine 
                    : `Comparing ${selectedLines.length} lines`
                }
              </h3>
              <MultiGeneViewer 
                gene={gene} 
                selectedLines={viewMode === 'single' ? [selectedLine!] : selectedLines}
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
