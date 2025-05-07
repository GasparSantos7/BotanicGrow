import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "./screens/Home";
import Lista from "./screens/DashboardHumidade";
import Bomba from "./screens/Bomba";
import LoginScreen from "./screens/auth/Login";
import RegisterScreen from "./screens/auth/Register";
import Profile from "./screens/Profilediter";
import PotDetailScreen from "./screens/Potdetail";
import reconhecer from "./screens/reconhecer";
import Forum from "./screens/forum";
import PostDetail from "./screens/PostDetail";

const Tab = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "white",
          elevation: 4,
          shadowOpacity: 0.1,
        },
        tabBarIndicatorStyle: {
          backgroundColor: "tomato",
          height: 3,
        },
        tabBarIcon: ({ color }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = "home"; 
          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Config") {
            iconName = "settings";
          } else if (route.name === "Perfil") {
            iconName = "info";
          }
          return <MaterialIcons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Config" component={Forum} />
      <Tab.Screen name="Perfil" component={Profile} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="PotDetail" component={PotDetailScreen} />
      <Stack.Screen name="Dashboard" component={Lista} />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetail}
        options={{
          headerShown: true,
          headerTitle: 'Detalhes do Post',
          headerTitleStyle: {
            color: '#2E7D32',
          },
          headerTintColor: '#2E7D32',
        }}
      />
    </Stack.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default Navigation;
