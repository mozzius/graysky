import {
  getMain,
  type InferInput,
  type Main,
  type RecordSchema,
  type Schema,
  type TypedObjectSchema,
} from "@atproto/lex";

/**
 * fast type check that only compares the `$type`, and narrows to the schema's
 * type. records from the appview have already been validated, so we trust the
 * `$type` here rather than running full lexicon validation on every render.
 *
 * unlike `schema.$isTypeOf`, this requires the `$type` to be present - the
 * generated `$isTypeOf` on object defs treats a missing `$type` as a match.
 * it also narrows `unknown`/`LexMap` values (like `post.record`) to the full
 * record type, which `$isTypeOf` doesn't
 *
 * @example isType(app.bsky.feed.post, post.record)
 * @example isType(app.bsky.embed.images.view, post.embed)
 */
export function isType<S extends RecordSchema | TypedObjectSchema>(
  schema: Main<S>,
  value: unknown,
): value is InferInput<S> {
  return (
    value != null &&
    typeof value === "object" &&
    (value as { $type?: unknown }).$type === getMain(schema).$type
  );
}

/**
 * fully validates the value against the schema, and narrows it on success.
 * slower than `isType`, so only use it for untrusted data
 *
 * @example matches(app.bsky.feed.post, untrustedRecord)
 */
export function matches<S extends Schema>(
  schema: Main<S>,
  value: unknown,
): value is InferInput<S> {
  return getMain(schema).matches(value);
}
