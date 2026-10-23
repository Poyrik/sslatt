import isEmpty from 'lodash/isEmpty';
import validator from 'validator';
/**
 * CapitalizeFirstLetter
 * @param txt
 * @returns
 */
export function capitalizeFirstLetter(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.slice(1); // or if you want lowercase the rest txt.slice(1).toLowerCase();
}

export const JSONDATA = (
  data: any,
): Record<string, any> | string | undefined => {
  if (isEmpty(data) || !data) {
    return undefined;
  }

  try {
    if (typeof data !== 'object') {
      return JSON.parse(data);
    }
    return data;
  } catch (error) {
    console.error(error);
    return data;
  }
};

export const parseCountryCode = (code?: string): string => {
  if (isEmpty(code) || !code) return '';
  if (code === 'all') return '🌐';
  return code.toUpperCase();
};

/**
 * HTML-escapes user supplied values. Strings are escaped; numbers/booleans pass
 * through; arrays and plain objects are escaped recursively (so structured
 * GraphQL arguments such as a withdrawal `{ amount, receiver }` keep their
 * shape instead of being stringified); null/undefined are preserved.
 */
export const escapeText = (text: any): any => {
  if (text === null || text === undefined) return text;
  if (typeof text === 'number' || typeof text === 'boolean') return text;
  if (typeof text === 'string') return text.length ? validator.escape(text) : '';

  if (Array.isArray(text)) return text.map((item) => escapeText(item));

  const proto = Object.getPrototypeOf(text);
  if (typeof text === 'object' && (proto === Object.prototype || proto === null)) {
    return Object.fromEntries(
      Object.entries(text).map(([key, value]) => [key, escapeText(value)]),
    );
  }

  // files, blobs, functions and other exotic values are not text
  return '';
};
