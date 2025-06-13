'use client'

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

  // Calculate scale
  const geneLength = geneData.end - geneData.start
  const viewWidth = 800 // Fixed width for the visualization
  const scale = viewWidth / geneLength
  
  // Group features by type
  const exons = geneData.features.filter(f => f.type === 'exon')
  const cdss = geneData.features.filter(f => f.type === 'CDS')
  const utrs = geneData.features.filter(f => f.type.includes('UTR'))
  
  // Calculate insertion position relative to gene
  const insertionRelativePos = (selectedLineData.position - geneData.start) * scale
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{gene}</h3>
        <p className="text-sm text-gray-600">
          Chr{geneData.chromosome}: {geneData.start.toLocaleString()} - {geneData.end.toLocaleString()} ({geneData.strand} strand)
        </p>
      </div>
      
      <div className="relative" style={{ height: '200px' }}>
        {/* Gene baseline */}
        <div 
          className="absolute bg-gray-400" 
          style={{
            top: '100px',
            left: '0',
            width: `${viewWidth}px`,
            height: '2px'
          }}
        />
        
        {/* Exons */}
        {exons.map((exon, i) => {
          const start = (exon.start - geneData.start) * scale
          const width = (exon.stop - exon.start) * scale
          return (
            <div
              key={`exon-${i}`}
              className="absolute bg-blue-600 border border-blue-800"
              style={{
                top: '85px',
                left: `${start}px`,
                width: `${width}px`,
                height: '30px'
              }}
              title={`Exon: ${exon.start}-${exon.stop}`}
            />
          )
        })}
        
        {/* CDS regions */}
        {cdss.map((cds, i) => {
          const start = (cds.start - geneData.start) * scale
          const width = (cds.stop - cds.start) * scale
          return (
            <div
              key={`cds-${i}`}
              className="absolute bg-green-600 border border-green-800"
              style={{
                top: '90px',
                left: `${start}px`,
                width: `${width}px`,
                height: '20px'
              }}
              title={`CDS: ${cds.start}-${cds.stop}`}
            />
          )
        })}
        
        {/* UTRs */}
        {utrs.map((utr, i) => {
          const start = (utr.start - geneData.start) * scale
          const width = (utr.stop - utr.start) * scale
          return (
            <div
              key={`utr-${i}`}
              className="absolute bg-yellow-500 border border-yellow-700"
              style={{
                top: '92px',
                left: `${start}px`,
                width: `${width}px`,
                height: '16px'
              }}
              title={`${utr.type}: ${utr.start}-${utr.stop}`}
            />
          )
        })}
        
        {/* T-DNA Insertion Marker */}
        <div
          className="absolute"
          style={{
            left: `${insertionRelativePos - 10}px`,
            top: '40px'
          }}
        >
          {/* Arrow shaft */}
          <div 
            className="absolute bg-red-600"
            style={{
              left: '9px',
              top: '0',
              width: '2px',
              height: '40px'
            }}
          />
          {/* Arrow head */}
          <div 
            className="absolute"
            style={{
              left: '0',
              top: '35px',
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '15px solid #dc2626'
            }}
          />
          {/* Label */}
          <div 
            className="absolute bg-red-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
            style={{
              left: '-30px',
              top: '-25px'
            }}
          >
            {selectedLine}
          </div>
        </div>
        
        {/* Position label */}
        <div 
          className="absolute text-xs text-gray-600"
          style={{
            left: `${insertionRelativePos - 20}px`,
            top: '130px'
          }}
        >
          {selectedLineData.position.toLocaleString()}
        </div>
        
        {/* Legend */}
        <div className="absolute right-0 top-0 text-xs">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-4 h-3 bg-blue-600 border border-blue-800"></div>
            <span>Exon</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-4 h-3 bg-green-600 border border-green-800"></div>
            <span>CDS</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-4 h-3 bg-yellow-500 border border-yellow-700"></div>
            <span>UTR</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-600"></div>
            <span>T-DNA</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm">
        <p className="font-medium">T-DNA Insertion Details:</p>
        <p className="text-gray-600">
          Line: {selectedLine} | Position: {selectedLineData.position.toLocaleString()} | 
          Hit Region: {selectedLineData.hitRegion} | Status: {selectedLineData.hm}
        </p>
      </div>
    </div>
  )
}