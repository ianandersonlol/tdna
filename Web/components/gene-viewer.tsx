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

  // Create tracks for the selected T-DNA line and gene structure
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
      name: `T-DNA Insertion - ${selectedLine}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: [
          {
            uniqueId: selectedLine,
            refName: selectedLineData.chromosome,
            start: selectedLineData.position - 1, // JBrowse uses 0-based coordinates
            end: selectedLineData.position,
            type: 'insertion',
            name: selectedLine,
            description: `T-DNA insertion ${selectedLine} at position ${selectedLineData.position} (${selectedLineData.hm})`,
          },
        ],
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
      <div className="mt-2 text-sm text-gray-600">
        Showing T-DNA insertion data for line: <strong>{selectedLine}</strong> in gene: <strong>{gene}</strong>
      </div>
    </div>
  )
}
