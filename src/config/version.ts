import pkg from '../../package.json';

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : pkg.version;

export const CURRENT_VERSION = APP_VERSION;

export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

export function getVersion(): string {
  return APP_VERSION;
}

export function getBuildTime(): string {
  return BUILD_TIME;
}