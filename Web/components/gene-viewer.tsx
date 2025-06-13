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
  const geneFeatures = geneData.features.map(feature => ({
    uniqueId: `${feature.type}_${feature.start}_${feature.stop}`,
    refName: feature.chr,
    start: feature.start - 1, // JBrowse uses 0-based coordinates
    end: feature.stop,
    type: feature.type,
    name: feature.type,
    strand: feature.strand === '+' ? 1 : -1,
  }))

  // Create separate tracks for gene features and T-DNA insertion
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-features',
      name: `${gene}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: geneFeatures,
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'gene-features-display',
          height: 100,
        },
      ],
    },
    {
      type: 'FeatureTrack',
      trackId: 'tdna-insertion',
      name: 'T-DNA Insertion',
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: [{
          uniqueId: `tdna_insertion_${selectedLine}`,
          refName: selectedLineData.chromosome,
          start: selectedLineData.position - 50, // Make it wider for visibility
          end: selectedLineData.position + 50,
          type: 'box',
          name: `T-DNA ${selectedLine}`,
          description: `T-DNA insertion at position ${selectedLineData.position}`,
          score: 1000,
          attributes: {
            Name: [`T-DNA ${selectedLine}`],
            Position: [selectedLineData.position.toString()],
            Type: ['T-DNA Insertion'],
            ABRC: [selectedLineData.abrc || 'N/A'],
            HM: [selectedLineData.hm || 'N/A'],
          },
        }],
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'tdna-insertion-display',
          height: 60,
          renderer: {
            type: 'SvgFeatureRenderer',
            color: 'function(feature) { return "#ff0000" }',
            displayMode: 'normal',
          },
        },
      ],
    },
  ]

  // Center view on T-DNA insertion position
  const insertionPosition = selectedLineData.position
  // Calculate view range to show the whole gene with some padding
  const geneLength = geneData.end - geneData.start
  const minViewRange = 10000 // Minimum 10kb view
  const viewRange = Math.max(minViewRange, geneLength * 2) // 2x gene length for context
  
  // Center on insertion but ensure we show the gene
  const viewCenter = insertionPosition
  const viewStart = Math.max(1, viewCenter - viewRange / 2)
  const viewEnd = viewCenter + viewRange / 2

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
            id: 'gene-features',
            type: 'FeatureTrack',
            configuration: 'gene-features',
            displays: [
              {
                id: 'gene-features-display',
                type: 'LinearBasicDisplay',
                configuration: 'gene-features-display',
                height: 100,
              },
            ],
          },
          {
            id: 'tdna-insertion',
            type: 'FeatureTrack',
            configuration: 'tdna-insertion',
            displays: [
              {
                id: 'tdna-insertion-display',
                type: 'LinearBasicDisplay',
                configuration: 'tdna-insertion-display',
                height: 50,
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