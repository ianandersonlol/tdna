'use client'

import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view'

interface Props {
  gene: string
  selectedLine: string
}

export default function GeneViewer({ gene, selectedLine }: Props) {
  const assembly = {
    name: 'A_thaliana',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'athaliana_ref',
      adapter: { type: 'FromConfigSequenceAdapter', features: [] },
    },
  }
  
  // Create tracks for the selected T-DNA line
  const tracks: any[] = [
    {
      type: 'FeatureTrack',
      trackId: 'tdna-insertions',
      name: `T-DNA Insertions - ${selectedLine}`,
      assemblyNames: ['A_thaliana'],
      adapter: {
        type: 'FromConfigAdapter',
        features: [
          {
            uniqueId: selectedLine,
            refName: 'Chr1', // This should be dynamically determined from the data
            start: 1000, // This should come from actual position data
            end: 1001,
            type: 'insertion',
            name: selectedLine,
            description: `T-DNA insertion for line ${selectedLine} in gene ${gene}`,
          },
        ],
      },
    },
  ]

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
            refName: 'Chr1', // Should be dynamic
            start: 500,
            end: 1500,
            assemblyName: 'A_thaliana',
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
