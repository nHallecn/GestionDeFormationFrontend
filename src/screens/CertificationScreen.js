import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Appbar, Card, Title, Button, ActivityIndicator, Text, TextInput, DataTable } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { evaluationService } from '../services/api';
import { COLORS } from '../constants/colors';
import { STRINGS } from '../constants/strings';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


const CertificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, sessionName, sessionData } = route.params;

  const [evaluationMatrix, setEvaluationMatrix] = useState(null);
  const [competences, setCompetences] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  

  const fetchEvaluationMatrix = async () => {
    try {
      setLoading(true);
      const response = await evaluationService.getSessionEvaluationMatrix(sessionId);
      const matrix = response.data.data;
      
      setEvaluationMatrix(matrix);
      setCompetences(matrix.competences || []);
      setParticipants(matrix.participants || []);
      
      // Initialize scores state
      const scoresData = {};
      matrix.participants?.forEach(participant => {
        participant.evaluations?.forEach(evaluation => {
          const key = `${participant.matricule}_${evaluation.competenceId}`;
          scoresData[key] = evaluation.score?.toString() || '';
        });
      });
      setScores(scoresData);
    } catch (error) {
      console.error('Error loading evaluation matrix:', error);
      Alert.alert(STRINGS.ERREUR_CHARGEMENT, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationMatrix();
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchEvaluationMatrix();
    }, [sessionId])
  );

  const handleScoreChange = (matricule, competenceId, score) => {
    const key = `${matricule}_${competenceId}`;
    
    // Validate score (0-20)
    const numericScore = parseFloat(score);
    if (score !== '' && (isNaN(numericScore) || numericScore < 0 || numericScore > 20)) {
      Alert.alert(STRINGS.ERREUR, STRINGS.NOTE_INVALIDE);
      return;
    }
    
    setScores(prev => ({
      ...prev,
      [key]: score
    }));
  };

  const calculateAverage = (matricule) => {
    const participantScores = competences.map(competence => {
      const key = `${matricule}_${competence.ID_de_competence}`;
      const score = scores[key];
      return score !== '' ? parseFloat(score) : null;
    }).filter(score => score !== null);
    
    if (participantScores.length === 0) return null;
    
    const average = participantScores.reduce((sum, score) => sum + score, 0) / participantScores.length;
    return Math.round(average * 100) / 100; // Round to 2 decimal places
  };

  const isAdmitted = (average) => {
    return average !== null && average >= 10;
  };

    const handleSaveEvaluations = async () => {
    setSaving(true);
    
    const evaluationsData = [];
    participants.forEach(participant => {
      competences.forEach(competence => {
        const key = `${participant.matricule}_${competence.ID_de_competence}`;
        const score = scores[key];
        
        if (score !== '' && !isNaN(parseFloat(score))) {
          evaluationsData.push({
            code_de_Session: sessionId,
            Matricule: participant.matricule,
            ID_de_competence: competence.ID_de_competence,
            Score: parseFloat(score)
          });
        }
      });
    });

    try {
      // Pass the array directly
      await evaluationService.saveEvaluations(evaluationsData);
      Alert.alert(STRINGS.SUCCES, STRINGS.EVALUATIONS_ENREGISTREES);
      fetchEvaluationMatrix(); // Refresh data
    } catch (error) {
      console.error('Error saving evaluations:', error);
      Alert.alert(STRINGS.ERREUR_SAUVEGARDE, error.userMessage || STRINGS.ERREUR_RESEAU);
    } finally {
      setSaving(false);
    }
  };

  //pdf export
    const handleExportResults = async () => {
    // 1. Generate the HTML content for the PDF
    const createHTML = () => {
      // We build the table rows dynamically
      const participantRows = participants.map(participant => {
        const average = calculateAverage(participant.matricule);
        const admitted = isAdmitted(average);
        const statusText = average !== null ? (admitted ? STRINGS.ADMIS : STRINGS.NON_ADMIS) : '-';
        
        // Create a cell for each competence score
        const scoreCells = competences.map(competence => {
          const key = `${participant.matricule}_${competence.ID_de_competence}`;
          const score = scores[key] || '-';
          return `<td class="cell">${score}</td>`;
        }).join('');

        return `
          <tr>
            <td class="cell">${participant.nom}</td>
            ${scoreCells}
            <td class="cell average ${admitted ? 'success' : 'error'}">${average !== null ? average.toFixed(2) : '-'}</td>
            <td class="cell status ${admitted ? 'success' : 'error'}">${statusText}</td>
          </tr>
        `;
      }).join('');

      // Create header cells for each competence
      const competenceHeaders = competences.map(c => `<th class="header">${c.Competence_a_Acquerir}</th>`).join('');

      return `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; color: #333; }
              h1 { color: #005a9c; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .header { background-color: #f2f2f2; font-size: 10px; }
              .cell { font-size: 12px; }
              .average, .status { font-weight: bold; }
              .success { color: green; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h1>${STRINGS.RESULTATS_SESSION} - ${sessionName}</h1>
            <table>
              <thead>
                <tr>
                  <th class="header">${STRINGS.PARTICIPANT}</th>
                  ${competenceHeaders}
                  <th class="header">${STRINGS.MOYENNE}</th>
                  <th class="header">${STRINGS.STATUT}</th>
                </tr>
              </thead>
              <tbody>
                ${participantRows}
              </tbody>
            </table>
          </body>
        </html>
      `;
    };

    const htmlContent = createHTML();

try {
  // 1. Generate the PDF with expo-print
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    fileName: `Resultats_${sessionName.replace(/\s/g, '_')}`,
  });
  console.log('PDF generated at:', uri);

  // 2. Share the PDF with expo-sharing
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  } else {
    Alert.alert(STRINGS.ERREUR, "Le partage n'est pas disponible sur cet appareil.");
  }
} catch (error) {
  console.error('Error exporting PDF:', error);
  Alert.alert(STRINGS.ERREUR, STRINGS.ERREUR_EXPORT_PDF);
}

  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Session Info */}
        <Card style={styles.sessionCard}>
          <Card.Content>
            <Title style={styles.sessionTitle}>{sessionName}</Title>
            <Text style={styles.sessionInfo}>
              {STRINGS.NOMBRE_PARTICIPANTS}: {participants.length}
            </Text>
            <Text style={styles.sessionInfo}>
              {STRINGS.NOMBRE_COMPETENCES}: {competences.length}
            </Text>
          </Card.Content>
        </Card>

        {/* Evaluation Matrix */}
        <Card style={styles.matrixCard}>
          <Card.Content>
            <Title style={styles.matrixTitle}>{STRINGS.MATRICE_EVALUATION}</Title>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <DataTable style={styles.dataTable}>
                {/* Header */}
                <DataTable.Header>
                  <DataTable.Title style={styles.nameColumn}>
                    <Text style={styles.headerText}>{STRINGS.PARTICIPANT}</Text>
                  </DataTable.Title>
                  {competences.map(competence => (
                    <DataTable.Title key={competence.ID_de_competence} style={styles.scoreColumn}>
                      <Text style={styles.headerText} numberOfLines={2}>
                        {competence.Competence_a_Acquerir.substring(0, 15)}...
                      </Text>
                    </DataTable.Title>
                  ))}
                  <DataTable.Title style={styles.averageColumn}>
                    <Text style={styles.headerText}>{STRINGS.MOYENNE}</Text>
                  </DataTable.Title>
                  <DataTable.Title style={styles.statusColumn}>
                    <Text style={styles.headerText}>{STRINGS.STATUT}</Text>
                  </DataTable.Title>
                </DataTable.Header>

                {/* Rows */}
                {participants.map(participant => {
                  const average = calculateAverage(participant.matricule);
                  const admitted = isAdmitted(average);
                  
                  return (
                    <DataTable.Row key={participant.matricule}>
                      <DataTable.Cell style={styles.nameColumn}>
                        <Text style={styles.participantName}>{participant.nom}</Text>
                      </DataTable.Cell>
                      
                      {competences.map(competence => {
                        const key = `${participant.matricule}_${competence.ID_de_competence}`;
                        return (
                          <DataTable.Cell key={competence.ID_de_competence} style={styles.scoreColumn}>
                            <TextInput
                              value={scores[key] || ''}
                              onChangeText={(text) => handleScoreChange(participant.matricule, competence.ID_de_competence, text)}
                              keyboardType="numeric"
                              style={styles.scoreInput}
                              placeholder="0-20"
                              dense
                            />
                          </DataTable.Cell>
                        );
                      })}
                      
                      <DataTable.Cell style={styles.averageColumn}>
                        <Text style={[styles.averageText, { color: admitted ? COLORS.success : COLORS.error }]}>
                          {average !== null ? average.toFixed(2) : '-'}
                        </Text>
                      </DataTable.Cell>
                      
                      <DataTable.Cell style={styles.statusColumn}>
                        <Text style={[styles.statusText, { color: admitted ? COLORS.success : COLORS.error }]}>
                          {average !== null ? (admitted ? STRINGS.ADMIS : STRINGS.NON_ADMIS) : '-'}
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })}
              </DataTable>
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title>{STRINGS.ACTIONS}</Title>
            
            <Button
              mode="contained"
              onPress={handleSaveEvaluations}
              style={styles.actionButton}
              disabled={saving}
              icon="content-save"
            >
              {saving ? <ActivityIndicator color={COLORS.white} /> : STRINGS.ENREGISTRER_EVALUATIONS}
            </Button>
            
            <Button
              mode="contained"
              onPress={handleExportResults}
              style={styles.actionButton}
              icon="file-pdf-box"
            >
              {STRINGS.EXPORTER_RESULTATS_PDF}
            </Button>
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
  scrollViewContent: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sessionInfo: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  matrixCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  matrixTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dataTable: {
    minWidth: 800,
  },
  nameColumn: {
    minWidth: 120,
    maxWidth: 120,
  },
  scoreColumn: {
    minWidth: 80,
    maxWidth: 80,
    justifyContent: 'center',
  },
  averageColumn: {
    minWidth: 80,
    maxWidth: 80,
    justifyContent: 'center',
  },
  statusColumn: {
    minWidth: 100,
    maxWidth: 100,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  participantName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreInput: {
    height: 40,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  averageText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionsCard: {
    borderRadius: 8,
    elevation: 2,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
  },
});

export default CertificationScreen;
