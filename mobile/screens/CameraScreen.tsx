import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Compress image to reduce memory usage and upload size
  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max 1024px width
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch (error) {
      console.error('Image compression failed:', error);
      return uri; // Fallback to original
    }
  };

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        const compressedUri = await compressImage(photo.uri);
        setCapturedImage(compressedUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      console.error('Camera capture error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        const compressedUri = await compressImage(result.assets[0].uri);
        setCapturedImage(compressedUri);
        setIsProcessing(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image from gallery.');
      console.error('Gallery picker error:', error);
    }
  }, []);

  const analyzeImage = useCallback(() => {
    if (!capturedImage) return;
    
    Alert.alert(
      'Analyze Image',
      'Send this image for AI analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Analyze', 
          onPress: () => {
            // TODO: Navigate to editor with image
            Alert.alert('Success', 'Image ready for analysis!');
            setCapturedImage(null);
          }
        },
      ]
    );
  }, [capturedImage]);

  const retakePicture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={requestPermission}
          accessibilityLabel="Grant camera permission"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show preview after capture
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: capturedImage }} 
          style={styles.preview}
          accessibilityLabel="Captured image preview"
        />
        
        <View style={styles.previewControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={retakePicture}
            accessibilityLabel="Retake picture"
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={24} color={colors.textPrimary} />
            <Text style={styles.controlText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.analyzeButton]} 
            onPress={analyzeImage}
            accessibilityLabel="Analyze image"
            accessibilityRole="button"
          >
            <Ionicons name="sparkles" size={24} color={colors.bgPrimary} />
            <Text style={[styles.controlText, styles.analyzeText]}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <View style={styles.overlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity 
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
              accessibilityLabel="Switch camera"
              accessibilityRole="button"
            >
              <Ionicons name="camera-reverse" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              onPress={pickFromGallery}
              accessibilityLabel="Open photo gallery"
              accessibilityRole="button"
            >
              <Ionicons name="images" size={32} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePicture}
              disabled={isProcessing}
              accessibilityLabel="Take picture"
              accessibilityRole="button"
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.bgPrimary} />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            <View style={{ width: 32 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bgPrimary 
  },
  camera: { 
    flex: 1 
  },
  overlay: { 
    flex: 1, 
    justifyContent: 'space-between', 
    padding: spacing.lg 
  },
  topControls: { 
    alignItems: 'flex-end', 
    marginTop: spacing.xl 
  },
  bottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    marginBottom: spacing.xl 
  },
  captureButton: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: colors.textPrimary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  captureInner: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: colors.textPrimary, 
    borderWidth: 2, 
    borderColor: colors.bgPrimary 
  },
  preview: { 
    flex: 1, 
    resizeMode: 'contain' 
  },
  previewControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: spacing.lg, 
    backgroundColor: colors.bgSecondary 
  },
  controlButton: { 
    alignItems: 'center', 
    padding: spacing.md 
  },
  controlText: { 
    color: colors.textPrimary, 
    marginTop: spacing.sm, 
    fontSize: 14 
  },
  analyzeButton: { 
    backgroundColor: colors.accentCyan, 
    borderRadius: 8, 
    paddingHorizontal: spacing.xl 
  },
  analyzeText: { 
    color: colors.bgPrimary, 
    fontWeight: '600' 
  },
  text: { 
    color: colors.textPrimary, 
    textAlign: 'center', 
    marginBottom: spacing.lg 
  },
  button: { 
    backgroundColor: colors.accentCyan, 
    paddingHorizontal: spacing.xl, 
    paddingVertical: spacing.md, 
    borderRadius: 8,
    alignSelf: 'center'
  },
  buttonText: { 
    color: colors.bgPrimary, 
    fontWeight: '600' 
  },
});
