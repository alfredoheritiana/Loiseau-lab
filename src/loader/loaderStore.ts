export type LoaderState = 'BOOT' | 'LOADING' | 'READY' | 'HANDOFF' | 'HERO';

export interface LoaderData {
  state: LoaderState;
  realProgress: number;
  displayProgress: number;
  criticalAssets: {
    fonts: boolean;
    webgl: boolean;
    shaders: boolean;
    dom: boolean;
  };
}
