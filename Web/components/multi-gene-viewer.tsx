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

  // Don't add T-DNA as features - we'll draw them as custom overlays
  // Just use gene features
  const allFeatures = geneFeatures
  
  // Store T-DNA data for custom rendering
  const colors = ['#ff0000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b']
  const tdnaInsertions = selectedLineData.map((lineData, index) => ({
    position: lineData.position,
    label: lineData.lineId,
    color: colors[index % colors.length],
  }))

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
            // Add custom afterRender function to draw T-DNA insertion lines
            afterRender: `function(renderProps) {
              const { region, bpPerPx, offsetPx } = renderProps
              const insertions = ${JSON.stringify(tdnaInsertions)}
              
              insertions.forEach(insertion => {
                // Calculate screen position of insertion
                const screenX = (insertion.position - region.start) / bpPerPx - offsetPx
                
                // Create SVG line element
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
                line.setAttribute('x1', screenX)
                line.setAttribute('y1', 20)  // Start near top of track
                line.setAttribute('x2', screenX)
                line.setAttribute('y2', 160) // End near bottom of track
                line.setAttribute('stroke', insertion.color)
                line.setAttribute('stroke-width', '2')
                
                // Create arrow triangle at bottom
                const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
                triangle.setAttribute('points', (screenX-5) + ',160 ' + (screenX+5) + ',160 ' + screenX + ',170')
                triangle.setAttribute('fill', insertion.color)
                
                // Create label
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
                label.setAttribute('x', screenX + 10)
                label.setAttribute('y', 175)
                label.setAttribute('fill', insertion.color)
                label.setAttribute('font-size', '12')
                label.textContent = insertion.label
                
                // Add elements to the SVG
                const svg = renderProps.svg
                svg.appendChild(line)
                svg.appendChild(triangle)
                svg.appendChild(label)
              })
            }`,
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