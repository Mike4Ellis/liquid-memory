/**
 * Share Receiver Component
 * Handles images shared from other apps
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

interface SharedImage {
  uri: string;
  type: string;
}

export default function ShareReceiver() {
  const [sharedImage, setSharedImage] = useState<SharedImage | null>(null);

  // Listen for shared images
  useEffect(() => {
    // TODO: Implement actual share receiving with expo-sharing
    // This is a placeholder for the share extension integration
  }, []);

  const saveToLibrary = () => {
    if (!sharedImage) return;
    
    Alert.alert(
      'Save Image',
      'Save this image to your Liquid Memory library?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save & Analyze', 
          onPress: () => {
            // Navigate to editor with the image
            Alert.alert('Saved!', 'Image saved and ready for analysis.');
            setSharedImage(null);
          }
        },
      ]
    );
  };

  const dismiss = () => {
    setSharedImage(null);
  };

  if (!sharedImage) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Shared Image</Text>
        
        <Image source={{ uri: sharedImage.uri }} style={styles.image} />
        
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.dismissButton]} onPress={dismiss}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveToLibrary}>
            <Ionicons name="save" size={20} color={colors.bgPrimary} />
            <Text style={[styles.buttonText, styles.saveButtonText]}>Save & Analyze</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.bgTertiary,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  dismissButton: {
    backgroundColor: colors.bgTertiary,
  },
  saveButton: {
    backgroundColor: colors.accentCyan,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.bgPrimary,
  },
});
