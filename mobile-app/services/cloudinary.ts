// Cloudinary image upload service
// Uses unsigned upload for simplicity - images are uploaded directly to Cloudinary

const CLOUDINARY_CLOUD_NAME = 'medicata'; // Cloud name from .env
const CLOUDINARY_API_KEY = '156352328942451'; // API Key from .env
const CLOUDINARY_UPLOAD_PRESET = 'medicata_unsigned'; // Make sure this preset exists in Cloudinary as 'Unsigned'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface UploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image to Cloudinary
 * @param uri - Local image URI from expo-image-picker
 * @returns UploadResult with success status and image URL
 */
export async function uploadToCloudinary(uri: string): Promise<UploadResult> {
  try {
    // Create form data for the upload
    const formData = new FormData();
    
    // Get file info from the URI
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.\w+$/.exec(filename);
    const type = match ? `image/${match[0].substring(1)}` : 'image/jpeg';
    
    // @ts-ignore - React Native specific FormData handling
    formData.append('file', {
      uri,
      name: filename,
      type,
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('folder', 'medicata/lab_results'); // Organize uploads in a folder
    
    console.log('[Cloudinary] Uploading to:', CLOUDINARY_UPLOAD_URL);
    
    // Perform the upload
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudinary] Upload failed:', errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    console.log('[Cloudinary] Upload successful:', data.secure_url);
    
    return {
      success: true,
      url: data.secure_url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error: any) {
    console.error('[Cloudinary] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during upload',
    };
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param uris - Array of local image URIs
 * @returns Array of upload results
 */
export async function uploadMultipleToCloudinary(uris: string[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (const uri of uris) {
    const result = await uploadToCloudinary(uri);
    results.push(result);
  }
  
  return results;
}

/**
 * Delete an image from Cloudinary (requires server-side authentication)
 * @param publicId - The public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  // Note: Deletion requires authentication and should ideally be done server-side
  // This is a placeholder for the API call
  console.log('[Cloudinary] Delete requested for:', publicId);
  return true;
}
