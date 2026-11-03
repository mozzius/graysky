import { useLayoutEffect, type ComponentProps } from "react";
import { withLayoutContext } from "expo-router";
import {
  type ParamListBase,
  type TabNavigationState,
} from "expo-router/react-navigation";
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabNavigationEventMap,
  type NativeBottomTabNavigationOptions,
} from "@bottom-tabs/react-navigation";

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;

type LayoutProps = Parameters<
  NonNullable<ComponentProps<typeof BottomTabNavigator>["layout"]>
>[0];

/**
 * expo-router's TabRouter only adds a tab's route to the state once that tab
 * is visited, but react-native-bottom-tabs renders one native tab per route.
 * so add the missing routes up front, in declared order. tab contents are
 * still rendered lazily by react-native-bottom-tabs.
 *
 * the tabs aren't rendered until every route exists. on android, adding tabs
 * to an already-mounted native tab view inserts the new children before its
 * `items` prop updates, which crashes (index out of bounds in RCTTabView)
 */
function SeedAllTabs({
  state,
  navigation,
  children,
}: Pick<LayoutProps, "state" | "navigation" | "children">) {
  const seeded = state.routes.length === state.routeNames.length;

  // layout effect, so the tabs appear in the same frame
  useLayoutEffect(() => {
    if (seeded) return;
    const focused = state.routes[state.index]?.name;
    const routes = state.routeNames.map(
      // no key - RESET mints one in expo-router's format
      (name) => state.routes.find((route) => route.name === name) ?? { name },
    );
    // same as CommonActions.reset, but avoids mixing in expo-router's copy
    // of the react-navigation types
    navigation.dispatch({
      type: "RESET",
      payload: {
        ...state,
        routes,
        index: Math.max(
          0,
          routes.findIndex((route) => route.name === focused),
        ),
      },
      target: state.key,
    });
  }, [seeded, state, navigation]);

  return seeded ? children : null;
}

const layout = ({ state, navigation, children }: LayoutProps) => (
  <SeedAllTabs state={state} navigation={navigation}>
    {children}
  </SeedAllTabs>
);

const SeededBottomTabNavigator = (
  props: ComponentProps<typeof BottomTabNavigator>,
) => <BottomTabNavigator layout={layout} {...props} />;

export const Tabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof SeededBottomTabNavigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(SeededBottomTabNavigator);
