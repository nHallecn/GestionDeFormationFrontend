import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Appbar, Card, Title, Button, ActivityIndicator, Switch, Text, ToggleButton } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { presenceService, sessionService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';

const GestionPresencesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, sessionName, sessionData } = route.params;

  const [sessionDates, setSessionDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [presences, setPresences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quickToggleAll, setQuickToggleAll] = useState('present');

// In GestionPresencesScreen.js

const fetchSessionDates = async () => {
  try {
    const response = await presenceService.getSessionDates(sessionId);
    
    // --- FIX IS HERE ---
    // Destructure the 'dates' array from the response object.
    const datesArray = response.data.data.dates; 
    
    // Ensure what you received is actually an array before setting state.
    if (Array.isArray(datesArray)) {
      setSessionDates(datesArray);
      
      if (datesArray.length > 0 && !selectedDate) {
        // The items in datesArray are objects: { date: 'YYYY-MM-DD', hasPresences: ... }
        // You need to select the date string from the first object.
        setSelectedDate(datesArray[0].date); 
      }
    } else {
        console.error("API did not return a valid dates array:", response.data.data);
        setSessionDates([]); // Set to empty array on failure
    }
    // --- END FIX ---

  } catch (error) {
    console.error('Error loading session dates:', error);
    if (loading) setLoading(false);
    Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
  }
};



  const fetchPresencesByDate = async (date) => {
    if (!date) return;
    
    try {
      setLoading(true);
      const response = await presenceService.getPresencesByDate(sessionId, date);
      const participantsData = response.data.data;
      
      setParticipants(participantsData);
      
      // Initialize presences state
      const presencesData = {};
      participantsData.forEach(participant => {
        presencesData[participant.Matricule] = participant.statut === 'present';
      });
      setPresences(presencesData);
    } catch (error) {
      console.error('Error loading presences:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDates();
  }, [sessionId]);

  useEffect(() => {
    if (selectedDate) {
      fetchPresencesByDate(selectedDate);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchSessionDates();
    }, [sessionId])
  );

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handlePresenceToggle = (matricule, isPresent) => {
    setPresences(prev => ({
      ...prev,
      [matricule]: isPresent
    }));
  };

  const handleQuickToggleAll = () => {
    const newStatus = quickToggleAll === 'present';
    const updatedPresences = {};
    
    participants.forEach(participant => {
      updatedPresences[participant.Matricule] = newStatus;
    });
    
    setPresences(updatedPresences);
    setQuickToggleAll(quickToggleAll === 'present' ? 'absent' : 'present');
  };

  // In GestionPresencesScreen.js

const handleSavePresences = async () => {
  if (!selectedDate) {
    Alert.alert(STRINGS.ERREUR, STRINGS.DATE_REQUISE);
    return;
  }

  setSaving(true);
  
  const presencesData = participants.map(participant => ({
    Code_de_Session: sessionId,
    Matricule: participant.Matricule,
    Date: selectedDate,
    statut: presences[participant.Matricule] ? 'present' : 'absent'
  }));

  try {
    // --- FIX IS HERE ---
    // Pass the array `presencesData` directly to the service function.
    // The service will handle wrapping it in the { presences: ... } object.
    await presenceService.recordPresences(presencesData);
    // --- END FIX ---

    Alert.alert(STRINGS.SUCCES, STRINGS.PRESENCES_ENREGISTREES);
  } catch (error) {
    console.error('Error saving presences:', error);
    // You can even show the validation errors to the user
    const errorMessage = error.response?.data?.message || error.userMessage || STRINGS.ERREUR_RESEAU;
    Alert.alert(STRINGS.ERREUR_SAUVEGARDE, errorMessage);
  } finally {
    setSaving(false);
  }
};


  const isTrainingDay = (date) => {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday (0) or Saturday (6)
  };

  const formatDateDisplay = (date) => {
    const dateObj = new Date(date);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    return {
      dayName: days[dateObj.getDay()],
      dayNumber: dateObj.getDate(),
      monthName: months[dateObj.getMonth()]
    };
  };

  const renderDateItem = (dateObject) => { // The parameter is now an object
  const { date, hasPresences } = dateObject; // Destructure the object
  const isSelected = selectedDate === date;
  const isTraining = isTrainingDay(date);
  const dateDisplay = formatDateDisplay(date);
    
    return (
      <Button
        key={date}
        mode={isSelected ? "contained" : "outlined"}
        onPress={() => handleDateSelect(date)}
        style={[
          styles.dateButton,
          {
            backgroundColor: isSelected 
              ? COLORS.primary 
              : isTraining 
                ? COLORS.lightBlue 
                : COLORS.lightGray,
            borderColor: isTraining ? COLORS.primary : COLORS.gray
          }
        ]}
        labelStyle={[
          styles.dateButtonLabel,
          { color: isSelected ? COLORS.white : isTraining ? COLORS.primary : COLORS.gray }
        ]}
      >
        {`${dateDisplay.dayName}\n${dateDisplay.dayNumber}\n${dateDisplay.monthName}`}
      </Button>
    );
  };

  const renderParticipantItem = ({ item }) => {
    const isPresent = presences[item.Matricule] || false;
    
    return (
      <Card style={styles.participantCard}>
        <Card.Content>
          <View style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <Title style={styles.participantName}>{item.Nom}</Title>
              <Text style={styles.participantDetails}>
                {item.Matricule} - {item.Fonction}
              </Text>
            </View>
            <View style={styles.presenceToggle}>
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleLabel, { color: !isPresent ? COLORS.error : COLORS.gray }]}>
                  {STRINGS.ABSENT}
                </Text>
                <Switch
                  value={isPresent}
                  onValueChange={(value) => handlePresenceToggle(item.Matricule, value)}
                  color={COLORS.success}
                />
                <Text style={[styles.toggleLabel, { color: isPresent ? COLORS.success : COLORS.gray }]}>
                  {STRINGS.PRESENT}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>

      {/* Session Info
      <Card style={styles.sessionCard}>
        <Card.Content>
          <Title style={styles.sessionTitle}>{sessionName}</Title>
          <Text style={styles.sessionDates}>
            {sessionData?.Date_de_Debut && sessionData?.Date_de_Fin && 
              `${new Date(sessionData.Date_de_Debut).toLocaleDateString()} - ${new Date(sessionData.Date_de_Fin).toLocaleDateString()}`
            }
          </Text>
        </Card.Content>
      </Card> */}

      {/* Horizontal Date Scroll */}
      <View style={styles.datesContainer}>
        <Text style={styles.sectionTitle}>{STRINGS.SELECTIONNER_DATE}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesScrollContent}
        >
         {Array.isArray(sessionDates) && sessionDates.map(date => renderDateItem(date))}

        </ScrollView>
      </View>

      {/* Selected Date Info */}
      {selectedDate && (
        <Card style={styles.selectedDateCard}>
          <Card.Content>
            <View style={styles.selectedDateHeader}>
              <Title style={styles.selectedDateTitle}>
                {STRINGS.PRESENCE_DU} {new Date(selectedDate).toLocaleDateString()}
              </Title>
              <Button
                mode="outlined"
                onPress={handleQuickToggleAll}
                style={styles.quickToggleButton}
                icon={quickToggleAll === 'present' ? 'check-all' : 'close-circle-outline'}
              >
                {quickToggleAll === 'present' ? STRINGS.MARQUER_TOUS_PRESENTS : STRINGS.MARQUER_TOUS_ABSENTS}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Participants List */}
      {loading ? (
        <ActivityIndicator animating={true} color={COLORS.primary} style={styles.activityIndicator} />
      ) : selectedDate ? (
        <FlatList
          data={participants}
          renderItem={renderParticipantItem}
          keyExtractor={(item) => item.Matricule}
          contentContainerStyle={styles.participantsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{STRINGS.AUCUN_PARTICIPANT}</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{STRINGS.SELECTIONNER_DATE_PRESENCE}</Text>
        </View>
      )}

      {/* Save Button */}
      {selectedDate && participants.length > 0 && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            onPress={handleSavePresences}
            style={styles.saveButton}
            disabled={saving}
            icon="content-save"
          >
            {saving ? <ActivityIndicator color={COLORS.white} /> : STRINGS.ENREGISTRER_PRESENCES}
          </Button>
        </View>
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
  sessionCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sessionDates: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  datesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    color: COLORS.text,
  },
  datesScrollContent: {
    paddingHorizontal: 16,
  },
  dateButton: {
    marginHorizontal: 4,
    minWidth: 60,
    height: 80,
    justifyContent: 'center',
  },
  dateButtonLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedDateCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    backgroundColor: COLORS.lightBlue,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  quickToggleButton: {
    marginLeft: 8,
  },
  participantsList: {
    padding: 8,
    flexGrow: 1,
  },
  participantCard: {
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    elevation: 1,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  presenceToggle: {
    marginLeft: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 8,
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
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
  },
});

export default GestionPresencesScreen;
