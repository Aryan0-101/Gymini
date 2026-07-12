export const CONFIG = {
  // Cloudflare R2 bucket for images
  // The database stores paths like "3_4_Sit-Up/images/0.jpg"
  // Full URL: ASSET_BASE_URL + "/" + imagePath
  ASSET_BASE_URL: "https://pub-af8fa2b79c00457284a3a0110e279dbf.r2.dev/assets1/exercises",
  
  // Gemini API Key accessed securely via Expo environment variables
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
};
