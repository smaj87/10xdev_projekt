/* eslint-disable guard-for-in */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-restricted-syntax */
/* eslint-disable radix */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import { Fragment, ReactText } from 'components/utils/react';

export const isFunction = (v: unknown) => v instanceof Function;
export const isString = (v: unknown): v is string =>
  typeof v === 'string' || v instanceof String;
export const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
export const isObject = (v: unknown): v is object =>
  v !== null &&
  typeof v === 'object' &&
  // eslint-disable-next-line no-prototype-builtins
  Object.getPrototypeOf(v).isPrototypeOf(Object);

// Returns true only when v is a single html element, not string, not array of elements
export const isElement = (v: any) => {
  if (isArray(v) || v === null) {
    return false;
  }

  if (typeof v === 'object') {
    return v.type !== Fragment;
  }

  return false;
};

export const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (isObject(value) && Object.keys(value).length === 0) ||
  (isString(value) && value.trim().length === 0);

export const isEmptyObj = (v: any) =>
  typeof v === 'object' && Object.keys(v).length === 0;

export const has = (src: any, path: any = []) => {
  let _path = [];
  if (Array.isArray(path)) {
    _path = path.slice();
  } else if (isString(path)) {
    _path = path.split('.');
  } else if (Number.isInteger(path)) {
    _path = path.toString();
  }

  let o = src;
  let idx = 0;

  if (_path.length === 0) {
    return false;
  }

  for (idx = 0; idx < _path.length; idx++) {
    const key = _path[idx];

    if (o != null && o.hasOwnProperty(key)) {
      o = o[key];
    } else {
      return false;
    }
  }
  return true;
};

export const arrayEquals = (arr1: Array<any>, arr2: Array<any>) =>
  isArray(arr1) &&
  isArray(arr2) &&
  arr1.length === arr2.length &&
  arr1.every((val, index) => val === arr2[index]);

export const keyBy = (arr: { [key: ReactText]: any }[], key: ReactText) =>
  arr.reduce((acc, value) => {
    acc[value[key]] = value;
    return acc;
  }, {});

export const objString = (obj: object) => {
  let cls = '';

  Object.entries(obj).forEach(([key, value]) => {
    if (value) {
      if (cls) {
        cls += ' ';
      }
      cls += key;
    }
  });

  return cls;
};

