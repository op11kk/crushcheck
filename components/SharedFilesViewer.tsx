import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SharedFile, getSharedFiles, deleteSharedFile, clearAllSharedFiles } from "../utils/fileHandler";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

interface SharedFilesViewerProps {
  onFileSelected?: (file: SharedFile) => void;
  refreshTrigger?: number;
}

export default function SharedFilesViewer({ onFileSelected, refreshTrigger = 0 }: SharedFilesViewerProps) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const sharedFiles = await getSharedFiles();
      sharedFiles.sort((a, b) => b.timestamp - a.timestamp);
      setFiles(sharedFiles);
    } catch (error) {
      console.error("Error loading shared files:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const handleDeleteFile = (fileId: string) => {
    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await deleteSharedFile(fileId);
          if (success) {
            setFiles(files.filter(file => file.id !== fileId));
          }
        }
      }
    ]);
  };

  const handleClearAll = () => {
    if (files.length === 0) return;

    Alert.alert("Clear All Files", "Are you sure you want to clear all shared files?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          const success = await clearAllSharedFiles();
          if (success) {
            setFiles([]);
          }
        }
      }
    ]);
  };

  const renderFileItem = ({ item }: { item: SharedFile }) => {
    return (
      <TouchableOpacity style={styles.fileItem} onPress={() => onFileSelected && onFileSelected(item)}>
        <View style={styles.fileContent}>
          {item.type === "image" ? (
            <ExpoImage source={{ uri: item.uri }} style={styles.imagePreview} contentFit="cover" transition={200} />
          ) : (
            <View style={styles.fileTypeIcon}>
              <Ionicons name={item.type === "video" ? "videocam" : item.type === "document" ? "document-text" : "document"} size={32} color="#666" />
            </View>
          )}

          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.fileType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              {item.size ? ` · ${formatFileSize(item.size)}` : ""}
            </Text>
            <Text style={styles.fileDate}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteFile(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared Files</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={22} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No shared files</Text>
          <Text style={styles.emptySubtext}>From other apps, share files to this app, and they will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold"
  },
  headerButtons: {
    flexDirection: "row"
  },
  refreshButton: {
    padding: 8,
    marginRight: 8
  },
  clearButton: {
    padding: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20
  },
  listContent: {
    padding: 8
  },
  fileItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  fileContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center"
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0"
  },
  fileTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center"
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center"
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4
  },
  fileType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2
  },
  fileDate: {
    fontSize: 12,
    color: "#999"
  },
  deleteButton: {
    padding: 8
  }
});
