// Gene types
export interface Gene {
  gene_id: string;
  chromosome: string;
  start_position: number;
  end_position: number;
  strand: string;
  description: string;
  GeneFeatures?: GeneFeature[];
}

export interface GeneFeature {
  feature_id: number;
  type: string;
  start_position: number;
  end_position: number;
  strand: string;
}

// T-DNA types
export interface TDNALine {
  line_id: string;
  target_gene: string;
  hit_region: string;
  homozygosity_status: string;
  stock_center_status: string;
  TDNAPositions?: TDNAPosition[];
}

export interface TDNAPosition {
  position_id: number;
  chromosome: string;
  position: number;
}

// Visualization data types
export interface VisualizationData {
  gene: {
    id: string;
    chromosome: string;
    start: number;
    end: number;
    strand: string;
    description: string;
  };
  features: {
    id: number;
    type: string;
    start: number;
    end: number;
    strand: string;
  }[];
  tdnaInsertions: {
    line_id: string;
    chromosome: string;
    position: number;
    hit_region: string;
    homozygosity_status: string;
  }[];
}