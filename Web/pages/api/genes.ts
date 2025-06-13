import type { NextApiRequest, NextApiResponse } from 'next'
import { getData } from '@/utils/tdna'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = (req.query.q as string)?.toUpperCase() || ''
  
  try {
    const data = getData()
    const allGenes = data.getAllAvailableGenes()
    
    // Filter genes that match the query
    const filteredGenes = query 
      ? allGenes.filter(gene => gene.includes(query)).slice(0, 10)
      : allGenes.slice(0, 10)
    
    res.status(200).json({ genes: filteredGenes })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error occurred while fetching genes' })
  }
}