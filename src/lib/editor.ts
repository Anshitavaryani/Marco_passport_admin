/** @format */

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

// Upload endpoint for images dropped, pasted or picked in the rich-text
// editors (Blog content and Place/Business "About"). Resolves to the image's
// absolute URL.
export const uploadEditorImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("images", file, file.name);

  let json;
  try {
    const res = await fetch(`${IMAGE_BASE_URL}/api/v1/blog/upload-image`, {
      method: "POST",
      headers: { "x-access-token": localStorage.getItem("token") || "" },
      body: formData,
    });
    json = await res.json();
  } catch {
    throw new Error("Image upload failed. Please try again.");
  }
  if (!json?.success || !json?.data?.url) throw new Error(json?.message || "Image upload failed.");
  return `${IMAGE_BASE_URL}${json.data.url}`;
};
