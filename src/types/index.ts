export type QualityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';

export type AppMode = 'presentation' | 'benchmark';

export type SceneId =
  | 'scene-01-loader'
  | 'scene-02-hero'
  | 'scene-03-transition'
  | 'scene-04-marquee'
  | 'scene-05-rive'
  | 'scene-06-manifesto'
  | 'scene-07-deformable'
  | 'scene-08-collage'
  | 'scene-09-split'
  | 'scene-10-collection'
  | 'scene-11-fullscreen-card'
  | 'scene-12-world-a'
  | 'scene-13-world-portal'
  | 'scene-14-world-b'
  | 'scene-15-campaign'
  | 'scene-16-social-fan'
  | 'scene-17-final'
  | 'scene-18-footer';

export interface DOMTrackedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  visible: boolean;
}

export interface CollectionItem {
  id: string;
  index: string;
  year: string;
  title: string;
  category: 'AERODYNAMICS' | 'STRUCTURAL' | 'MONOCOQUE' | 'SURFACE';
  color: string;
  accent: string;
  geometryType: 'torus' | 'octahedron' | 'icosahedron' | 'dodecahedron' | 'cylinder' | 'knot';
}

export interface SocialCardItem {
  id: string;
  tag: string;
  headline: string;
  meta: string;
  theme: 'dark' | 'green' | 'blue' | 'white';
}
