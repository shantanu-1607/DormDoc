const { supabaseAdmin } = require('./supabase');

const PRESCRIPTIONS_BUCKET = 'prescriptions';
const DEFAULT_SIGNED_URL_TTL = 60 * 5; // 5 minutes

// Upload a Buffer to a bucket. Returns { path } on success, throws on failure.
async function uploadBuffer({ bucket, path, buffer, contentType, upsert = false }) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert });
  if (error) throw error;
  return { path: data.path };
}

async function deleteObject({ bucket, path }) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw error;
}

async function createSignedUrl({ bucket, path, expiresIn = DEFAULT_SIGNED_URL_TTL }) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

module.exports = {
  PRESCRIPTIONS_BUCKET,
  DEFAULT_SIGNED_URL_TTL,
  uploadBuffer,
  deleteObject,
  createSignedUrl,
};
