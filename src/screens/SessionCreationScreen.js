import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList } from 'react-native';
import {  Button, RadioButton, Text, ActivityIndicator, Card, Paragraph, Searchbar, List, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sessionService, agentService, catalogueService, cabinetService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const SessionCreationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { catalogueId } = route.params;

  const [searchFocus, setSearchFocus] = useState(null);
  const [catalogue, setCatalogue] = useState(null);
  const [sessionType, setSessionType] = useState('interne');
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFormateur, setSelectedFormateur] = useState(null);
  const [searchFormateurQuery, setSearchFormateurQuery] = useState('');
  const [cabinets, setCabinets] = useState([]);
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [searchCabinetQuery, setSearchCabinetQuery] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchParticipantsQuery, setSearchParticipantsQuery] = useState('');

  useEffect(() => {
    fetchCatalogueDetails();
    fetchAgents();
    fetchCabinets();
  }, [catalogueId]);

  useEffect(() => {
    setSelectedFormateur(null);
    setSelectedCabinet(null);
    setSelectedParticipants([]);
    setSearchFormateurQuery('');
    setSearchCabinetQuery('');
    setSearchFocus(null);
  }, [sessionType]);

  const fetchCatalogueDetails = async () => {
    try {
      const response = await catalogueService.getById(catalogueId);
      setCatalogue(response.data.data);
    } catch (error) {
      console.error('Error fetching catalogue details:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  const fetchCabinets = async () => {
    try {
      const response = await cabinetService.getAll();
      setCabinets(response.data.data);
    } catch (error) {
      console.error('Error fetching cabinets:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await agentService.getAll();
      setAgents(response.data.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  const onChangeDateDebut = (event, selectedDate) => {
    const currentDate = selectedDate || dateDebut;
    setShowDateDebutPicker(false);
    setDateDebut(currentDate);
    if (currentDate > dateFin) setDateFin(currentDate);
  };

  const onChangeDateFin = (event, selectedDate) => {
    const currentDate = selectedDate || dateFin;
    setShowDateFinPicker(false);
    if (currentDate >= dateDebut) {
      setDateFin(currentDate);
    } else {
      Alert.alert(STRINGS.ERREUR, STRINGS.DATE_FIN_INVALIDE);
    }
  };

  const handleSelectFormateur = (formateur) => {
    setSelectedFormateur(formateur);
    setSearchFormateurQuery(formateur.Nom);
    setSearchFocus(null);
    setSelectedParticipants(selectedParticipants.filter(p => p.Matricule !== formateur.Matricule));
  };

  const handleSelectCabinet = (cabinet) => {
    setSelectedCabinet(cabinet);
    setSearchCabinetQuery(cabinet.Nom);
    setSearchFocus(null);
  };

  const handleSelectParticipant = (participant) => {
    if (sessionType === 'interne' && selectedFormateur?.Matricule === participant.Matricule) {
      Alert.alert(STRINGS.ERREUR, STRINGS.AGENT_DEJA_FORMATEUR);
      return;
    }
    const isSelected = selectedParticipants.some(p => p.Matricule === participant.Matricule);
    if (isSelected) {
      setSelectedParticipants(selectedParticipants.filter(p => p.Matricule !== participant.Matricule));
    } else {
      setSelectedParticipants([...selectedParticipants, participant]);
    }
  };

  const handleCreateSession = async () => {
    if ((sessionType === 'interne' && !selectedFormateur) || (sessionType === 'externe' && !selectedCabinet) || selectedParticipants.length === 0) {
      Alert.alert(STRINGS.ERREUR, STRINGS.CHAMPS_REQUIS);
      return;
    }

    setLoading(true);
    const sessionData = {
      ID_de_catalogue: catalogueId,
      Date_de_Debut: dateDebut.toISOString().split('T')[0],
      Date_de_Fin: dateFin.toISOString().split('T')[0],
      Type: sessionType,
      participants: selectedParticipants.map(p => p.Matricule),
      Matricule_du_formateur: sessionType === 'interne' ? selectedFormateur.Matricule : null,
      ID_du_cabinet: sessionType === 'externe' ? selectedCabinet.ID_de_cabinet : null,
    };

    try {
      await sessionService.create(sessionData);
      Alert.alert(STRINGS.SUCCES, STRINGS.SESSION_CREEE);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert(STRINGS.ERREUR_SAUVEGARDE, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  const filteredFormateurs = agents.filter(agent => agent.Nom.toLowerCase().includes(searchFormateurQuery.toLowerCase()));
  const filteredCabinets = cabinets.filter(cabinet => cabinet.Nom.toLowerCase().includes(searchCabinetQuery.toLowerCase()));
  const filteredAgentsForParticipants = agents.filter(agent => {
    const isNotTrainer = sessionType === 'interne' ? agent.Matricule !== selectedFormateur?.Matricule : true;
    const matchesSearch = agent.Nom.toLowerCase().includes(searchParticipantsQuery.toLowerCase()) || agent.Matricule.toLowerCase().includes(searchParticipantsQuery.toLowerCase());
    return isNotTrainer && matchesSearch;
  });

  if (!catalogue) {
    return <View style={styles.loadingContainer}><ActivityIndicator animating={true} color={COLORS.primary} size="large" /></View>;
  }

  // --- RENDER FUNCTIONS ---

// In SessionCreationScreen.js

const renderHeader = () => (
  <View>
    {/* --- This part is always visible --- */}
    <Card style={styles.formationCard}>
      <Card.Content>
        <Text style={styles.formationTitle}>{catalogue.Nom}</Text>
        <Paragraph style={styles.formationObjectif}><Text style={styles.label}>Objectif:</Text> {catalogue.Objectif_Pedagogique}</Paragraph>
      </Card.Content>
    </Card>
    <Text style={styles.sectionTitle}>{STRINGS.TYPE}</Text>
    <Card style={styles.card}>
      <Card.Content>
        <RadioButton.Group onValueChange={setSessionType} value={sessionType}>
          <View style={styles.radioOption}><RadioButton value="interne" /><Text style={styles.radioLabel}>{STRINGS.INTERNE}</Text></View>
          <View style={styles.radioOption}><RadioButton value="externe" /><Text style={styles.radioLabel}>{STRINGS.EXTERNE}</Text></View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
    <Text style={styles.sectionTitle}>{STRINGS.DUREE_FORMATION}</Text>
    <View style={styles.datePickerContainer}>
      <Button onPress={() => setShowDateDebutPicker(true)} mode="outlined" style={styles.dateButton}>{STRINGS.DATE_DEBUT}: {dateDebut.toLocaleDateString()}</Button>
      {showDateDebutPicker && <DateTimePicker value={dateDebut} mode="date" display="default" onChange={onChangeDateDebut} minimumDate={new Date()} />}
      <Button onPress={() => setShowDateFinPicker(true)} mode="outlined" style={styles.dateButton}>{STRINGS.DATE_FIN}: {dateFin.toLocaleDateString()}</Button>
      {showDateFinPicker && <DateTimePicker value={dateFin} mode="date" display="default" onChange={onChangeDateFin} minimumDate={dateDebut} />}
    </View>

    {/* --- Trainer Section --- */}
    {sessionType === 'interne' && (
      <>
        <Text style={styles.sectionTitle}>{STRINGS.FORMATEUR}</Text>
        <Searchbar 
          placeholder={STRINGS.RECHERCHER_FORMATEUR} 
          onChangeText={setSearchFormateurQuery} 
          value={searchFormateurQuery} 
          style={styles.searchBar} 
          onFocus={() => setSearchFocus('formateur')} 
        />
        {/* Show selected trainer card ONLY when not searching for a trainer */}
        {selectedFormateur && searchFocus !== 'formateur' && (
          <Card style={styles.selectedCard}>
            <Card.Content>
              <Text style={styles.selectedTitle}>{STRINGS.SELECTIONNER_FORMATEUR}</Text>
              <Paragraph>{selectedFormateur.Nom}</Paragraph>
            </Card.Content>
          </Card>
        )}
      </>
    )}

    {/* --- Cabinet Section --- */}
    {sessionType === 'externe' && (
      <>
        <Text style={styles.sectionTitle}>{STRINGS.CABINET_FORMATION}</Text>
        <Searchbar 
          placeholder={STRINGS.RECHERCHER_CABINET} 
          onChangeText={setSearchCabinetQuery} 
          value={searchCabinetQuery} 
          style={styles.searchBar} 
          onFocus={() => setSearchFocus('cabinet')} 
        />
        {/* Show selected cabinet card ONLY when not searching for a cabinet */}
        {selectedCabinet && searchFocus !== 'cabinet' && (
          <Card style={styles.selectedCard}>
            <Card.Content>
              <Text style={styles.selectedTitle}>{STRINGS.SELECTIONNER_CABINET}</Text>
              <Paragraph>{selectedCabinet.Nom}</Paragraph>
            </Card.Content>
          </Card>
        )}
      </>
    )}

    {/* --- FIX IS HERE: Conditionally render the Participants section --- */}
    {/* Only show this section if we are NOT searching for a formateur or cabinet */}
    {searchFocus !== 'formateur' && searchFocus !== 'cabinet' && (
      <>
        <Text style={styles.sectionTitle}>{STRINGS.PARTICIPANTS}</Text>
        <Searchbar 
          placeholder={STRINGS.RECHERCHER_PARTICIPANT} 
          onChangeText={setSearchParticipantsQuery} 
          value={searchParticipantsQuery} 
          style={styles.searchBar} 
          onFocus={() => setSearchFocus('participant')} 
        />
      </>
    )}
  </View>
);


 // In SessionCreationScreen.js

const renderFooter = () => {
  // If we are in any search mode, this component should render something.
  if (searchFocus) {
    // --- FIX IS HERE ---
    // If the search focus is specifically for 'participant', show the confirm button.
    if (searchFocus === 'participant') {
      return (
        <Button
          mode="contained"
          onPress={() => setSearchFocus(null)} // This is the key action
          style={styles.confirmButton}
          icon="check"
        >
          {STRINGS.CONFIRMER_SELECTION} 
        </Button>
      );
    }
    // For other search modes ('formateur', 'cabinet'), render nothing in the footer.
    return null;
  }

  // --- This is the original logic for the main form view ---
  return (
    <View>
      {selectedParticipants.length > 0 && (
        <View style={styles.selectedParticipantsContainer}>
          <Text style={styles.selectedTitle}>{STRINGS.SELECTIONNER_PARTICIPANTS} ({selectedParticipants.length})</Text>
          <View style={styles.participantsChips}>
            {selectedParticipants.map((participant) => (
              <Chip key={participant.Matricule} style={styles.participantChip} onClose={() => handleSelectParticipant(participant)}>
                {participant.Nom}
              </Chip>
            ))}
          </View>
        </View>
      )}
      <Button mode="contained" onPress={handleCreateSession} style={styles.saveButton} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : STRINGS.CREER_SESSION}
      </Button>
    </View>
  );
};


  const getListData = () => {
    switch (searchFocus) {
      case 'formateur': return filteredFormateurs;
      case 'cabinet': return filteredCabinets;
      case 'participant': return filteredAgentsForParticipants;
      default: return []; // Return empty array when not searching
    }
  };

  const renderListItem = ({ item }) => {
    switch (searchFocus) {
      case 'formateur':
        return <List.Item title={item.Nom} description={`${item.Fonction} - ${item.Domain || ''}`} onPress={() => handleSelectFormateur(item)} left={() => <List.Icon icon="account" />} />;
      case 'cabinet':
        return <List.Item title={item.Nom} description={`${item.telephone} - ${item.Emplacement}`} onPress={() => handleSelectCabinet(item)} left={() => <List.Icon icon="office-building" />} />;
      case 'participant':
        const isSelected = selectedParticipants.some(p => p.Matricule === item.Matricule);
        return <List.Item title={item.Nom} description={`${item.Matricule} - ${item.Fonction}`} onPress={() => handleSelectParticipant(item)} left={() => <List.Icon icon={isSelected ? "checkbox-marked" : "checkbox-blank-outline"} />} style={isSelected ? styles.selectedListItem : null} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={getListData()}
        renderItem={renderListItem}
        keyExtractor={(item, index) => item.Matricule || item.ID_de_cabinet?.toString() || index.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollViewContent: { padding: 16, flexGrow: 1 },
  formationCard: { marginBottom: 16, borderRadius: 8, elevation: 2 },
  formationTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: COLORS.primary },
  formationObjectif: { fontSize: 14 },
  label: { fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: COLORS.text },
  card: { marginBottom: 8, borderRadius: 8 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginLeft: 8, fontSize: 14, color: COLORS.text },
  datePickerContainer: { marginBottom: 16 },
  dateButton: { marginBottom: 8 },
  searchBar: { marginBottom: 8 },
  selectedListItem: { backgroundColor: COLORS.lightBlue },
  selectedCard: { marginBottom: 16, backgroundColor: COLORS.lightGray, borderRadius: 8 },
  selectedTitle: { fontWeight: 'bold', marginBottom: 4, color: COLORS.primary },
  selectedParticipantsContainer: { marginBottom: 16, padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 },
  participantsChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  participantChip: { margin: 2, backgroundColor: COLORS.lightGray },
  saveButton: { marginTop: 20, backgroundColor: COLORS.primary, paddingVertical: 8 },
  confirmButton: {
    marginTop: 16,
    backgroundColor: COLORS.success, // Use a different color to distinguish it
    paddingVertical: 8,
  },
});

export default SessionCreationScreen;
