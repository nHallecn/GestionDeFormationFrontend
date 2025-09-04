import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const PersonnelScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      
      <View style={styles.content}>
        <Text style={styles.title}>{STRINGS.GESTION_PERSONNEL}</Text>
        <Text style={styles.subtitle}>{STRINGS.CHOISIR_OPTION}</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("GestionAgents")}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="account-group"
          >
            {STRINGS.GESTION_AGENTS}
          </Button>
          
          <Button
            mode="contained"
            onPress={() => navigation.navigate("GestionCabinets")}
            style={styles.button}
            labelStyle={styles.buttonLabel}
            icon="office-building"
          >
            {STRINGS.GESTION_CABINETS}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appbar: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    elevation: 3,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default PersonnelScreen;
