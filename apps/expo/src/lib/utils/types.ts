/**
 * since @atproto/api 0.14, `isRecord` and friends only check the `$type` and
 * no longer narrow to the full record type. records from the appview have
 * already been validated, so we trust the `$type` here rather than running
 * full lexicon validation (`asPredicate(validateRecord)`) on every render
 */
export function dangerousIsType<R extends { $type?: string }>(
  record: unknown,
  isTypeFn: (v: unknown) => boolean,
): record is R {
  return isTypeFn(record);
}
