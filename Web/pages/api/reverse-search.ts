import type { NextApiRequest, NextApiResponse } from 'next'
import { getData } from '@/utils/tdna'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const lineId = (req.query.lineId as string)?.toUpperCase()
  if (!lineId) return res.status(400).json({ error: 'lineId required' })
  
  try {
    const data = getData()
    const genesForLine = data.getGenesForTDNALine(lineId)
    
    if (genesForLine.length === 0) {
      return res.status(404).json({ error: `No genes found for T-DNA line ${lineId}` })
    }
    
    res.status(200).json({ genes: genesForLine })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error occurred while searching' })
  }
}