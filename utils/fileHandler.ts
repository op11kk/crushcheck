import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SHARED_FILES_KEY = "shared_files";

export interface SharedFile {
  id: string;
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType?: string;
  timestamp: number;
}

export async function handleReceivedUrl(
  url: string,
): Promise<SharedFile | null> {
  console.log("Received URL:", url);

  if (url.startsWith("file://")) {
    return await processFileUrl(url);
  }

  return null;
}

async function processFileUrl(url: string): Promise<SharedFile | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(url);

    if (!fileInfo.exists) {
      console.log("File does not exist:", url);
      return null;
    }

    const uriParts = url.split("/");
    const fileName = uriParts[uriParts.length - 1];
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    let fileType = "unknown";
    let mimeType = "application/octet-stream";

    if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(fileExtension)) {
      fileType = "image";
      mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;
    } else if (["mp4", "mov", "avi", "wmv"].includes(fileExtension)) {
      fileType = "video";
      mimeType = `video/${fileExtension}`;
    } else if (
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(
        fileExtension,
      )
    ) {
      fileType = "document";
      mimeType = fileExtension === "txt"
        ? "text/plain"
        : `application/${fileExtension}`;
    }

    const fileId = `file_${new Date().getTime()}_${
      Math.floor(Math.random() * 10000)
    }`;

    const sharedFile: SharedFile = {
      id: fileId,
      uri: url,
      name: fileName,
      type: fileType,
      size: fileInfo.size,
      mimeType,
      timestamp: new Date().getTime(),
    };

    await saveSharedFile(sharedFile);

    return sharedFile;
  } catch (error) {
    console.error("Error processing file URL:", error);
    return null;
  }
}

export async function saveSharedFile(file: SharedFile): Promise<void> {
  try {
    const existingFilesJson = await AsyncStorage.getItem(SHARED_FILES_KEY);
    const existingFiles: SharedFile[] = existingFilesJson
      ? JSON.parse(existingFilesJson)
      : [];

    existingFiles.push(file);

    await AsyncStorage.setItem(SHARED_FILES_KEY, JSON.stringify(existingFiles));
  } catch (error) {
    console.error("Error saving shared file:", error);
  }
}

export async function getSharedFiles(): Promise<SharedFile[]> {
  try {
    const filesJson = await AsyncStorage.getItem(SHARED_FILES_KEY);
    return filesJson ? JSON.parse(filesJson) : [];
  } catch (error) {
    console.error("Error getting shared files:", error);
    return [];
  }
}

export async function deleteSharedFile(fileId: string): Promise<boolean> {
  try {
    const existingFilesJson = await AsyncStorage.getItem(SHARED_FILES_KEY);
    const existingFiles: SharedFile[] = existingFilesJson
      ? JSON.parse(existingFilesJson)
      : [];

    const fileIndex = existingFiles.findIndex((file) => file.id === fileId);

    if (fileIndex === -1) {
      return false;
    }

    const fileUri = existingFiles[fileIndex].uri;

    existingFiles.splice(fileIndex, 1);

    await AsyncStorage.setItem(SHARED_FILES_KEY, JSON.stringify(existingFiles));

    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.log("Could not delete file from filesystem:", error);
    }

    return true;
  } catch (error) {
    console.error("Error deleting shared file:", error);
    return false;
  }
}

export async function clearAllSharedFiles(): Promise<boolean> {
  try {
    const existingFilesJson = await AsyncStorage.getItem(SHARED_FILES_KEY);
    const existingFiles: SharedFile[] = existingFilesJson
      ? JSON.parse(existingFilesJson)
      : [];

    for (const file of existingFiles) {
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
      } catch (error) {
        console.log(`Could not delete file ${file.name}:`, error);
      }
    }

    await AsyncStorage.removeItem(SHARED_FILES_KEY);

    return true;
  } catch (error) {
    console.error("Error clearing shared files:", error);
    return false;
  }
}

export function setupUrlListener(
  callback: (file: SharedFile | null) => void,
): () => void {
  const subscription = Linking.addEventListener("url", async ({ url }) => {
    const file = await handleReceivedUrl(url);
    callback(file);
  });

  Linking.getInitialURL().then(async (initialUrl) => {
    if (initialUrl) {
      const file = await handleReceivedUrl(initialUrl);
      callback(file);
    }
  });

  return () => {
    subscription.remove();
  };
}
