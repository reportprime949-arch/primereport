const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Load API key from env
async function generateImage(title) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[AI Image] No API Key provided, skipping.");
    return "/assets/image/news-placeholder.jpg";
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const prompt = `News illustration for: ${title}, professional journalism style, modern digital illustration. Clean, high-quality, vibrant editorial style, no text or words on image.`;

    const result = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const imageBase64 = result.data[0].b64_json;
    const buffer = Buffer.from(imageBase64, "base64");
    
    const fileName = `art_${Date.now()}.png`;
    const publicImagesDir = path.join(__dirname, "../public/news-images");
    
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    const filePath = path.join(publicImagesDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return "/news-images/" + fileName;
  } catch (err) {
    console.error("[AI Image] Error generating image:", err.message);
    return "/assets/image/news-placeholder.jpg";
  }
}

module.exports = generateImage;