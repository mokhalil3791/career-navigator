// @ts-check
/**
 * Optional modules (applications tracker, built-in AI, knowledge cards, coach view …).
 * Each module is one function that adds pages or services to the app.
 * Turn modules on or off in config/features.json. Core safety features are not modules.
 */
import features from '../../config/features.json';

/** @type {((app: any) => void)[]} */
export const extensions = [];

/** @param {keyof typeof features} flag */
export function enabled(flag) {
  return features[flag] !== false;
}
