import { type produce as esm } from "immer";
// @ts-expect-error metro bull****
import { produce as cjs } from "immer/dist/cjs";

export const produce = cjs as typeof esm;
