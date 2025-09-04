import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, RadioButton, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { agentService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const CreateAgentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { agent: existingAgent } = route.params || {};

  const [matricule, setMatricule] = useState(existingAgent?.Matricule || '');
  const [nom, setNom] = useState(existingAgent?.Nom || '');
  const [fonction, setFonction] = useState(existingAgent?.Fonction || '');
  const [dateEmbauche, setDateEmbauche] = useState(existingAgent?.date_d_embauche ? new Date(existingAgent.date_d_embauche) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFormateur, setIsFormateur] = useState(!!existingAgent?.domaine_formateur);
  const [domaine, setDomaine] = useState(existingAgent?.domaine_formateur || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingAgent;

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dateEmbauche;
    setShowDatePicker(false);
    setDateEmbauche(currentDate);
  };

  const handleSaveAgent = async () => {
    if (!matricule || !nom || !fonction || !dateEmbauche) {
      Alert.alert(STRINGS.ERREUR, STRINGS.CHAMPS_REQUIS);
      return;
    }
    if (isFormateur && !domaine) {
      Alert.alert(STRINGS.ERREUR, STRINGS.DOMAINE_REQUIS);
      return;
    }

    setLoading(true);
    const agentData = {
      Matricule: matricule,
      Nom: nom,
      Fonction: fonction,
      date_d_embauche: dateEmbauche.toISOString().split('T')[0],
      Domain: isFormateur ? domaine : null, // Only send Domain if isFormateur is true
    };

    try {
      if (isEditing) {
        await agentService.update(matricule, agentData);
        Alert.alert(STRINGS.SUCCES, STRINGS.AGENT_MIS_A_JOUR);
      } else {
        await agentService.create(agentData);
        Alert.alert(STRINGS.SUCCES, STRINGS.AGENT_CREE);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving agent:', error);
      Alert.alert(STRINGS.ERREUR_SAUVEGARDE, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <TextInput
          label={STRINGS.MATRICULE}
          value={matricule}
          onChangeText={setMatricule}
          mode="outlined"
          style={styles.input}
          disabled={isEditing} 
        />
        <TextInput
          label={STRINGS.NOM}
          value={nom}
          onChangeText={setNom}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={STRINGS.FONCTION}
          value={fonction}
          onChangeText={setFonction}
          mode="outlined"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>{STRINGS.DATE_EMBAUCHE}</Text>
        <Button onPress={() => setShowDatePicker(true)} mode="outlined" style={styles.dateButton}>
          {dateEmbauche.toLocaleDateString()}
        </Button>
        {showDatePicker && (
          <DateTimePicker
            value={dateEmbauche}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <Text style={styles.sectionTitle}>{STRINGS.FORMATEUR}</Text>
        <RadioButton.Group onValueChange={newValue => setIsFormateur(newValue === 'yes')} value={isFormateur ? 'yes' : 'no'}>
          <View style={styles.radioGroup}>
            <RadioButton.Item label={STRINGS.OUI} value="yes" />
            <RadioButton.Item label={STRINGS.NON} value="no" />
          </View>
        </RadioButton.Group>

        {isFormateur && (
          <TextInput
            label={STRINGS.DOMAINE_FORMATION}
            value={domaine}
            onChangeText={setDomaine}
            mode="outlined"
            style={styles.input}
          />
        )}

        <Button
          mode="contained"
          onPress={handleSaveAgent}
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={COLORS.white} /> : STRINGS.ENREGISTRER}
        </Button>
      </ScrollView>
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
  scrollViewContent: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: COLORS.text,
  },
  dateButton: {
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
  },
});

export default CreateAgentScreen;
