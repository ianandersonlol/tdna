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
  selectedLines: string[]
  lineDetails: TDNALineDetail[]
  geneData: GeneData | null
}

export default function MultiGeneViewer({ gene, selectedLines, lineDetails, geneData }: Props) {
  if (!geneData) return <div>No gene data available</div>
  
  const selectedLineData = lineDetails.filter(line => selectedLines.includes(line.lineId))
  if (selectedLineData.length === 0) return <div>No data for selected lines</div>

  const assembly = {
    name: 'A_thaliana',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'athaliana_ref',
      adapter: { type: 'FromConfigSequenceAdapter', features: [] },
    },
  }
  
  // Create gene features track
  const geneFeatures = geneData.features.map(feature => ({
    uniqueId: `${feature.type}_${feature.start}_${feature.stop}`,
    refName: feature.chr,
    start: feature.start - 1, // JBrowse uses 0-based coordinates
    end: feature.stop,
    type: feature.type,
    name: feature.type,
    strand: feature.strand === '+' ? 1 : -1,
  }))

  // Create T-DNA insertion features with different colors
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7']
  const tdnaFeatures = selectedLineData.map((lineData, index) => ({
    uniqueId: lineData.lineId,
    refName: lineData.chromosome,
    start: lineData.position - 1, // JBrowse uses 0-based coordinates
    end: lineData.position,
    type: 'insertion',
    name: lineData.lineId,
    description: `T-DNA insertion ${lineData.lineId} at position ${lineData.position} (${lineData.hm})`,
    color: colors[index % colors.length],
  }))

  // Create tracks for gene structure and all selected T-DNA lines
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-structure',
      name: `Gene Structure - ${gene}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: geneFeatures,
      },
    },
    {
      type: 'FeatureTrack',
      trackId: 'tdna-insertions',
      name: `T-DNA Insertions (${selectedLines.length})`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: tdnaFeatures,
      },
    },
  ]

  // Calculate view region with some padding
  const padding = Math.max(1000, (geneData.end - geneData.start) * 0.2)
  const viewStart = Math.max(1, geneData.start - padding)
  const viewEnd = geneData.end + padding

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
            refName: geneData.chromosome,
            start: viewStart,
            end: viewEnd,
            assemblyName: 'A_thaliana',
          },
        ],
        tracks: [
          {
            id: 'gene-structure',
            type: 'FeatureTrack',
            configuration: 'gene-structure',
            displays: [
              {
                id: 'gene-structure-LinearBasicDisplay',
                type: 'LinearBasicDisplay',
                configuration: 'gene-structure-LinearBasicDisplay',
              },
            ],
          },
          {
            id: 'tdna-insertions',
            type: 'FeatureTrack',
            configuration: 'tdna-insertions',
            displays: [
              {
                id: 'tdna-insertions-LinearBasicDisplay',
                type: 'LinearBasicDisplay',
                configuration: 'tdna-insertions-LinearBasicDisplay',
              },
            ],
          },
        ],
      },
    },
  })

  return (
    <div className="border rounded-lg p-4">
      <div className="h-96 w-full">
        <JBrowseLinearGenomeView viewState={state} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedLineData.map((lineData, index) => (
          <div key={lineData.lineId} className="flex items-center gap-2 text-sm">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span>
              <strong>{lineData.lineId}</strong> - {lineData.chromosome}:{lineData.position.toLocaleString()} ({lineData.hm})
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Showing {selectedLines.length} T-DNA insertion{selectedLines.length > 1 ? 's' : ''} in gene: <strong>{gene}</strong>
      </div>
    </div>
  )
}