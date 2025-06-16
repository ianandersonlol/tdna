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
  // Ensure consistent chromosome naming
  const normalizedChromosome = geneData.chromosome.toLowerCase()
  
  const geneFeatures = geneData.features.map(feature => ({
    uniqueId: `${feature.type}_${feature.start}_${feature.stop}`,
    refName: normalizedChromosome, // Use normalized chromosome name
    start: feature.start - 1, // JBrowse uses 0-based coordinates
    end: feature.stop,
    type: feature.type,
    name: feature.type,
    strand: feature.strand === '+' ? 1 : -1,
  }))

  // Create T-DNA insertion features with different colors
  const colors = ['#ff0000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b']
  const tdnaFeatures = selectedLineData.map((lineData, index) => ({
    uniqueId: `tdna_${lineData.lineId}`,
    refName: normalizedChromosome, // Use normalized chromosome name
    start: lineData.position - 10, // Make it 20bp wide for visibility
    end: lineData.position + 10,
    type: 'misc_feature', // Use misc_feature for custom rendering
    name: `T-DNA: ${lineData.lineId} at position ${lineData.position}`,
    description: `T-DNA insertion ${lineData.lineId} at position ${lineData.position} (${lineData.hm})`,
    strand: 0,
    score: 1000,
    color: colors[index % colors.length],
  }))

  // Combine all features on a single track
  const allFeatures = [...geneFeatures, ...tdnaFeatures]

  // Create single track with both gene and T-DNA features
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-with-tdna',
      name: `${gene} with T-DNA insertions`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: allFeatures,
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'gene-with-tdna-display',
          height: 180, // Increased by 20% to prevent cutoff
          renderer: {
            type: 'SvgFeatureRenderer',
            color1: 'jexl:get(feature,"color") || "#0080ff"', // Use feature color if available
            color2: 'jexl:get(feature,"color") || "#0040ff"',
            color3: '#ffffff',
            // Use triangle glyph for T-DNA insertions (misc_feature), box for gene features
            glyph: 'jexl:get(feature,"type") === "misc_feature" ? "triangle" : "box"',
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
            refName: normalizedChromosome, // Use normalized chromosome name
            start: viewStart,
            end: viewEnd,
            assemblyName: 'A_thaliana',
          },
        ],
        tracks: [
          {
            id: 'gene-with-tdna',
            type: 'FeatureTrack',
            configuration: 'gene-with-tdna',
            displays: [
              {
                id: 'gene-with-tdna-display',
                type: 'LinearBasicDisplay',
                height: 180, // Match the track display height
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