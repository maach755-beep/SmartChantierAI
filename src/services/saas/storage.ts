import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const BUCKET = 'documents';

export async function uploadDocument(
  path: string,
  file: File,
  userId?: string
): Promise<{ path: string; publicUrl: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage non configuré — créez le bucket « documents » dans le dashboard.');
  }
  const fullPath = userId ? `${userId}/${path}` : path;
  const { error } = await supabase.storage.from(BUCKET).upload(fullPath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  return { path: fullPath, publicUrl: data.publicUrl };
}

export async function downloadDocument(path: string): Promise<Blob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) return null;
  return data;
}
