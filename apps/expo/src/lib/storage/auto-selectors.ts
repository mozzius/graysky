import { StoreApi, UseBoundStore } from "zustand";

export type ZustandHookSelectors<StateType> = {
  [Key in keyof Required<StateType> as `use${Capitalize<
    string & Key
  >}`]: () => StateType[Key];
};

export function createSelectorHooks<StateType extends object>(
  store: UseBoundStore<StoreApi<StateType>>,
) {
  return new Proxy(store, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop];
      }

      if (typeof prop === "string" && prop.startsWith("use")) {
        const key = prop[3]!.toLocaleLowerCase() + prop.slice(4);
        const state = target.getState();
        if (key in state) {
          return target(() => )
        } else {
          return () => undefined;
        }
      }

      return undefined;
    },
  }) as UseBoundStore<StoreApi<StateType>> & ZustandHookSelectors<StateType>;
}
