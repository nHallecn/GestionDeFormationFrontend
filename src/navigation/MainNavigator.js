import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CatalogueScreen from '../screens/CatalogueScreen';
import SessionsScreen from '../screens/SessionsScreen';
import PersonnelScreen from '../screens/PersonnelScreen';
import CreationFormationScreen from '../screens/CreationFormationScreen';
// import CreationSessionInterneScreen from '../screens/CreationSessionInterneScreen';
// import CreationSessionExterneScreen from '../screens/CreationSessionExterneScreen';
import GestionFormationScreen from '../screens/GestionFormationScreen';
import MembresFormationInterneScreen from '../screens/MembresFormationInterneScreen';
import MembresFormationExterneScreen from '../screens/MembresFormationExterneScreen';
import GestionPresencesScreen from '../screens/GestionPresencesScreen';
import CertificationScreen from '../screens/CertificationScreen';
import GestionAgentsScreen from '../screens/GestionAgentsScreen';
import GestionCabinetsScreen from '../screens/GestionCabinetsScreen';
import CreateAgentScreen from '../screens/CreateAgentScreen';
import CreateCabinetScreen from '../screens/CreateCabinetScreen';
import SessionCreationScreen from '../screens/SessionCreationScreen';

import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const CatalogueStack = createStackNavigator();
const SessionsStack = createStackNavigator();
const PersonnelStack = createStackNavigator();

const CatalogueStackNavigator = () => (
  <CatalogueStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <CatalogueStack.Screen
      name="Catalogue"
      component={CatalogueScreen}
      options={{ title: STRINGS.CATALOGUE_FORMATIONS }}
    />
    <CatalogueStack.Screen
      name="CreationFormation"
      component={CreationFormationScreen}
      options={{ title: STRINGS.CREER_FORMATION }}
    />
    <CatalogueStack.Screen
      name="GestionFormation"
      component={GestionFormationScreen}
      options={{ title: STRINGS.GESTION_FORMATION }}
    />
    <CatalogueStack.Screen
      name="SessionCreation"
      component={SessionCreationScreen}
      options={{ title: STRINGS.CREER_SESSION }}
    />
    <CatalogueStack.Screen
      name="MembresFormationInterne"
      component={MembresFormationInterneScreen}
      options={{ title: STRINGS.MEMBRES_FORMATION_INTERNE }}
    />
    <CatalogueStack.Screen
      name="MembresFormationExterne"
      component={MembresFormationExterneScreen}
      options={{ title: STRINGS.MEMBRES_FORMATION_EXTERNE }}
    />
    <CatalogueStack.Screen
      name="GestionPresences"
      component={GestionPresencesScreen}
      options={{ title: STRINGS.GESTION_PRESENCES }}
    />
    <CatalogueStack.Screen
      name="Certification"
      component={CertificationScreen}
      options={{ title: STRINGS.CERTIFICATION }}
    />
  </CatalogueStack.Navigator>
);


// In your MainNavigator.js file

const SessionsStackNavigator = () => (
  <SessionsStack.Navigator
    screenOptions={{
      // You can keep your header styles here
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    {/* 1. The FIRST screen should be the list of sessions. */}
    <SessionsStack.Screen
      name="SessionsList" // A more descriptive name
      component={SessionsScreen}
      options={{ title: STRINGS.SESSIONS }} // Set the title for the list screen
    />

    {/* 2. The detail screen is defined here, so the navigator knows about it. */}
    <SessionsStack.Screen
      name="GestionFormation"
      component={GestionFormationScreen}
      // The title for this screen can be set dynamically inside the component
      // or when you navigate to it. We can leave the static title for now.
      options={{ title: STRINGS.GESTION_FORMATION }}
    />
    
    {/* 3. Other screens you can navigate to from the details screen. */}
    <SessionsStack.Screen
      name="MembresFormationInterne"
      component={MembresFormationInterneScreen}
      options={{ title: STRINGS.MEMBRES_FORMATION_INTERNE }}
    />
    <SessionsStack.Screen
      name="MembresFormationExterne"
      component={MembresFormationExterneScreen}
      options={{ title: STRINGS.MEMBRES_FORMATION_EXTERNE }}
    />
    <SessionsStack.Screen
      name="GestionPresences"
      component={GestionPresencesScreen}
      options={{ title: STRINGS.GESTION_PRESENCES }}
    />
    <SessionsStack.Screen
      name="Certification"
      component={CertificationScreen}
      options={{ title: STRINGS.CERTIFICATION }}
    />
  </SessionsStack.Navigator>
);



const PersonnelStackNavigator = () => (
  <PersonnelStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <PersonnelStack.Screen
      name="PersonnelMain"
      component={PersonnelScreen}
      options={{ title: STRINGS.PERSONNEL }}
    />
    <PersonnelStack.Screen
      name="GestionAgents"
      component={GestionAgentsScreen}
      options={{ title: STRINGS.GESTION_AGENTS }}
    />
    <PersonnelStack.Screen
      name="GestionCabinets"
      component={GestionCabinetsScreen}
      options={{ title: STRINGS.GESTION_CABINETS }}
    />
    <PersonnelStack.Screen
      name="CreateAgent"
      component={CreateAgentScreen}
      options={{ title: STRINGS.CREER_AGENT }}
    />
    <PersonnelStack.Screen
      name="CreateCabinet"
      component={CreateCabinetScreen}
      options={{ title: STRINGS.CREER_CABINET }}
    />
  </PersonnelStack.Navigator>
);


const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'CatalogueTab') {
          iconName = focused ? 'library' : 'library-outline';
        } else if (route.name === 'SessionsTab') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'PersonnelTab') {
          iconName = focused ? 'people' : 'people-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      // tabBarActiveTintColor: COLORS.primary,
      // tabBarInactiveTintColor: COLORS.gray,
      // tabBarStyle: {
      //   backgroundColor: COLORS.white,
      //   borderTopColor: COLORS.border,
      // },
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="CatalogueTab"
      component={CatalogueStackNavigator}
      options={{ tabBarLabel: STRINGS.CATALOGUE }}
    />
    <Tab.Screen
      name="SessionsTab"
      component={SessionsStackNavigator}
      options={{ tabBarLabel: STRINGS.SESSIONS }}
    />
    <Tab.Screen
      name="PersonnelTab"
      component={PersonnelStackNavigator}
      options={{ tabBarLabel: STRINGS.PERSONNEL }}
    />
  </Tab.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
  </Stack.Navigator>
);

export default MainNavigator;
