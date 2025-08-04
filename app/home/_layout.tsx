import palette from "@/utils/theme/color";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const MyHealthIconActive = require("@/assets/svg/health-active.svg").default;
  const TrackIconActive = require("@/assets/svg/track-active.svg").default;
  const InsightIconActive = require("@/assets/svg/insight-active.svg").default;
  const CareTeamIconActive =
    require("@/assets/svg/careTeam-active.svg").default;

  const MyHealthIconInActive =
    require("@/assets/svg/health-inactive.svg").default;
  const TrackIconInActive = require("@/assets/svg/track-inactive.svg").default;
  const InsightIconInActive =
    require("@/assets/svg/insight-inactive.svg").default;
  const CareTeamIconInActive =
    require("@/assets//svg/careTeam-inactive.svg").default;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.tabIconActiveColor,
        tabBarInactiveTintColor: palette.tabIconInactiveColor,

        tabBarStyle: {
          paddingTop: 0,
          marginTop: 0,
          backgroundColor: palette.tabBackgroundColor,
          paddingHorizontal: 16,
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="myHealth"
        options={{
          title: "My Health",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <MyHealthIconActive width={32} height={32} />
            ) : (
              <MyHealthIconInActive width={32} height={32} />
            ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: "Track",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <TrackIconActive width={32} height={32} />
            ) : (
              <TrackIconInActive width={32} height={32} />
            ),
        }}
      />
      <Tabs.Screen
        name="insight"
        options={{
          title: "Insight",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <InsightIconActive width={32} height={32} />
            ) : (
              <InsightIconInActive width={32} height={32} />
            ),
        }}
      />
      <Tabs.Screen
        name="careTeam"
        options={{
          title: "Care Team",
          tabBarIcon: ({ focused }) =>
            focused ? (
              <CareTeamIconActive width={32} height={32} />
            ) : (
              <CareTeamIconInActive width={32} height={32} />
            ),
        }}
      />
    </Tabs>
  );
}
