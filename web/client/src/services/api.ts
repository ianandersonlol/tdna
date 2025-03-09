import axios from 'axios';
import { Gene, TDNALine, VisualizationData } from '../types';

const API_URL = '/api';

// Gene endpoints
export const getGene = async (geneId: string): Promise<Gene> => {
  try {
    const response = await axios.get<Gene>(`${API_URL}/genes/${geneId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gene:', error);
    throw error;
  }
};

export const searchGenes = async (query: string): Promise<Gene[]> => {
  try {
    const response = await axios.get<Gene[]>(`${API_URL}/genes/search/${query}`);
    return response.data;
  } catch (error) {
    console.error('Error searching genes:', error);
    throw error;
  }
};

// T-DNA endpoints
export const getTDNALines = async (geneId: string): Promise<TDNALine[]> => {
  try {
    const response = await axios.get<TDNALine[]>(`${API_URL}/tdna/gene/${geneId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching T-DNA lines:', error);
    throw error;
  }
};

export const getTDNALine = async (lineId: string): Promise<TDNALine> => {
  try {
    const response = await axios.get<TDNALine>(`${API_URL}/tdna/line/${lineId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching T-DNA line:', error);
    throw error;
  }
};

// Visualization endpoint
export const getVisualizationData = async (geneId: string): Promise<VisualizationData> => {
  try {
    const response = await axios.get<VisualizationData>(`${API_URL}/visualize/${geneId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching visualization data:', error);
    throw error;
  }
};