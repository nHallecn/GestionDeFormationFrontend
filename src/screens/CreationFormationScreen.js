import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, RadioButton, Text, Chip, ActivityIndicator, Card } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { catalogueService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const CreationFormationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { catalogue: existingCatalogue } = route.params || {};

  const [nom, setNom] = useState(existingCatalogue?.Nom || '');
  const [description, setDescription] = useState(existingCatalogue?.Description || '');
  const [objectif, setObjectif] = useState(existingCatalogue?.Objectif_Pedagogique || '');
  const [prerequis, setPrerequis] = useState(existingCatalogue?.Prerequis || '');
  const [categorie, setCategorie] = useState(existingCatalogue?.Categorie || 'certifiant');
  const [competences, setCompetences] = useState(
    existingCatalogue?.competences?.map(c => c.Competence_a_Acquerir) || []
  );
  const [newCompetence, setNewCompetence] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingCatalogue;

  const handleAddCompetence = () => {
    if (newCompetence.trim()) {
      setCompetences([...competences, newCompetence.trim()]);
      setNewCompetence('');
    }
  };

  const handleRemoveCompetence = (index) => {
    const updatedCompetences = competences.filter((_, i) => i !== index);
    setCompetences(updatedCompetences);
  };

  const validateForm = () => {
    if (!nom.trim()) {
      Alert.alert(STRINGS.ERREUR, STRINGS.NOM_REQUIS);
      return false;
    }
    if (!description.trim()) {
      Alert.alert(STRINGS.ERREUR, STRINGS.DESCRIPTION_REQUISE);
      return false;
    }
    if (!objectif.trim()) {
      Alert.alert(STRINGS.ERREUR, STRINGS.OBJECTIF_REQUIS);
      return false;
    }
    if (competences.length === 0) {
      Alert.alert(STRINGS.ERREUR, STRINGS.COMPETENCES_REQUISES);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const formationData = {
      Nom: nom.trim(),
      Description: description.trim(),
      Objectif_Pedagogique: objectif.trim(),
      Prerequis: prerequis.trim(),
      Categorie: categorie,
      competences: competences.map(comp => ({ Competence_a_Acquerir: comp }))
    };

    try {
      if (isEditing) {
        await catalogueService.update(existingCatalogue.ID_de_catalogue, formationData);
        Alert.alert(STRINGS.SUCCES, STRINGS.FORMATION_MISE_A_JOUR);
      } else {
        await catalogueService.create(formationData);
        Alert.alert(STRINGS.SUCCES, STRINGS.FORMATION_CREEE);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving formation:', error);
      Alert.alert(STRINGS.ERREUR_SAUVEGARDE, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{STRINGS.INFORMATIONS_GENERALES}</Text>
            
            <TextInput
              label={STRINGS.NOM_FORMATION}
              value={nom}
              onChangeText={setNom}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={STRINGS.DESCRIPTION}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label={STRINGS.OBJECTIF_PEDAGOGIQUE}
              value={objectif}
              onChangeText={setObjectif}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label={STRINGS.PREREQUIS}
              value={prerequis}
              onChangeText={setPrerequis}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
          </Card.Content>
        </Card>

        {/* Category Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{STRINGS.CATEGORIE}</Text>
            
            <RadioButton.Group onValueChange={setCategorie} value={categorie}>
              <View style={styles.radioOption}>
                <RadioButton value="certifiant" />
                <Text style={styles.radioLabel}>{STRINGS.CERTIFIANT}</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="non certifiant" />
                <Text style={styles.radioLabel}>{STRINGS.NON_CERTIFIANT}</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Competences */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{STRINGS.COMPETENCES}</Text>
            
            <View style={styles.addCompetenceContainer}>
              <TextInput
                label={STRINGS.NOUVELLE_COMPETENCE}
                value={newCompetence}
                onChangeText={setNewCompetence}
                style={styles.competenceInput}
                mode="outlined"
                onSubmitEditing={handleAddCompetence}
              />
              <Button
                mode="contained"
                onPress={handleAddCompetence}
                style={styles.addButton}
                disabled={!newCompetence.trim()}
              >
                {STRINGS.AJOUTER}
              </Button>
            </View>

            <View style={styles.competencesContainer}>
              {competences.map((competence, index) => (
                <Chip
                  key={index}
                  style={styles.competenceChip}
                  onClose={() => handleRemoveCompetence(index)}
                  closeIcon="close"
                >
                  {competence}
                </Chip>
              ))}
            </View>

            {competences.length === 0 && (
              <Text style={styles.emptyText}>{STRINGS.AUCUNE_COMPETENCE}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          disabled={loading}
          icon="content-save"
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            isEditing ? STRINGS.METTRE_A_JOUR : STRINGS.CREER
          )}
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
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.primary,
  },
  input: {
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  addCompetenceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  competenceInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: COLORS.secondary,
  },
  competencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  competenceChip: {
    margin: 4,
    backgroundColor: COLORS.lightBlue,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 16,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
  },
});

export default CreationFormationScreen;
