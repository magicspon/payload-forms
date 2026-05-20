/**
 * Recursive partial — every key at every depth becomes optional.
 *
 * Defined once here and imported by index.ts (plugin options) and
 * mergeCollection.ts (collection config merging) to avoid duplication.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
