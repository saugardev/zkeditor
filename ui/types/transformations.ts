export interface TransformationRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformationParams {
  value?: number;
  contrast?: number;
  sigma?: number;
  region?: TransformationRegion;
  text?: string;
  size?: number;
  color?: string;
}

export interface Transformation {
  type: string;
  params?: TransformationParams;
  timestamp: number;
} 