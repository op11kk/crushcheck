import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Modal, TouchableOpacity, Text } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SharedFile, setupUrlListener } from "../utils/fileHandler";
import SharedFilesViewer from "../components/SharedFilesViewer";

export default function SharedFilesScreen() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newFileReceived, setNewFileReceived] = useState(false);

  const handleReceivedFile = useCallback((file: SharedFile | null) => {
    if (file) {
      console.log("Received file:", file);
      setRefreshTrigger(prev => prev + 1);
      setNewFileReceived(true);
      setTimeout(() => {
        setNewFileReceived(false);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = setupUrlListener(handleReceivedFile);
    return () => {
      unsubscribe();
    };
  }, [handleReceivedFile]);

  const handleFileSelected = (file: SharedFile) => {
    setSelectedFile(file);
  };

  const closeFilePreview = () => {
    setSelectedFile(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SharedFilesViewer onFileSelected={handleFileSelected} refreshTrigger={refreshTrigger} />

      <Modal visible={!!selectedFile} transparent={true} animationType="fade" onRequestClose={closeFilePreview}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedFile?.name}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeFilePreview}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewContainer}>
              {selectedFile?.type === "image" ? (
                <ExpoImage source={{ uri: selectedFile.uri }} style={styles.imagePreview} contentFit="contain" />
              ) : (
                <View style={styles.fileTypePreview}>
                  <Ionicons
                    name={selectedFile?.type === "video" ? "videocam" : selectedFile?.type === "document" ? "document-text" : "document"}
                    size={64}
                    color="#666"
                  />
                  <Text style={styles.fileTypeText}>{selectedFile?.type.charAt(0).toUpperCase() + selectedFile?.type.slice(1)} files</Text>
                  <Text style={styles.fileNameText} numberOfLines={2}>
                    {selectedFile?.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {newFileReceived && (
        <View style={styles.notification}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.notificationText}>New file received</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8"
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1
  },
  closeButton: {
    padding: 4
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    minHeight: 300
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8
  },
  fileTypePreview: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  fileTypeText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 8
  },
  fileNameText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center"
  },
  notification: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4caf50",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  notificationText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8
  }
});
