export const COLORS = {
  primary: '#0e70d8ff', // Darker blue for primary actions and headers
  secondary: '#6c757d', // Gray for secondary elements
  background: '#ffffff', // Light gray for general background
  surface: '#ffffff', // White for cards and elevated surfaces
  text: '#212529', // Dark text for readability
  placeholder: '#adb5bd', // Lighter gray for input placeholders
  border: '#dee2e6', // Light gray for borders
  success: '#28a745', 
  error: '#dc3545', 
  warning: '#ffc107', 
  info: '#17a2b8', 
  lightGray: '#e9ecef', 
  darkGray: '#343a40', 
};

export const getStatutColor = (statut ) => {
  switch (statut) {
    case 'planifie':
      return COLORS.info;
    case 'en cours':
      return COLORS.primary;
    case 'termine':
      return COLORS.success;
    case 'annule':
      return COLORS.error;
    default:
      return COLORS.secondary;
  }
};
