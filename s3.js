import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const bucketName = process.env.BUCKET_NAME;

// Configuration
const s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// Upload image to S3
export async function uploadImg(fileName, imageBuffer, mimeType) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: imageBuffer,
    ContentType: mimeType,
  });

  const data = await s3Client.send(command);

  return data;
}

// Get temp image url
export async function getImgUrl(fileName) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  const imgUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60 * 24,
  });

  return imgUrl;
}

// Delete image from S3
export async function deleteImg(fileName) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  const data = await s3Client.send(command);
  return data;
}
