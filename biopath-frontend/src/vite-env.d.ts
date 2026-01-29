/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 3Dmol.js type declarations
declare module '3dmol' {
  export interface ViewerSpec {
    backgroundColor?: string;
    antialias?: boolean;
    camerax?: number;
  }

  export interface AtomStyleSpec {
    stick?: { radius?: number; color?: string; colorscheme?: string };
    sphere?: { scale?: number; color?: string; colorscheme?: string };
    cartoon?: { color?: string };
    line?: { color?: string };
  }

  export interface SurfaceStyleSpec {
    opacity?: number;
    color?: string;
  }

  export enum SurfaceType {
    VDW = 1,
    MS = 2,
    SAS = 3,
    SES = 4,
  }

  export interface GLViewer {
    addModel(data: string, format: string): GLModel;
    setStyle(sel: object, style: AtomStyleSpec): void;
    addSurface(type: SurfaceType, style: SurfaceStyleSpec): void;
    zoomTo(): void;
    render(): void;
    clear(): void;
    zoom(factor: number): void;
    rotate(angle: number, axis: string): void;
    spin(axis: string | boolean): void;
  }

  export interface GLModel {
    setStyle(sel: object, style: AtomStyleSpec): void;
  }

  export function createViewer(element: HTMLElement, config?: ViewerSpec): GLViewer;
}
