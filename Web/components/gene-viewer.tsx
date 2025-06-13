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
  
  // Create gene features track with T-DNA insertion
  const geneFeatures = geneData.features.map(feature => ({
    uniqueId: `${feature.type}_${feature.start}_${feature.stop}`,
    refName: feature.chr,
    start: feature.start - 1, // JBrowse uses 0-based coordinates
    end: feature.stop,
    type: feature.type,
    name: feature.type,
    strand: feature.strand === '+' ? 1 : -1,
  }))

  // Add T-DNA insertion as a feature in the same track
  const insertionFeature = {
    uniqueId: `tdna_insertion_${selectedLine}`,
    refName: selectedLineData.chromosome,
    start: selectedLineData.position - 1, // JBrowse uses 0-based coordinates
    end: selectedLineData.position,
    type: 'insertion',
    name: `T-DNA ${selectedLine}`,
    description: `T-DNA insertion ${selectedLine} at position ${selectedLineData.position} (${selectedLineData.hm})`,
  }
  
  // Combine gene features with insertion
  const allFeatures = [...geneFeatures, insertionFeature]

  // Create single track with both gene structure and T-DNA insertion
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-with-insertion',
      name: `${gene} with T-DNA insertion ${selectedLine}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: allFeatures,
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'gene-with-insertion-display',
          renderer: {
            type: 'SvgFeatureRenderer',
            color1: (feature: any) => {
              if (feature.get('type') === 'insertion') {
                return 'red'
              }
              return 'blue'
            },
            height: (feature: any) => {
              if (feature.get('type') === 'insertion') {
                return 20
              }
              return 10
            },
            shape: (feature: any) => {
              if (feature.get('type') === 'insertion') {
                return 'triangle'
              }
              return 'box'
            },
          },
        },
      ],
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
            id: 'gene-with-insertion',
            type: 'FeatureTrack',
            configuration: 'gene-with-insertion',
            displays: [
              {
                id: 'gene-with-insertion-display',
                type: 'LinearBasicDisplay',
                configuration: 'gene-with-insertion-display',
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
