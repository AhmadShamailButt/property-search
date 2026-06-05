import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const PROPERTY_BUCKET = 'property-images';

const extFromUri = (uri: string, fallback: string): string => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return (match?.[1] ?? fallback).toLowerCase();
};

const contentTypeFor = (ext: string): string => {
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'application/octet-stream';
};

export type PickedImage = { uri: string; mimeType?: string };

type Source = 'library' | 'camera';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  allowsEditing: false,
};

async function pickImage(source: Source): Promise<PickedImage | null> {
  const perm = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(source === 'camera' ? 'Camera permission denied.' : 'Photo library permission denied.');
  }
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType };
}

export const pickImageFromLibrary = () => pickImage('library');
export const captureImageFromCamera = () => pickImage('camera');

export async function uploadPropertyImage(picked: PickedImage, ownerId: string): Promise<string> {
  return uploadImageToBucket(picked, PROPERTY_BUCKET, ownerId);
}

const BANNER_BUCKET = 'banner-images';

export async function uploadBannerImage(picked: PickedImage, adminId: string): Promise<string> {
  return uploadImageToBucket(picked, BANNER_BUCKET, adminId);
}

const AVATAR_BUCKET = 'avatars';

export async function uploadAvatarImage(picked: PickedImage, userId: string): Promise<string> {
  return uploadImageToBucket(picked, AVATAR_BUCKET, userId);
}

/**
 * Upload a picked image to the given Supabase Storage bucket. Object path is
 * `<ownerId>/<timestamp>-<rand>.<ext>` so storage RLS that gates by the first
 * folder segment continues to work for the property bucket; the banner bucket
 * gates by admin role instead.
 */
async function uploadImageToBucket(
  picked: PickedImage,
  bucket: string,
  ownerId: string,
): Promise<string> {
  const ext = extFromUri(picked.uri, picked.mimeType?.split('/')[1] ?? 'jpg');
  const contentType = picked.mimeType ?? contentTypeFor(ext);
  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const response = await fetch(picked.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
