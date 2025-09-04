import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {  Card, Title, Paragraph, Button, ActivityIndicator, Chip, Text } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { sessionService } from '../services/api';
import { COLORS, getStatutColor } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const GestionFormationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, sessionData } = route.params || {} ; // Fallback to empty object if params are not provided

  const [session, setSession] = useState(sessionData || null);
  const [loading, setLoading] = useState(!sessionData);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await sessionService.getById(sessionId);
      setSession(response.data.data);
    } catch (error) {
      console.error('Error loading session details:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (!sessionData) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchSessionDetails();
    }, [sessionId])
  );

  const getSessionStatus = (sessionData) => {
    const today = new Date();
    const startDate = new Date(sessionData.Date_de_Debut);
    const endDate = new Date(sessionData.Date_de_Fin);
    
    if (today < startDate) {
      return { status: 'en_attente', label: STRINGS.EN_ATTENTE };
    } else if (today >= startDate && today <= endDate) {
      return { status: 'en_cours', label: STRINGS.EN_COURS };
    } else {
      return { status: 'termine', label: STRINGS.TERMINEE };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.emptyContainer}>
        <Paragraph>{STRINGS.AUCUNE_SESSION}</Paragraph>
      </View>
    );
  }

  const sessionStatus = getSessionStatus(session);
  const isCertifying = session.categorie_formation === 'certifiant';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Formation Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>{session.nom_formation}</Title>
              <View style={styles.statusContainer}>
                {isCertifying && (
                  <Chip style={styles.certifyingChip} textStyle={styles.chipText}>
                    {STRINGS.AVEC_CERTIFICAT}
                  </Chip>
                )}
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatutColor(sessionStatus.status) }]}
                  textStyle={styles.statusText}
                >
                  {sessionStatus.label}
                </Chip>
              </View>
            </View>
            
            <View style={styles.typeContainer}>
              <Chip 
                style={[styles.typeChip, { 
                  backgroundColor: session.Type === 'interne' ? COLORS.info : COLORS.secondary 
                }]}
                textStyle={styles.chipText}
              >
                {session.Type === 'interne' ? STRINGS.INTERNE : STRINGS.EXTERNE}
              </Chip>
            </View>

            <Paragraph style={styles.detailText}>
              <Text style={styles.label}>{STRINGS.DESCRIPTION}:</Text> {session.description_formation}
            </Paragraph>
            <Paragraph style={styles.detailText}>
              <Text style={styles.label}>{STRINGS.OBJECTIF_PEDAGOGIQUE}:</Text> {session.objectif_formation}
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Session Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{STRINGS.DETAILS_SESSION}</Title>
            <Paragraph style={styles.detailText}>
              <Text style={styles.label}>{STRINGS.DATE_DEBUT}:</Text> {new Date(session.Date_de_Debut).toLocaleDateString()}
            </Paragraph>
            <Paragraph style={styles.detailText}>
              <Text style={styles.label}>{STRINGS.DATE_FIN}:</Text> {new Date(session.Date_de_Fin).toLocaleDateString()}
            </Paragraph>
            
            {session.Type === 'interne' && session.nom_formateur && (
              <Paragraph style={styles.detailText}>
                <Text style={styles.label}>{STRINGS.FORMATEUR}:</Text> {session.nom_formateur}
              </Paragraph>
            )}
            
            {session.Type === 'externe' && (
              <>
                {session.nom_cabinet && (
                  <Paragraph style={styles.detailText}>
                    <Text style={styles.label}>{STRINGS.CABINET}:</Text> {session.nom_cabinet}
                  </Paragraph>
                )}
                {session.telephone_cabinet && (
                  <Paragraph style={styles.detailText}>
                    <Text style={styles.label}>{STRINGS.TELEPHONE}:</Text> {session.telephone_cabinet}
                  </Paragraph>
                )}
                {session.emplacement_cabinet && (
                  <Paragraph style={styles.detailText}>
                    <Text style={styles.label}>{STRINGS.EMPLACEMENT}:</Text> {session.emplacement_cabinet}
                  </Paragraph>
                )}
              </>
            )}
            
            <Paragraph style={styles.detailText}>
              {STRINGS.NOMBRE_PARTICIPANTS}: {session.nombre_participants ?? sessionData?.nombre_participants ?? 0}
            </Paragraph>

          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>{STRINGS.ACTIONS}</Title>
            
            <Button
              mode="contained"
              onPress={() => {
                if (session.Type === 'interne') {
                  navigation.navigate("MembresFormationInterne", { 
                    sessionId: session.Code_de_Session, 
                    sessionName: session.nom_formation,
                    sessionData: session
                  });
                } else {
                  navigation.navigate("MembresFormationExterne", { 
                    sessionId: session.Code_de_Session, 
                    sessionName: session.nom_formation,
                    sessionData: session
                  });
                }
              }}
              style={styles.actionButton}
              icon="account-group"
            >
              {STRINGS.MEMBRES}
            </Button>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate("GestionPresences", { 
                sessionId: session.Code_de_Session, 
                sessionName: session.nom_formation,
                sessionData: session
              })}
              style={styles.actionButton}
              icon="calendar-check"
            >
              {STRINGS.PRESENCE}
            </Button>
            
            {isCertifying && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate("Certification", { 
                  sessionId: session.Code_de_Session, 
                  sessionName: session.nom_formation,
                  sessionData: session
                })}
                style={styles.actionButton}
                icon="certificate"
              >
                {STRINGS.CERTIFICATION}
              </Button>
            )}
          </Card.Content>
        </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  typeContainer: {
    marginBottom: 12,
  },
  certifyingChip: {
    backgroundColor: COLORS.success,
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-end',
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailText: {
    marginBottom: 8,
    fontSize: 14,
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
  },
});

export default GestionFormationScreen;
