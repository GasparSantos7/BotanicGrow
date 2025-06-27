import React from "react";
import { View, Text } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";

import HomeScreen from "./screens/Home";
import HumidityDashboard from "./screens/DashboardHumidade";
import Bomba from "./screens/Boma";
import Ventoinha from "./screens/Ventoinha";
import LoginScreen from "./screens/auth/Login";
import RegisterScreen from "./screens/auth/Register";
import PasswordResetScreen from "./screens/auth/PasswordReset";
import EmailVerificationScreen from "./screens/auth/EmailVerification";
import Profile from "./screens/Profilediter";
import PotDetailScreen from "./screens/Potdetail";
import Forum from "./screens/forum";
import PostDetail from "./screens/PostDetail";
import HumidityHistoryScreen from "./screens/HumidityHistoryScreen";
import AlertSettingsScreen from "./screens/AlertSettings";
import AdvancedCharts from "./components/AdvancedCharts";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
  EmailVerification: undefined;
  HomeTabs: undefined;
  PotDetail: { id: number };
  Dashboard: undefined;
  HumidityHistory: undefined;
  AlertSettings: undefined;
  AdvancedCharts: undefined;
  PostDetail: {
    post: {
      id: string;
      title: string;
      description: string;
      createdAt: Timestamp;
      userId: string;
      userName: string;
      commentCount?: number;
    };
  };
};

const Tab = createMaterialTopTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = "home";
        let label = "";

        if (route.name === "Home") {
          iconName = "home";
          label = "Início";
        } else if (route.name === "Forum") {
          iconName = "forum";
          label = "Forum";
        } else if (route.name === "Perfil") {
          iconName = "info";
          label = "Perfil";
        } else if (route.name === "Bomba") {
          iconName = "water-drop";
          label = "Bomba";
        }

        return {
          tabBarLabel: ({ color }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name={iconName} size={20} color={color} />
              <Text style={{ color, fontSize: 12 }}>{label}</Text>
            </View>
          ),
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
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Forum" component={Forum} />
      <Tab.Screen name="Perfil" component={Profile} />
      <Tab.Screen name="Bomba" component={Bomba} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="PotDetail" component={PotDetailScreen} />
      <Stack.Screen name="Dashboard" component={HumidityDashboard} />
      <Stack.Screen name="HumidityHistory" component={HumidityHistoryScreen} />
      <Stack.Screen
        name="AlertSettings"
        component={AlertSettingsScreen}
        options={{
          headerShown: true,
          headerTitle: "Configurações de Alertas",
          headerTitleStyle: {
            color: "#2E7D32",
          },
          headerTintColor: "#2E7D32",
        }}
      />
      <Stack.Screen
        name="AdvancedCharts"
        component={AdvancedCharts}
        options={{
          headerShown: true,
          headerTitle: "Análise Avançada",
          headerTitleStyle: {
            color: "#2E7D32",
          },
          headerTintColor: "#2E7D32",
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetail}
        options={{
          headerShown: true,
          headerTitle: "Detalhes do Post",
          headerTitleStyle: {
            color: "#2E7D32",
          },
          headerTintColor: "#2E7D32",
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
