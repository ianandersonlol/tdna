'use client'

import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view'

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

interface Props {
  gene: string
  selectedLine: string
  lineDetails: TDNALineDetail[]
  geneData: GeneData | null
}

export default function GeneViewer({ gene, selectedLine, lineDetails, geneData }: Props) {
  
  if (!geneData) return <div>No gene data available</div>
  
  const selectedLineData = lineDetails.find(line => line.lineId === selectedLine)
  if (!selectedLineData) return <div>No data for selected line</div>

  const assembly = {
    name: 'A_thaliana',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'athaliana_ref',
      adapter: { type: 'FromConfigSequenceAdapter', features: [] },
    },
  }
  
  // Create gene features with T-DNA insertion
  // Ensure chromosome names match between gene features and T-DNA
  const normalizedChromosome = selectedLineData.chromosome.toLowerCase()
  
  const geneFeatures = geneData.features.map(feature => ({
    uniqueId: `${feature.type}_${feature.start}_${feature.stop}`,
    refName: normalizedChromosome, // Use normalized chromosome name
    start: feature.start - 1, // JBrowse uses 0-based coordinates
    end: feature.stop,
    type: feature.type,
    name: feature.type,
    strand: feature.strand === '+' ? 1 : -1,
  }))

  // Add T-DNA insertion marker to gene features
  // Create a visible marker at the insertion point
  const tdnaInsertionFeature = {
    uniqueId: `tdna_${selectedLine}`,
    refName: normalizedChromosome,
    start: selectedLineData.position - 10, // Make it 20bp wide for visibility
    end: selectedLineData.position + 10,
    type: 'repeat_region', // This type typically renders with a distinct style
    name: `T-DNA: ${selectedLine} at position ${selectedLineData.position}`,
    strand: 0,
    score: 1000,
  }

  // Combine all features on single track
  const allFeatures = [...geneFeatures, tdnaInsertionFeature]

  // Create single track with both gene and T-DNA features
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-track',
      name: `${gene} with T-DNA`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: allFeatures,
      },
    },
  ]

  // Center view tightly on T-DNA insertion position
  const insertionPosition = selectedLineData.position
  // Use a fixed range that shows context without requiring dragging
  const viewRange = 5000 // 5kb total view (2.5kb on each side)
  
  // Center exactly on insertion
  const viewStart = Math.max(1, insertionPosition - viewRange / 2)
  const viewEnd = insertionPosition + viewRange / 2

  const state = createViewState({
    assembly,
    tracks,
    defaultSession: {
      name: 'T-DNA Session',
      view: {
        id: 'linearGenomeView',
        type: 'LinearGenomeView',
        displayedRegions: [
          {
            refName: normalizedChromosome, // Use normalized chromosome name
            start: viewStart,
            end: viewEnd,
            assemblyName: 'A_thaliana',
          },
        ],
        tracks: [
          {
            id: 'gene-track',
            type: 'FeatureTrack',
            configuration: 'gene-track',
            displays: [
              {
                id: 'gene-track-display',
                type: 'LinearBasicDisplay',
              },
            ],
          },
        ],
      },
    },
  })

  return (
    <div className="border rounded-lg p-4">
      <div className="h-[600px] w-full">
        <JBrowseLinearGenomeView viewState={state} />
      </div>
      
      
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div>
          T-DNA insertion: <strong>{selectedLine}</strong> at position {selectedLineData.position.toLocaleString()} ({selectedLineData.hm})
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-500 rounded"></div> Gene Features
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div> T-DNA Insertion
          </span>
        </div>
      </div>
    </div>
  )
}