import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Slider,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';

// Icons
import TranslateIcon from '@mui/icons-material/Translate';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import HardwareIcon from '@mui/icons-material/Hardware';
import SecurityIcon from '@mui/icons-material/Security';
import SaveIcon from '@mui/icons-material/Save';

const Settings = () => {
  // State for settings
  const [settings, setSettings] = useState({
    // Accessibility settings
    enableVoiceControl: true,
    enableScreenReader: false,
    textSize: 'medium',
    highContrast: false,
    
    // Language settings
    language: 'en',
    enableMultilingual: true,
    
    // Hardware settings (if applicable)
    enableHardware: false,
    robotType: 'simulation',
    ledBrightness: 70,
    
    // Privacy settings
    saveConversations: false,
    collectAnonymousData: true,
    apiKey: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle changes to settings
  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    // In a real app, this would save to backend/localStorage
    console.log('Saving settings:', settings);
    
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom align="center">
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Accessibility Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessibilityNewIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Accessibility</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableVoiceControl}
                    onChange={(e) => handleSettingChange('enableVoiceControl', e.target.checked)}
                    color="primary"
                  />
                }
                label="Voice Control"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableScreenReader}
                    onChange={(e) => handleSettingChange('enableScreenReader', e.target.checked)}
                    color="primary"
                  />
                }
                label="Screen Reader Support"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.highContrast}
                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                    color="primary"
                  />
                }
                label="High Contrast Mode"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Text Size</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={settings.textSize}
                    onChange={(e) => handleSettingChange('textSize', e.target.value)}
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                    <MenuItem value="x-large">Extra Large</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </FormGroup>
          </Paper>
        </Grid>
        
        {/* Language Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TranslateIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Language</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <FormControl fullWidth sx={{ mb: 3 }} size="small">
              <InputLabel>Primary Language</InputLabel>
              <Select
                value={settings.language}
                label="Primary Language"
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableMultilingual}
                  onChange={(e) => handleSettingChange('enableMultilingual', e.target.checked)}
                  color="primary"
                />
              }
              label="Enable Multilingual Support"
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Multilingual support allows RoboMind to detect and respond in multiple languages.
            </Alert>
          </Paper>
        </Grid>
        
        {/* Hardware Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HardwareIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Hardware</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableHardware}
                  onChange={(e) => handleSettingChange('enableHardware', e.target.checked)}
                  color="primary"
                />
              }
              label="Enable Hardware Integration"
            />
            
            <FormControl fullWidth sx={{ my: 2 }} size="small" disabled={!settings.enableHardware}>
              <InputLabel>Robot Type</InputLabel>
              <Select
                value={settings.robotType}
                label="Robot Type"
                onChange={(e) => handleSettingChange('robotType', e.target.value)}
              >
                <MenuItem value="simulation">Simulation</MenuItem>
                <MenuItem value="raspberry-pi">Raspberry Pi</MenuItem>
                <MenuItem value="jetson-nano">Jetson Nano</MenuItem>
              </Select>
            </FormControl>
            
            <Typography gutterBottom sx={{ mt: 2 }}>LED Brightness</Typography>
            <Slider
              value={settings.ledBrightness}
              onChange={(e, newValue) => handleSettingChange('ledBrightness', newValue)}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={0}
              max={100}
              disabled={!settings.enableHardware}
            />
          </Paper>
        </Grid>
        
        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Privacy & API</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.saveConversations}
                  onChange={(e) => handleSettingChange('saveConversations', e.target.checked)}
                  color="primary"
                />
              }
              label="Save Conversations"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.collectAnonymousData}
                  onChange={(e) => handleSettingChange('collectAnonymousData', e.target.checked)}
                  color="primary"
                />
              }
              label="Collect Anonymous Usage Data"
            />
            
            <TextField
              label="Gemini API Key"
              fullWidth
              margin="normal"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleSettingChange('apiKey', e.target.value)}
              placeholder="Enter your Gemini API key"
              helperText="Leave empty to use the default key"
              size="small"
            />
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Settings will be stored locally on your device.
        </Typography>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 