import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator, Searchbar, Chip, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { sessionService } from '../services/api';
import { COLORS, getStatutColor } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const SessionsScreen = () => {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState([]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionService.getAll();
      setSessions(response.data.data);
      setFilteredSessions(response.data.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = sessions.filter(
        (session) =>
          session.nom_formation.toLowerCase().includes(query.toLowerCase()) ||
          session.Type.toLowerCase().includes(query.toLowerCase()) ||
          session.nom_formateur?.toLowerCase().includes(query.toLowerCase()) ||
          session.nom_cabinet?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  };

  const handleDeleteSession = (sessionId, sessionName) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la session "${sessionName}" ? Cette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  };

  const deleteSession = async (sessionId) => {
    try {
      setLoading(true);
      await sessionService.delete(sessionId);
      
      // Update the local state to remove the deleted session
      const updatedSessions = sessions.filter(session => session.Code_de_Session !== sessionId);
      setSessions(updatedSessions);
      setFilteredSessions(updatedSessions);
      
      Alert.alert('Succès', 'Session supprimée avec succès');
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert('Erreur', error.userMessage || 'Erreur lors de la suppression de la session');
    } finally {
      setLoading(false);
    }
  };

  const getSessionStatus = (session) => {
    const today = new Date();
    const startDate = new Date(session.Date_de_Debut);
    const endDate = new Date(session.Date_de_Fin);
    
    if (today < startDate) {
      return { status: 'en_attente', label: STRINGS.EN_ATTENTE };
    } else if (today >= startDate && today <= endDate) {
      return { status: 'en_cours', label: STRINGS.EN_COURS };
    } else {
      return { status: 'termine', label: STRINGS.TERMINEE };
    }
  };

  const renderSessionItem = ({ item }) => {
    const sessionStatus = getSessionStatus(item);
    
    return (
      <Card 
        style={styles.card} 
        onPress={() => navigation.navigate("GestionFormation", { 
          sessionId: item.Code_de_Session, 
          sessionName: item.nom_formation,
          sessionData: item
        })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>{item.nom_formation}</Title>
            <View style={styles.cardActions}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatutColor(sessionStatus.status) }]}
                textStyle={styles.statusText}
              >
                {sessionStatus.label}
              </Chip>
              <IconButton
                icon="delete"
                iconColor={COLORS.error}
                size={20}
                onPress={() => handleDeleteSession(item.Code_de_Session, item.nom_formation)}
                style={styles.deleteButton}
              />
            </View>
          </View>
          
          <Paragraph style={styles.detailText}>
            {STRINGS.DATE_DEBUT}: {new Date(item.Date_de_Debut).toLocaleDateString()}
          </Paragraph>
          <Paragraph style={styles.detailText}>
            {STRINGS.DATE_FIN}: {new Date(item.Date_de_Fin).toLocaleDateString()}
          </Paragraph>
          <Paragraph style={styles.detailText}>
            {STRINGS.TYPE_FORMATION}: {item.Type === 'interne' ? STRINGS.INTERNE : STRINGS.EXTERNE}
          </Paragraph>
          
          {item.Type === 'interne' && item.nom_formateur && (
            <Paragraph style={styles.detailText}>
              {STRINGS.FORMATEUR}: {item.nom_formateur}
            </Paragraph>
          )}
          
          {item.Type === 'externe' && item.nom_cabinet && (
            <Paragraph style={styles.detailText}>
              {STRINGS.CABINET}: {item.nom_cabinet}
            </Paragraph>
          )}
          
          <Paragraph style={styles.detailText}>
            {STRINGS.NOMBRE_PARTICIPANTS}: {item.nombre_participants || 0}
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      
      <Searchbar
        placeholder={STRINGS.RECHERCHER_SESSION}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.Code_de_Session.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.gray} />
              <Paragraph style={styles.emptyText}>{STRINGS.AUCUNE_SESSION}</Paragraph>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
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
    flexGrow: 1,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
  detailText: {
    marginBottom: 4,
    fontSize: 14,
    color: COLORS.text,
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
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default SessionsScreen;

