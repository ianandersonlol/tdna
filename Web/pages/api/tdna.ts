import type { NextApiRequest, NextApiResponse } from 'next'
import { getData } from '@/utils/tdna'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const gene = (req.query.gene as string)?.toUpperCase()
  if (!gene) return res.status(400).json({ error: 'gene required' })
  try {
    const data = getData()
    const lines = data.getTDNAlines(gene)
    const lineDetails = data.getTDNALineDetails(gene)
    const geneData = data.getGeneData(gene)
    
    if (lines.length === 0) {
      return res.status(404).json({ error: `No T-DNA lines found for gene ${gene}` })
    }
    
    res.status(200).json({ 
      lines,
      lineDetails,
      geneData
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error occurred while fetching data' })
  }
}
