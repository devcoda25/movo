import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';

// Helper to get current user from request header (client sends token)
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  try {
    // For now, we'll accept a simple token in header
    // In production, verify Firebase ID token properly
    return { uid: authHeader.replace('Bearer ', '') };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - support both images and videos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP images and MP4, WebM videos are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB for images, 50MB for videos)
    const maxImageSize = 5 * 1024 * 1024; // 5MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos

    if (isImage && file.size > maxImageSize) {
      return NextResponse.json({ error: 'Image too large. Maximum size is 5MB.' }, { status: 400 });
    }

    if (isVideo && file.size > maxVideoSize) {
      return NextResponse.json({ error: 'Video too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // Generate unique file name
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${fileId}.${fileExtension}`;
    const storagePath = `${folder}/${user.uid}/${fileName}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    await uploadBytes(storageRef, uint8Array, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return NextResponse.json({
      success: true,
      url: downloadURL,
      path: storagePath,
      id: fileId,
      type: isImage ? 'image' : 'video'
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Upload failed',
      details: error.code || 'unknown'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Verify user owns the file (path contains user uid)
    if (!path.includes(user.uid)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({
      error: error.message || 'Delete failed'
    }, { status: 500 });
  }
}
