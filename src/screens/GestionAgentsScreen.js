import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator, Searchbar, Dialog, Portal, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { agentService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const GestionAgentsScreen = () => {
  const navigation = useNavigation();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await agentService.getAll();
      setAgents(response.data.data);
      setFilteredAgents(response.data.data);
    } catch (error) {
      console.error('Error loading agents:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAgents();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAgents();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = agents.filter(
        (agent) =>
          agent.Nom.toLowerCase().includes(query.toLowerCase()) ||
          agent.Matricule.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents(agents);
    }
  };

  const showDeleteDialog = (agent) => {
    setSelectedAgent(agent);
    setDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDialogVisible(false);
    setSelectedAgent(null);
  };

  const handleDeleteAgent = async () => {
    if (selectedAgent) {
      try {
        setLoading(true);
        await agentService.delete(selectedAgent.Matricule);
        Alert.alert(STRINGS.SUCCES, STRINGS.AGENT_SUPPRIME);
        fetchAgents();
      } catch (error) {
        console.error('Error deleting agent:', error);
        Alert.alert(STRINGS.ERREUR_SUPPRESSION, error.userMessage || STRINGS.ERREUR_RESEAU);
      } finally {
        setLoading(false);
        hideDeleteDialog();
      }
    }
  };

  const renderAgentItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.Nom}</Title>
        <Paragraph>{STRINGS.MATRICULE}: {item.Matricule}</Paragraph>
        <Paragraph>{STRINGS.FONCTION}: {item.Fonction}</Paragraph>
        <Paragraph>{STRINGS.DATE_EMBAUCHE}: {item.date_d_embauche}</Paragraph>
        {item.domaine_formateur && (
          <Paragraph>{STRINGS.DOMAINE}: {item.domaine_formateur}</Paragraph>
        )}
        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('CreateAgent', { agent: item })}
            style={styles.actionButton}
          >
            {STRINGS.MODIFIER}
          </Button>
          <Button
            mode="outlined"
            onPress={() => showDeleteDialog(item)}
            style={styles.actionButton}
            labelStyle={{ color: COLORS.error }}
          >
            {STRINGS.SUPPRIMER}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View>
        <Button
          mode="contained"
           onPress={() => navigation.navigate("CreateAgent")}
          style={styles.createButton}
                   >
          {STRINGS.AJOUTER_AGENT}
          </Button>              
      </View>
      <Searchbar
        placeholder={STRINGS.RECHERCHER_AGENT}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : (
        <FlatList
          data={filteredAgents}
          renderItem={renderAgentItem}
          keyExtractor={(item) => item.Matricule}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Paragraph>{STRINGS.AUCUN_AGENT}</Paragraph>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>{STRINGS.CONFIRMER_SUPPRESSION}</Dialog.Title>
          <Dialog.Content>
            <Text>{STRINGS.CONFIRMER_SUPPRESSION_AGENT}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>{STRINGS.ANNULER}</Button>
            <Button onPress={handleDeleteAgent} labelStyle={{ color: COLORS.error }}>{STRINGS.SUPPRIMER}</Button>
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
  searchBar: {
    margin: 8,
    borderRadius: 8,
  },
  listContent: {
    padding: 8,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    marginLeft: 8,
  },
  activityIndicator: {
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 8,
    paddingVertical:2,
    marginVertical: 8,
    alignSelf:'flex-end',
  },
});

export default GestionAgentsScreen;
