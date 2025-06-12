'use client'

import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view'

interface Props {
  gene: string
  lines: string[]
}

export default function GeneViewer({ gene, lines }: Props) {
  const assembly = {
    name: 'A_thaliana',
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'athaliana_ref',
      adapter: { type: 'FromConfigSequenceAdapter', features: [] },
    },
  }
  const tracks: any[] = [] // configure real tracks using the tdna data

  const state = createViewState({
    assembly,
    tracks,
  })

  return (
    <div className="h-96">
      <JBrowseLinearGenomeView viewState={state} />
    </div>
  )
}
