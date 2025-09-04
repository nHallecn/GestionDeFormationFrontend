import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator, FAB, Divider, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { catalogueService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const CatalogueScreen = () => {
  const navigation = useNavigation();
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const fetchCatalogues = async () => {
    try {
      setLoading(true);
      const response = await catalogueService.getAll();
      setCatalogues(response.data.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catalogues:", error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalogues();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCatalogues();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCatalogues();
  }, []);

  const toggleExpanded = (catalogueId) => {
    setExpandedItems(prev => ({
      ...prev,
      [catalogueId]: !prev[catalogueId]
    }));
  };

// The new, improved function to replace the old one
const handleDeleteCatalogue = async (catalogueId) => {
  Alert.alert(
    STRINGS.CONFIRMER_SUPPRESSION,
    STRINGS.CONFIRMER_SUPPRESSION_FORMATION,
    [
      { text: STRINGS.ANNULER, style: 'cancel' },
      {
        text: STRINGS.SUPPRIMER,
        style: 'destructive',
        onPress: async () => {
          try {
            await catalogueService.delete(catalogueId);
            Alert.alert(STRINGS.SUCCES, STRINGS.FORMATION_SUPPRIMEE);
            fetchCatalogues(); // Refresh the list on success
          } catch (error) {
            // --- START OF THE NEW LOGIC ---

            // Check if this is an API error with a response from the server
            if (error.response) {
              // Check if it's our specific "in-use" error (status 400)
              if (error.response.status === 400) {
                // This is the handled error. Show the specific message from the API.
                Alert.alert(
                  STRINGS.ERREUR_SUPPRESSION,
                  error.response.data.message || STRINGS.CATALOGUE_EN_COURS_UTILISATION // Fallback message
                );
                // We DO NOT log this to the console because it's expected.
              } else {
                // It's another, unexpected API error (like 500, 404, 401)
                console.error("API Error on delete:", error.response.data);
                Alert.alert(STRINGS.ERREUR_SUPPRESSION, `Une erreur serveur est survenue: ${error.response.status}`);
              }
            } else {
              // It's a network error or a different kind of problem
              console.error("Network or other error on delete:", error);
              Alert.alert(STRINGS.ERREUR_SUPPRESSION, STRINGS.ERREUR_RESEAU);
            }
            // --- END OF THE NEW LOGIC ---
          }
        }
      }
    ]
  );
};


  const renderCatalogueItem = ({ item }) => {
    const isExpanded = expandedItems[item.ID_de_catalogue];
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>{item.Nom}</Title>
            <Button
              mode="text"
              onPress={() => toggleExpanded(item.ID_de_catalogue)}
              icon={isExpanded ? "chevron-up" : "chevron-down"}
            >
              {isExpanded ? STRINGS.REDUIRE : STRINGS.DETAILS}
            </Button>
          </View>
          
          {isExpanded && (
            <View style={styles.expandedContent}>
              <Divider style={styles.divider} />
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>{STRINGS.DESCRIPTION}:</Text> {item.Description}
              </Paragraph>
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>{STRINGS.OBJECTIF_PEDAGOGIQUE}:</Text> {item.Objectif_Pedagogique}
              </Paragraph>
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>{STRINGS.PREREQUIS}:</Text> {item.Prerequis}
              </Paragraph>
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>{STRINGS.CATEGORIE}:</Text> {item.Categorie}
              </Paragraph>
              
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("SessionCreation", { 
                    catalogueId: item.ID_de_catalogue, 
                    catalogueName: item.Nom,
                   isInternal: true
                  })}
                  style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                  labelStyle={styles.buttonLabel}
                >
                  {STRINGS.CREER_SESSION}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("CreationFormation", { catalogue: item })}
                  style={styles.actionButton}
                  labelStyle={styles.buttonLabel}
                >
                  {STRINGS.MODIFIER}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleDeleteCatalogue(item.ID_de_catalogue)}
                  style={styles.actionButton}
                  labelStyle={[styles .buttonLabel, { color: COLORS.error }]}
                >
                  {STRINGS.SUPPRIMER}
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : (
        <FlatList
          data={catalogues}
          renderItem={renderCatalogueItem}
          keyExtractor={(item) => item.ID_de_catalogue.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={64} color={COLORS.gray} />
              <Paragraph style={styles.emptyText}>{STRINGS.AUCUNE_FORMATION}</Paragraph>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("CreationFormation")}
                style={styles.createButton}
              >
                {STRINGS.CREER_FORMATION}
              </Button>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
      
      {catalogues.length > 0 && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate("CreationFormation")}
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
  listContent: {
    padding: 8,
    flexGrow: 1,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 0,
    elevation: 2,
    borderWidth: 1,
  borderColor: '#0e70d8ff', 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  detailText: {
    marginBottom: 8,
    fontSize: 14,
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 100,
  },
  buttonLabel: {
    fontSize: 12,
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
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.gray,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default CatalogueScreen;
