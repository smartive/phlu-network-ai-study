'use server';

import { Storage } from '@google-cloud/storage';
import { getSession } from '@/lib/session';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS || '{}'),
});

const bucketName = process.env.GCP_BUCKET_NAME || '';

export async function uploadAudioInterview(formData: FormData) {
  const audioBlob = formData.get('audio') as Blob;
  const session = await getSession();
  const userId = session.user.userId;

  if (!audioBlob) {
    throw new Error('No audio file found');
  }

  if (session.user.group !== 'human') {
    throw new Error('No permission');
  }

  try {
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const filename = `interviews/${userId}.webm`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: audioBlob.type,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw new Error('Error uploading audio file');
  }
}
