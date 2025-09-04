import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator, Dialog, Portal, Text, List, Searchbar } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { sessionService, agentService, presenceService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const MembresFormationInterneScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, sessionName, sessionData } = route.params;

  const [participants, setParticipants] = useState([]);
  const [formateur, setFormateur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addParticipantDialogVisible, setAddParticipantDialogVisible] = useState(false);
  const [removeParticipantDialogVisible, setRemoveParticipantDialogVisible] = useState(false);
  const [agentsList, setAgentsList] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantPresences, setParticipantPresences] = useState({});

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await sessionService.getParticipants(sessionId);
      setParticipants(response.data.data);
      
      // Get trainer info from session data
      if (sessionData?.nom_formateur) {
        setFormateur({
          Nom: sessionData.nom_formateur,
          Matricule: sessionData.Matricule_du_formateur
        });
      }
      
      // Fetch presence data for each participant
      await fetchParticipantPresences(response.data.data);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchParticipantPresences = async (participantsList) => {
    try {
      const presencesData = {};
      for (const participant of participantsList) {
        const response = await presenceService.getParticipantPresenceSummary(sessionId, participant.Matricule);
        presencesData[participant.Matricule] = response.data.data.summary;
      }
      setParticipantPresences(presencesData);
    } catch (error) {
      console.error('Error loading presences:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await agentService.getAll();
      const availableAgents = response.data.data.filter(
        agent => !participants.find(p => p.Matricule === agent.Matricule)
      );
      setAgentsList(availableAgents);
      setFilteredAgents(availableAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchParticipants();
    }, [sessionId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParticipants();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = agentsList.filter(
        (agent) =>
          agent.Nom.toLowerCase().includes(query.toLowerCase()) ||
          agent.Matricule.toLowerCase().includes(query.toLowerCase()) ||
          agent.Fonction.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents(agentsList);
    }
  };

  const showAddParticipantDialog = () => {
    fetchAgents();
    setAddParticipantDialogVisible(true);
  };

  const hideAddParticipantDialog = () => {
    setAddParticipantDialogVisible(false);
    setSearchQuery('');
  };

  const showRemoveParticipantDialog = (participant) => {
    setSelectedParticipant(participant);
    setRemoveParticipantDialogVisible(true);
  };

  const hideRemoveParticipantDialog = () => {
    setRemoveParticipantDialogVisible(false);
    setSelectedParticipant(null);
  };

  const handleAddParticipant = async (agent) => {
    try {
      await sessionService.addParticipant(sessionId, agent.Matricule);
      Alert.alert(STRINGS.SUCCES, STRINGS.PARTICIPANT_AJOUTE);
      hideAddParticipantDialog();
      fetchParticipants();
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert(STRINGS.ERREUR_AJOUT, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!selectedParticipant) return;

    try {
      await sessionService.removeParticipant(sessionId, selectedParticipant.Matricule);
      Alert.alert(STRINGS.SUCCES, STRINGS.PARTICIPANT_SUPPRIME);
      hideRemoveParticipantDialog();
      fetchParticipants();
    } catch (error) {
      console.error('Error removing participant:', error);
      Alert.alert(STRINGS.ERREUR_SUPPRESSION, error.userMessage || STRINGS.ERREUR_RESEAU);
    }
  };

  const renderParticipantItem = ({ item }) => {
    const presenceData = participantPresences[item.Matricule];
    
    return (
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.participantHeader}>
            <View style={styles.participantInfo}>
              <Title style={styles.participantName}>{item.Nom}</Title>
              <Paragraph style={styles.participantDetails}>
                {item.Matricule} - {item.Fonction}
              </Paragraph>
            </View>
            <Button
              mode="outlined"
              onPress={() => showRemoveParticipantDialog(item)}
              style={styles.removeButton}
              labelStyle={{ color: COLORS.error }}
              compact
            >
              {STRINGS.SUPPRIMER}
            </Button>
          </View>
          
          {presenceData && (
            <View style={styles.presenceInfo}>
              <Text style={styles.presenceLabel}>{STRINGS.PRESENCE}:</Text>
              <Text style={styles.presenceText}>
                {STRINGS.PRESENT}: {presenceData.presentDays} | {STRINGS.ABSENT}: {presenceData.absentDays}
              </Text>
              <Text style={styles.attendanceRate}>
                {STRINGS.TAUX_PRESENCE}: {presenceData.attendanceRate}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderAgentItem = ({ item }) => (
    <List.Item
      title={item.Nom}
      description={`${item.Matricule} - ${item.Fonction}`}
      onPress={() => handleAddParticipant(item)}
      left={() => <List.Icon icon="account-plus" />}
    />
  );

  return (
    <View style={styles.container}>
      {/* Trainer Information */}
      {formateur && (
        <Card style={styles.trainerCard}>
          <Card.Content>
            <Title style={styles.trainerTitle}>{STRINGS.FORMATEUR}</Title>
            <Paragraph style={styles.trainerName}>{formateur.Nom}</Paragraph>
          </Card.Content>
        </Card>
      )}
      <Button
                mode="contained"
                 onPress={showAddParticipantDialog}
                style={styles.createButton}
                         >
                {STRINGS.AJOUTER_PARTICIPANT}
                </Button> 
      
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : (
        <FlatList
          data={participants}
          renderItem={renderParticipantItem}
          keyExtractor={(item) => item.Matricule}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Paragraph style={styles.emptyText}>{STRINGS.AUCUN_PARTICIPANT}</Paragraph>
              <Button
                mode="contained"
                onPress={showAddParticipantDialog}
                style={styles.addButton}
              >
                {STRINGS.AJOUTER_PARTICIPANT}
              </Button>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}

      {/* Add Participant Dialog */}
      <Portal>
        <Dialog visible={addParticipantDialogVisible} onDismiss={hideAddParticipantDialog}>
          <Dialog.Title>{STRINGS.AJOUTER_PARTICIPANT}</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder={STRINGS.RECHERCHER_AGENT}
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
            />
            <FlatList
              data={filteredAgents}
              renderItem={renderAgentItem}
              keyExtractor={(item) => item.Matricule}
              style={styles.agentsList}
              ListEmptyComponent={
                <Paragraph style={styles.emptyText}>{STRINGS.AUCUN_AGENT}</Paragraph>
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideAddParticipantDialog}>{STRINGS.ANNULER}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Remove Participant Dialog */}
      <Portal>
        <Dialog visible={removeParticipantDialogVisible} onDismiss={hideRemoveParticipantDialog}>
          <Dialog.Title>{STRINGS.CONFIRMER_SUPPRESSION}</Dialog.Title>
          <Dialog.Content>
            <Text>{STRINGS.CONFIRMER_SUPPRESSION_PARTICIPANT}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideRemoveParticipantDialog}>{STRINGS.ANNULER}</Button>
            <Button onPress={handleRemoveParticipant} labelStyle={{ color: COLORS.error }}>
              {STRINGS.SUPPRIMER}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  trainerCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: COLORS.lightBlue,
  },
  trainerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  trainerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantDetails: {
    fontSize: 14,
    color: COLORS.gray,
  },
  removeButton: {
    marginLeft: 8,
  },
  presenceInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
  },
  presenceLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  presenceText: {
    fontSize: 14,
    marginBottom: 2,
  },
  attendanceRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  activityIndicator: {
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  searchBar: {
    marginBottom: 8,
  },
  agentsList: {
    maxHeight: 300,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 8,
    paddingVertical:2,
    marginVertical: 8,
    alignSelf:'flex-end',
  },
});

export default MembresFormationInterneScreen;