// https://www.joshwcomeau.com/snippets/javascript/debounce/
export const debounce = <T>(
  callback: (...args: T[]) => unknown,
  wait: number,
) => {
  let timeoutId: number;

  return (...args: T[]) => {
    window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * x = 100 => 100
 *
 * x = -5 => 0
 *
 * x = 500 => 255
 *
 * @param n The number to clamp
 * @param min The lower boundary of the output range
 * @param max The upper boundary of the output range
 * @returns A number in the range [min, max]
 */
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

/**
 * Returns a portion of array just like slice, but wrapped.
 * @example
 * const arr = [1, 2, 3, 4, 5];
 * const slicedArr = arr.slice(3, 1)
 * >>> []
 * const wrapSlicedArr = wrapSlice(arr, 3, 1);
 * >>> [4, 5, 1]
 */
export const wrapSlice = <T>(arr: T[], start: number, end: number): T[] =>
  end < start
    ? arr.slice(start).concat(arr.slice(0, end))
    : arr.slice(start, end);

export const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteProperty = (key: string, { [key]: _, ...rest }) => rest;

export const sortArrayOfObjects = (array: any[], field: string) =>
  array.sort((a, b) => a[field].localeCompare(b[field]));

export const conformsTo = (obj: any, ruleSet: any) =>
  Object.keys(ruleSet).every((key) => ruleSet[key](obj[key]));

export const size = (item: any) => {
  if (item) {
    return isObject(item) ? Object.keys(item).length : item.length;
  }

  return 0;
};

export const uniqBy = <T>(arr: T[], iteratee: any): T[] => {
  if (typeof iteratee === 'string') {
    const prop = iteratee;
    iteratee = (item: any) => item[prop];
  }

  return arr.filter(
    (x: any, i: any, self: any[]) =>
      i === self.findIndex((y: any) => iteratee(x) === iteratee(y)),
  );
};

export const range = (start: number, endProp?: number, increment?: number) => {
  const isEndDef = endProp !== undefined;
  const end = isEndDef ? endProp! : start;
  start = isEndDef ? start : 0;

  if (increment === undefined) {
    increment = Math.sign(end - start);
  }

  const length = Math.ceil((end - start) / increment);

  if (length) {
    const result = new Array(length);

    for (let i = 0; i < length; i++) {
      result[i] = start + i * increment;
    }

    return result;
  }

  return [];
};

export const camelCase = (str: string) =>
  str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');

export const snakeCase = (str: string) =>
  str
    ?.match(
      /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
    )
    ?.map((s) => s.toLowerCase())
    ?.join('_');

export const get = <T>(
  object: T,
  path: string | string[],
  defaultValue: unknown,
): unknown | undefined => {
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let result: any = object;

  for (const key of pathArray) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }

  return result ?? defaultValue;
};

export const set = <T>(
  object: T,
  path: string | number | (string | number)[],
  value: any,
): T => {
  if (!object || typeof object !== 'object') {
    throw new Error('Invalid object');
  }

  let pathParts: (string | number)[] = [];

  if (Array.isArray(path)) {
    pathParts = path;
  } else if (typeof path === 'string' || typeof path === 'number') {
    pathParts = [path];
  } else {
    throw new Error('Invalid path');
  }

  let currentObj: any = object;

  for (let i = 0; i < pathParts.length - 1; i++) {
    const pathPart = pathParts[i];

    if (!currentObj[pathPart] || typeof currentObj[pathPart] !== 'object') {
      // If the next key in the path is a number, treat it as an array
      const nextKeyIsNumber = !isNaN(parseInt(pathParts[i + 1].toString()));

      if (nextKeyIsNumber) {
        currentObj[pathPart] = [];
      } else {
        currentObj[pathPart] = {};
      }
    }

    currentObj = currentObj[pathPart];
  }

  const lastKey = pathParts[pathParts.length - 1];

  // If the last key in the path is a number and obj is an array, set the value in the array
  if (!isNaN(parseInt(lastKey.toString())) && Array.isArray(currentObj)) {
    const index = parseInt(lastKey.toString());
    currentObj[index] = value;
  } else {
    currentObj[lastKey] = value;
  }

  return object;
};

/*!
 * Group items from an array together by some criteria or value.
 * (c) 2019 Tom Bremmer (https://tbremer.com/) and Chris Ferdinandi (https://gomakethings.com), MIT License,
 * @param  {Array}           arr      The array to group items from
 * @param  {String|Function} criteria The criteria to group by
 * @return {Object}                   The grouped object
 */
export const groupBy = (arr: any, criteria: any) =>
  arr.reduce((obj: any, item: any) => {
    // Check if the criteria is a function to run on the item or a property of it
    const key =
      typeof criteria === 'function' ? criteria(item) : item[criteria];

    // If the key doesn't exist yet, create it
    if (!obj.hasOwnProperty(key)) {
      obj[key] = [];
    }

    // Push the value to the object
    obj[key].push(item);

    // Return the object to the next item in the loop
    return obj;
  }, {});

export const pick = <T extends object>(object: T, keys: (keyof T)[]) => {
  const result: any = {};

  keys.forEach((key) => {
    if (object[key] !== undefined) {
      result[key] = object[key];
    }
  });

  return result;
};

export const pickBy = <T>(
  object: Record<string, T>,
  predicate?: (value: T, key: string, obj: Record<string, T>) => boolean,
): Partial<Record<string, T>> => {
  const result: Partial<Record<string, T>> = {};

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];
      if (predicate) {
        if (predicate(value, key, object)) {
          result[key] = value;
        }
      } else if (value) {
        result[key] = value;
      }
    }
  }

  return result;
};

