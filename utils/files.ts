import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { uploadImagesToSupabase } from "./supabase/supabase-storage";

const MAX_IMAGES = 50;
export async function chooseFiles() {
    const permissionResult = await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    // 如果用户拒绝了权限请求，显示提示并返回
    if (permissionResult.granted === false) {
        Alert.alert("提示", "需要访问相册权限才能上传图片");
        return;
    }

    // 打开相册选择图片
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // 使用新的推荐方式，只选择图片类型
        allowsEditing: false, // 不允许编辑
        quality: 1, // 最高质量
        allowsMultipleSelection: true, // 允许多选图片
        selectionLimit: MAX_IMAGES, // 限制最多选择50张图片
    });

    // 如果用户选择了图片（未取消操作）
    if (!result.canceled) {
        // 处理选择的图片
        console.log("选择的图片:", result.assets);

        try {
            // 压缩图片并获取URI
            const compressedImages = await Promise.all(
                result.assets.map(async (asset) => {
                    // 使用expo-image-manipulator压缩图片
                    // 质量设为0.5（50%），在保证文字清晰的前提下减小文件体积
                    const manipulateContext = ImageManipulator.manipulate(
                        asset.uri,
                    );
                    const image = await manipulateContext.renderAsync();
                    const compressedResult = await image.saveAsync({
                        format: SaveFormat.JPEG,
                        compress: 0.5,
                    });
                    console.log(
                        `原图大小: ${asset.fileSize} bytes, ` +
                            `压缩后URI: ${compressedResult.uri}`,
                    );

                    return compressedResult.uri;
                }),
            );

            // 上传压缩后的图片到Supabase
            const uploadedUrls = await uploadImagesToSupabase(compressedImages);
            console.log("上传成功，图片URLs:", uploadedUrls);

            // TODO: 之后可以实现跳转到分析结果页面，并传递uploadedUrls
        } catch (error) {
            console.error("处理或上传图片时出错:", error);
        }
    }
}
