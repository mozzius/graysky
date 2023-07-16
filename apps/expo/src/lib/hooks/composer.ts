import { useCallback, useState } from "react";
import { Alert, Keyboard, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useMutation } from "@tanstack/react-query";

const MAX_IMAGES = 4;

export const useImages = () => {
  const [images, setImages] = useState<
    {
      asset: ImagePicker.ImagePickerAsset;
      alt: string;
    }[]
  >([]);
  const { showActionSheetWithOptions } = useActionSheet();

  const imagePicker = useMutation({
    mutationFn: async () => {
      if (images.length >= MAX_IMAGES) return;

      // hackfix - android crashes if keyboard is open
      if (Platform.OS === "android") {
        Keyboard.dismiss();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const options = ["Take Photo", "Choose from Library", "Cancel"];
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        async (index) => {
          if (index === undefined) return;
          const selected = options[index];
          switch (selected) {
            case "Take Photo":
              if (!(await getCameraPermission())) {
                return;
              }
              void ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: MAX_IMAGES - images.length,
                exif: false,
                quality: 0.7,
              }).then((result) => {
                if (!result.canceled) {
                  setImages((prev) => [
                    ...prev,
                    ...result.assets.map((a) => ({ asset: a, alt: "" })),
                  ]);
                }
              });
              break;
            case "Choose from Library":
              if (!(await getGalleryPermission())) {
                return;
              }
              void ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: MAX_IMAGES - images.length,
                exif: false,
                quality: 0.7,
                orderedSelection: true,
              }).then((result) => {
                if (!result.canceled) {
                  setImages((prev) => [
                    ...prev,
                    ...result.assets.map((a) => ({ asset: a, alt: "" })),
                  ]);
                }
              });
          }
        },
      );
    },
  });

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const addAltText = useCallback(
    (index: number, alt: string) => {
      setImages((prev) => {
        const copy = [...prev];
        if (!copy[index]) throw new Error("Invalid index");
        copy[index]!.alt = alt;
        return copy;
      });
    },
    [setImages],
  );

  return {
    images,
    imagePicker,
    removeImage,
    addAltText,
  };
};

const getGalleryPermission = async () => {
  const canChoosePhoto = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!canChoosePhoto.granted) {
    if (canChoosePhoto.canAskAgain) {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable photo gallery access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable photo gallery access in your settings",
      );
      return false;
    }
  }
  return true;
};

const getCameraPermission = async () => {
  const canTakePhoto = await ImagePicker.getCameraPermissionsAsync();
  if (!canTakePhoto.granted) {
    if (canTakePhoto.canAskAgain) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable camera access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable camera access in your settings",
      );
      return false;
    }
  }
  return true;
};