export const findKey = <T>(
  object: Record<string, T>,
  predicate: (value: T, key: string, obj: Record<string, T>) => boolean,
): string | undefined => {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key];
      if (predicate(value, key, object)) {
        return key;
      }
    }
  }
  return undefined;
};

const isMergeableObject = (obj: any): obj is Record<string, any> =>
  obj && typeof obj === 'object' && !Array.isArray(obj);

export const merge = <T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();

  if (isMergeableObject(target) && isMergeableObject(source)) {
    (Object.keys(source) as (keyof T)[]).forEach((key) => {
      if (isMergeableObject(source[key])) {
        if (!target[key] || !isMergeableObject(target[key])) {
          target[key] = {} as any;
        }
        // @ts-ignore
        merge(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        target[key] = Array.isArray(target[key])
          ? target[key].concat(source[key])
          : source[key];
      } else {
        // @ts-ignore
        target[key] = source[key];
      }
    });
  }

  return merge(target, ...sources);
};

export const sortBy = <T, K extends keyof T>(
  collection: T[],
  iteratees?: Array<((item: T) => any) | K>,
): T[] => {
  if (!iteratees) {
    return [...collection];
  }

  return collection.sort((a, b) => {
    for (const iteratee of iteratees) {
      const aValue = typeof iteratee === 'function' ? iteratee(a) : a[iteratee];
      const bValue = typeof iteratee === 'function' ? iteratee(b) : b[iteratee];

      if (aValue < bValue) {
        return -1;
      }
      if (aValue > bValue) {
        return 1;
      }
    }

    return 0;
  });
};

export const omit = <T, K extends keyof T>(
  object: T,
  keys: K[],
): Omit<T, K> => {
  const result: Partial<T> = {};

  for (const key in object) {
    if (!keys.includes(key as unknown as K)) {
      result[key] = object[key];
    }
  }

  return result as Omit<T, K>;
};

export const omitBy = <T extends object>(
  obj: T,
  predicate: (value: any, key: keyof T) => boolean,
): Partial<T> => {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

export const isEqual = <T>(value1: T, value2: T): boolean => {
  if (typeof value1 !== typeof value2) {
    return false;
  }

  if (
    typeof value1 !== 'object' ||
    typeof value2 !== 'object' ||
    value1 === null ||
    value2 === null
  ) {
    return value1 === value2;
  }

  const keys1 = Object.keys(value1) as (keyof T)[];
  const keys2 = Object.keys(value2) as (keyof T)[];

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!isEqual(value1[key], value2[key])) {
      return false;
    }
  }

  return true;
};

export const compact = <T>(array: T[]): T[] => array.filter(Boolean);

export const mapValues = <T, U>(
  obj: Record<string, T>,
  iteratee: (value: T) => U,
): Record<string, U> => {
  const result: Record<string, U> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = iteratee(obj[key]);
    }
  }

  return result;
};

export const remove = <T>(
  array: T[],
  predicate: (value: T) => boolean,
): T[] => {
  const removed: T[] = [];

  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      removed.push(...array.splice(i, 1));
    }
  }

  return removed.reverse();
};

export const keys = <T extends object>(obj: T): Array<keyof T> =>
  isObject(obj) ? (Object.keys(obj) as Array<keyof T>) : [];

export const isObjectLike = <T>(value: T) =>
  typeof value === 'object' && value !== null;

export const union = <T>(...arrays: T[][]): T[] => {
  const combinedArray: T[] = [];

  for (const array of arrays) {
    for (const element of array) {
      if (!combinedArray.includes(element)) {
        combinedArray.push(element);
      }
    }
  }

  return combinedArray;
};

export const decodeDataParams = (str: string) => {
  let result = {};

  try {
    result = JSON.parse(decodeURIComponent(str));
  } catch {}

  return result;
};
