// S3 operations and utilities
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { toaster } from "@/components/ui/toaster";

function getKeyWithPrefix(
  prefix: string | undefined,
  key: string,
): string {
  if (prefix) {
    let adjustedPrefix = prefix;
    if (!adjustedPrefix.endsWith("/")) {
      adjustedPrefix += "/";
    }
    return adjustedPrefix + key;
  }
  return key;
}

export async function downloadObject(
  client: S3Client | null,
  bucket: string,
  key: string,
  prefix?: string,
): Promise<void> {
  if (!client) return;

  toaster.create({
    title: "Downloading object",
    description: "Ensure that you are allowed popups",
    type: "info",
    duration: 1500,
  });

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: getKeyWithPrefix(prefix, key),
    });

    const response = await client.send(command);
    const data = await response.Body?.transformToByteArray();

    if (data) {
      const blob = new Blob([data as BlobPart], {
        type: response.ContentType,
      });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } else {
      toaster.create({
        title: "Error while downloading object",
        description: "Cannot download an empty object",
        type: "error",
        duration: 5000,
      });
    }
  } catch (err) {
    toaster.create({
      title: "Error while downloading object",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });
  }
}

export async function deleteObject(
  client: S3Client | null,
  bucket: string,
  key: string,
  prefix?: string,
): Promise<void> {
  if (!client) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: getKeyWithPrefix(prefix, key),
    });

    await client.send(command);
  } catch (err) {
    toaster.create({
      title: "Error while removing object",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });
  }
}

export async function createFolder(
  client: S3Client | null,
  bucket: string,
  folderName: string,
  prefix?: string,
): Promise<void> {
  if (!client) return;

  let name = folderName;
  if (!name.endsWith("/")) {
    name += "/";
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: getKeyWithPrefix(prefix, name),
    });

    await client.send(command);
  } catch (err) {
    toaster.create({
      title: "Error while creating folder",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });
  }
}

export async function uploadFile(
  client: S3Client | null,
  bucket: string,
  file: File,
  folderPrefix?: string,
  prefix?: string,
): Promise<void> {
  if (!client) return;

  try {
    let key = "";
    if (folderPrefix) {
      key = folderPrefix;
      if (!folderPrefix.endsWith("/")) {
        key += "/";
      }
    }
    key += file.name;

    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: getKeyWithPrefix(prefix, key),
      Body: body,
      ContentType: file.type,
    });

    await client.send(command);
  } catch (err) {
    toaster.create({
      title: "Error while uploading object",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });
  }
}

export async function listObjects(
  client: S3Client | null,
  bucket: string,
  token?: string,
  prefix?: string,
): Promise<{
  contents: _Object[];
  nextToken?: string;
}> {
  if (!client) {
    return { contents: [] };
  }
  let hasPrefix = false;
  if (prefix && prefix.length > 0) {
    hasPrefix = true;
    prefix = prefix.endsWith("/") ? prefix : prefix + "/";
  }
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
      ContinuationToken: token,
      Prefix: prefix,
    });

    const { Contents, NextContinuationToken } = await client.send(command);
    if (hasPrefix && Contents) {
      for (const content of Contents) {
        if (content.Key && prefix) {
          content.Key = content.Key.substring(prefix.length);
        }
      }
    }
    return {
      contents: Contents || [],
      nextToken: NextContinuationToken,
    };
  } catch (err) {
    toaster.create({
      title: "Error while getting object list",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });

    return { contents: [] };
  }
}

export async function generatePresignedUrl(
  client: S3Client | null,
  bucket: string,
  key: string,
  prefix?: string,
): Promise<string | null> {
  if (!client) return null;

  try {
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: getKeyWithPrefix(prefix, key),
      }),
    );

    return url;
  } catch (err) {
    toaster.create({
      title: "Error generating presigned URL",
      description: err instanceof Error ? err.toString() : String(err),
      type: "error",
      duration: 5000,
    });

    return null;
  }
}
