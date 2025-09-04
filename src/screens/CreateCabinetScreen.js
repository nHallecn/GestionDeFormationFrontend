import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cabinetService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const CreateCabinetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cabinet: existingCabinet } = route.params || {};

  const [nom, setNom] = useState(existingCabinet?.Nom || '');
  const [telephone, setTelephone] = useState(existingCabinet?.telephone || '');
  const [emplacement, setEmplacement] = useState(existingCabinet?.Emplacement || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingCabinet;

  const handleSaveCabinet = async () => {
    if (!nom || !telephone || !emplacement) {
      Alert.alert(STRINGS.ERREUR, STRINGS.CHAMPS_REQUIS);
      return;
    }

    setLoading(true);
    const cabinetData = {
      Nom: nom,
      telephone: telephone,
      Emplacement: emplacement,
    };

    try {
      if (isEditing) {
        await cabinetService.update(existingCabinet.ID_de_cabinet, cabinetData);
        Alert.alert(STRINGS.SUCCES, STRINGS.CABINET_MIS_A_JOUR);
      } else {
        await cabinetService.create(cabinetData);
        Alert.alert(STRINGS.SUCCES, STRINGS.CABINET_CREE);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving cabinet:', error);
      Alert.alert(STRINGS.ERREUR_SAUVEGARDE, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <TextInput
          label={STRINGS.NOM}
          value={nom}
          onChangeText={setNom}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={STRINGS.TELEPHONE}
          value={telephone}
          onChangeText={setTelephone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label={STRINGS.EMPLACEMENT}
          value={emplacement}
          onChangeText={setEmplacement}
          mode="outlined"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSaveCabinet}
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
  saveButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
  },
});

export default CreateCabinetScreen;
