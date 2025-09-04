import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator, Searchbar, Dialog, Portal, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { cabinetService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const GestionCabinetsScreen = () => {
  const navigation = useNavigation();
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCabinets, setFilteredCabinets] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCabinet, setSelectedCabinet] = useState(null);

  const fetchCabinets = async () => {
    try {
      setLoading(true);
      const response = await cabinetService.getAll();
      setCabinets(response.data.data);
      setFilteredCabinets(response.data.data);
    } catch (error) {
      console.error('Error loading cabinets:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCabinets();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCabinets();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCabinets();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = cabinets.filter(
        (cabinet) =>
          cabinet.Nom.toLowerCase().includes(query.toLowerCase()) ||
          cabinet.Emplacement.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCabinets(filtered);
    } else {
      setFilteredCabinets(cabinets);
    }
  };

  const showDeleteDialog = (cabinet) => {
    setSelectedCabinet(cabinet);
    setDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDialogVisible(false);
    setSelectedCabinet(null);
  };

  const handleDeleteCabinet = async () => {
    if (selectedCabinet) {
      try {
        setLoading(true);
        await cabinetService.delete(selectedCabinet.ID_de_cabinet);
        Alert.alert(STRINGS.SUCCES, STRINGS.CABINET_SUPPRIME);
        fetchCabinets();
      } catch (error) {
        console.error('Error deleting cabinet:', error);
        Alert.alert(STRINGS.ERREUR_SUPPRESSION, error.userMessage || STRINGS.ERREUR_RESEAU);
      } finally {
        setLoading(false);
        hideDeleteDialog();
      }
    }
  };

  const renderCabinetItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.Nom}</Title>
        <Paragraph>{STRINGS.TELEPHONE}: {item.telephone}</Paragraph>
        <Paragraph>{STRINGS.EMPLACEMENT}: {item.Emplacement}</Paragraph>
        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('CreateCabinet', { cabinet: item })}
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
                 onPress={() => navigation.navigate("CreateCabinet")}
                style={styles.createButton}
                         >
                {STRINGS.AJOUTER_CABINET}
                </Button>              
            </View>
      <Searchbar
        placeholder={STRINGS.RECHERCHER_CABINET}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : (
        <FlatList
          data={filteredCabinets}
          renderItem={renderCabinetItem}
          keyExtractor={(item) => item.ID_de_cabinet.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Paragraph>{STRINGS.AUCUN_CABINET}</Paragraph>
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
            <Text>{STRINGS.CONFIRMER_SUPPRESSION_CABINET}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>{STRINGS.ANNULER}</Button>
            <Button onPress={handleDeleteCabinet} labelStyle={{ color: COLORS.error }}>{STRINGS.SUPPRIMER}</Button>
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
  createButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 8,
    paddingVertical:2,
    marginVertical: 8,
    alignSelf:'flex-end',
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
});

export default GestionCabinetsScreen;
