import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {};
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      Alert.alert('Selected', 'Image selected for analysis');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
              <Ionicons name="camera-reverse" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={pickFromGallery}>
              <Ionicons name="images" size={32} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  topControls: { alignItems: 'flex-end', marginTop: spacing.xl },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: spacing.xl },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.textPrimary, borderWidth: 2, borderColor: colors.bgPrimary },
  text: { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  button: { backgroundColor: colors.accentCyan, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 8 },
  buttonText: { color: colors.bgPrimary, fontWeight: '600' },
});
