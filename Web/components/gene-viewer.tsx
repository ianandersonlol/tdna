'use client'

import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view'
import { useEffect, useRef, useState } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [arrowPosition, setArrowPosition] = useState<{ left: number; visible: boolean }>({ left: 0, visible: false })
  
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

  // Add T-DNA insertion as a visible feature
  const insertionFeature = {
    uniqueId: `tdna_insertion_${selectedLine}`,
    refName: selectedLineData.chromosome,
    start: selectedLineData.position - 50, // Give it some width
    end: selectedLineData.position + 50,
    type: 'insertion',
    name: `T-DNA ${selectedLine}`,
    description: `T-DNA insertion ${selectedLine} at position ${selectedLineData.position} (${selectedLineData.hm})`,
  }
  
  const allFeatures = [...geneFeatures, insertionFeature]

  // Create single track with custom rendering
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'gene-with-insertion',
      name: `${gene}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: allFeatures,
      },
      displays: [
        {
          type: 'LinearBasicDisplay',
          displayId: 'gene-with-insertion-display',
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

  // Calculate arrow position and track JBrowse view changes
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const updateArrowPosition = () => {
      try {
        if (containerRef.current && state?.session?.view) {
          // Get current view from JBrowse state
          const currentView = state.session.view
          const displayedRegions = currentView.displayedRegions || []
          
          if (displayedRegions.length > 0) {
            const region = displayedRegions[0]
            const currentStart = region.start
            const currentEnd = region.end
            
            // Find the track element
            const trackElement = containerRef.current.querySelector('.MuiPaper-root')
            if (trackElement) {
              const trackRect = trackElement.getBoundingClientRect()
              const containerRect = containerRef.current.getBoundingClientRect()
              
              // Calculate position based on current displayed region
              const relativePosition = (selectedLineData.position - currentStart) / (currentEnd - currentStart)
              const trackWidth = trackRect.width
              const pixelPosition = trackRect.left - containerRect.left + (relativePosition * trackWidth)
              
              // Only show arrow if insertion is within visible region
              if (selectedLineData.position >= currentStart && selectedLineData.position <= currentEnd) {
                setArrowPosition({ left: pixelPosition, visible: true })
              } else {
                setArrowPosition({ left: 0, visible: false })
              }
            }
          }
        }
      } catch (error) {
        // Fallback to initial calculation if JBrowse state access fails
        if (containerRef.current) {
          const viewWidth = containerRef.current.offsetWidth - 100
          const relativePosition = (selectedLineData.position - viewStart) / (viewEnd - viewStart)
          const pixelPosition = relativePosition * viewWidth + 50
          setArrowPosition({ left: pixelPosition, visible: true })
        }
      }
    }

    // Initial position after JBrowse loads
    const timer = setTimeout(() => {
      updateArrowPosition()
      // Set up interval to track view changes
      intervalId = setInterval(updateArrowPosition, 200)
    }, 1500)

    return () => {
      clearTimeout(timer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [selectedLineData.position, viewStart, viewEnd, state])

  return (
    <div className="border rounded-lg p-4 relative" ref={containerRef}>
      <div className="h-96 w-full">
        <JBrowseLinearGenomeView viewState={state} />
      </div>
      
      {/* T-DNA Insertion Arrow Overlay */}
      {arrowPosition.visible && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${arrowPosition.left}px`,
            top: '120px',
            transform: 'translateX(-50%)'
          }}
        >
          {/* Arrow shaft */}
          <div 
            className="absolute bg-red-600"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: '-40px',
              width: '3px',
              height: '40px'
            }}
          />
          {/* Arrow head */}
          <div 
            className="absolute"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: '0',
              width: '0',
              height: '0',
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #dc2626'
            }}
          />
          {/* Label */}
          <div 
            className="absolute bg-red-600 text-white px-2 py-1 rounded text-sm font-medium whitespace-nowrap"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: '-65px'
            }}
          >
            {selectedLine}
          </div>
        </div>
      )}
      
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