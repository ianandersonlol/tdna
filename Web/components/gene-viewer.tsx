'use client'

import { LinearGenomeView } from '@jbrowse/react-linear-genome-view'

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

  const session = {
    name: 'tdna',
    view: {
      id: 'linear-view',
      type: 'LinearGenomeView',
    },
  }

  return (
    <div className="h-96">
      <LinearGenomeView assembly={assembly} tracks={tracks} defaultSession={session} />
    </div>
  )
}
