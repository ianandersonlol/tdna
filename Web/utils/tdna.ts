import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

interface GffRow {
  chr: string
  source: string
  type: string
  start: number
  stop: number
  strand: string
  info: string
}
interface ConfirmedRow {
  'Target Gene': string
  'T-DNA line': string
  'Hit region': string
  HM: string
  ABRC: string
}
interface LocationRow {
  V1: string
  chr: string
  pos: number
}

function readGzip(filePath: string) {
  const buffer = fs.readFileSync(filePath)
  return zlib.gunzipSync(buffer).toString('utf8')
}

function parseTSV(text: string, header = true) {
  const lines = text.trim().split(/\r?\n/)
  let headers: string[] = []
  if (header) {
    headers = lines.shift()!.split('\t')
  }
  return lines.map(line => {
    const parts = line.split('\t')
    if (header) {
      const row: any = {}
      headers.forEach((h, i) => (row[h] = parts[i]))
      return row
    }
    return parts
  })
}

function parseGff(text: string): GffRow[] {
  const rows = parseTSV(text, false)
  return rows.map(r => ({
    chr: r[0],
    source: r[1],
    type: r[2],
    start: Number(r[3]),
    stop: Number(r[4]),
    strand: r[6],
    info: r[8],
  }))
}

function parseConfirmed(text: string): ConfirmedRow[] {
  const rows = parseTSV(text, true)
  return rows
    .filter(r => r['Hit region'] === 'Exon' && ['HMc', 'HMn'].includes(r['HM']) && r['ABRC'] !== 'NotSent')
    .map(r => ({
      'Target Gene': r['Target Gene'].toUpperCase(),
      'T-DNA line': r['T-DNA line'],
      'Hit region': r['Hit region'],
      HM: r['HM'],
      ABRC: r['ABRC'],
    }))
}

function parseLocation(text: string): LocationRow[] {
  const rows = parseTSV(text, false)
  return rows.map(r => {
    const pos = parseInt(r[4].split(' vs ')[0].split('-')[0], 10)
    return { V1: r[0], chr: r[3], pos }
  })
}

export class TdnaData {
  private gff: GffRow[] = []
  private confirmed: ConfirmedRow[] = []
  private location: LocationRow[] = []

  load(baseDir: string) {
    this.gff = parseGff(readGzip(path.join(baseDir, 'Araport11_GFF3_genes_transposons.201606.gff.gz')))
    this.confirmed = parseConfirmed(readGzip(path.join(baseDir, 'sum_SALK_confirmed.txt.gz')))
    this.location = parseLocation(readGzip(path.join(baseDir, 'T-DNAall.Genes.Araport11.txt.gz')))
  }

  getTDNAlines(gene: string) {
    const geneconfirmed = this.confirmed.filter(c => c['Target Gene'] === gene)
    const lines = Array.from(new Set(geneconfirmed.map(g => g['T-DNA line'])))
    if (lines.length === 0) return []

    const geneGff = this.gff.filter(g => g.info.includes(`ID=${gene}`))
      .filter(g => ['CDS', 'five_prime_UTR', 'three_prime_UTR'].includes(g.type))
    const cds = geneGff.filter(g => g.type === 'CDS')
    const cdspos = new Set<number>()
    cds.forEach(c => { for (let i = c.start; i <= c.stop; i++) cdspos.add(i) })

    const matches = this.location.filter(loc => lines.some(l => loc.V1.includes(l)))
    const uniq = new Map<string, number>()
    matches.forEach(m => { if (!uniq.has(m.V1)) uniq.set(m.V1, m.pos) })
    const filtered = Array.from(uniq.entries()).filter(([, pos]) => cdspos.has(pos))
    return filtered.map(([id]) => id)
  }

  getGeneData(gene: string) {
    const geneGff = this.gff.filter(g => g.info.includes(`ID=${gene}`))
    const geneFeatures = geneGff.filter(g => ['gene', 'CDS', 'five_prime_UTR', 'three_prime_UTR', 'exon'].includes(g.type))
    
    if (geneFeatures.length === 0) return null
    
    const chromosome = geneFeatures[0].chr
    const start = Math.min(...geneFeatures.map(f => f.start))
    const end = Math.max(...geneFeatures.map(f => f.stop))
    
    return {
      gene,
      chromosome,
      start,
      end,
      strand: geneFeatures[0].strand,
      features: geneFeatures
    }
  }

  getTDNALineDetails(gene: string) {
    const geneconfirmed = this.confirmed.filter(c => c['Target Gene'] === gene)
    const lines = Array.from(new Set(geneconfirmed.map(g => g['T-DNA line'])))
    if (lines.length === 0) return []

    const geneGff = this.gff.filter(g => g.info.includes(`ID=${gene}`))
      .filter(g => ['CDS', 'five_prime_UTR', 'three_prime_UTR'].includes(g.type))
    const cds = geneGff.filter(g => g.type === 'CDS')
    const cdspos = new Set<number>()
    cds.forEach(c => { for (let i = c.start; i <= c.stop; i++) cdspos.add(i) })

    const matches = this.location.filter(loc => lines.some(l => loc.V1.includes(l)))
    const uniq = new Map<string, { pos: number, chr: string }>()
    matches.forEach(m => { 
      if (!uniq.has(m.V1)) uniq.set(m.V1, { pos: m.pos, chr: m.chr }) 
    })
    
    const filtered = Array.from(uniq.entries()).filter(([, data]) => cdspos.has(data.pos))
    
    return filtered.map(([lineId, data]) => {
      const confirmedData = geneconfirmed.find(c => c['T-DNA line'] === lineId)
      return {
        lineId,
        chromosome: data.chr,
        position: data.pos,
        hitRegion: confirmedData?.['Hit region'] || 'Unknown',
        hm: confirmedData?.HM || 'Unknown',
        abrc: confirmedData?.ABRC || 'Unknown'
      }
    })
  }

  getAllAvailableGenes() {
    const allGenes = new Set<string>()
    this.confirmed.forEach(c => {
      if (c['Target Gene']) {
        allGenes.add(c['Target Gene'])
      }
    })
    return Array.from(allGenes).sort()
  }
}

let data: TdnaData | null = null

export function getData() {
  if (!data) {
    data = new TdnaData()
    const base = path.join(process.cwd(), 'data')
    data.load(base)
  }
  return data
}
