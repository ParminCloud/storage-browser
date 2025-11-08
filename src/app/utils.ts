import { S3Client } from "@aws-sdk/client-s3";
import { ChangeEvent } from "react";

export function setValueFromEvent(
  ev: ChangeEvent<HTMLInputElement>,
  setter: (ev: any) => void,
) {
  setter(ev.target.value);
}

export function readablizeBytes(bytes: number) {
  if (bytes === 0 || Number.isNaN(bytes)) {
    return NaN;
  }
  const s = ["bytes", "kB", "MB", "GB", "TB", "PB"];
  const e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}

export function getSavedCredentials() {
  const isServer = typeof window === "undefined";
  const savedInformation =
    !isServer && JSON.parse(localStorage.getItem("loginInformation") || "null");
  return savedInformation;
}
export function getClient({
  endpoint,
  accessKey,
  secretKey,
}: {
  endpoint: string | null;
  accessKey: string | null;
  secretKey: string | null;
}) {
  if (endpoint && accessKey && secretKey) {
    return new S3Client({
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      region: "us-east-1",
    });
  }
}
