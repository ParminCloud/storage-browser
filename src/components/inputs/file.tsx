import { FileUpload, Icon, Text, Button, UseFileUploadReturn } from "@chakra-ui/react";
import { LuUpload, LuX } from "react-icons/lu";
import {
  LuFile,
  LuFileArchive,
  LuFileAudio2,
  LuFileCode,
  LuFileCode2,
  LuFileImage,
  LuFileJson,
  LuFileKey,
  LuFileLock,
  LuFileSpreadsheet,
  LuFileTerminal,
  LuFileText,
  LuFileType,
  LuFileVideo2,
  LuFileWarning,
} from "react-icons/lu";

import { Float, HStack, VStack } from "@chakra-ui/react";
type Props = {
  value: UseFileUploadReturn;
};
const mimeIconMap: Record<string, React.ElementType> = {
  "image/": LuFileImage,
  "audio/": LuFileAudio2,
  "video/": LuFileVideo2,
  "text/": LuFileCode2,
  "application/yaml": LuFileCode2,
  "text/plain": LuFileText,
  "text/markdown": LuFileText,
  "application/pdf": LuFileType,
  "application/msword": LuFileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    LuFileText,
  "application/vnd.ms-excel": LuFileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    LuFileSpreadsheet,
  "text/csv": LuFileSpreadsheet,
  "application/javascript": LuFileCode,
  "text/javascript": LuFileCode,
  "application/json": LuFileJson,
  "application/x-sh": LuFileTerminal,
  "application/x-python": LuFileTerminal,
  "application/zip": LuFileArchive,
  "application/x-tar": LuFileArchive,
  "application/tar": LuFileArchive,
  "application/tar+gzip": LuFileArchive,
  "application/gnutar": LuFileArchive,
  "application/x-gzip": LuFileArchive,
  "application/x-gtar": LuFileArchive,
  "application/gzip": LuFileArchive,
  "application/x-7z-compressed": LuFileArchive,
  "application/x-rar-compressed": LuFileArchive,
  "application/x-pem-file": LuFileKey,
  "application/x-x509-ca-cert": LuFileLock,
};

export function getFileIconByMime(mime: string) {
  let Icon: React.ElementType = LuFile;
  if (mimeIconMap[mime]) Icon = mimeIconMap[mime];
  else {
    const prefix = Object.keys(mimeIconMap).find(
      (key) => key.endsWith("/") && mime.startsWith(key),
    );
    if (prefix) Icon = mimeIconMap[prefix];
    else Icon = LuFileWarning;
  }

  return <Icon className="w-5 h-5 text-gray-600" />;
}

export default function FileInput({ value }: Props) {
  return (
    <FileUpload.RootProvider
      value={value}
      maxW="xl"
      alignItems="stretch"
    >
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone>
        <FileUpload.DropzoneContent w="full">
          <LuUpload size={36} />
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Drag & drop files here
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            or click below to browse files
          </Text>

          <FileUpload.Trigger asChild>
            <Button size="sm" colorScheme="blue">
              Browse Files
            </Button>
          </FileUpload.Trigger>
        </FileUpload.DropzoneContent>
      </FileUpload.Dropzone>
      {value.acceptedFiles.length > 0 && (
        <VStack mt="6" gap="3" align="stretch" w="full">
          <Text fontSize="md" fontWeight="semibold">
            Uploaded Files
          </Text>
          <FileUpload.ItemGroup gap="3">
            {value.acceptedFiles.map((file, i) => (
              <FileUpload.Item key={i} file={file} w="full">
                <HStack
                  gap="3"
                  p="3"
                  borderWidth="1px"
                  borderRadius="md"
                  w="full"
                >
                  <FileUpload.ItemPreview>
                    {(file.type.startsWith("image") && (
                      <FileUpload.ItemPreviewImage
                        boxSize="16"
                        borderRadius="md"
                      />
                    )) || (
                        <Icon fontSize="lg" color="fg.muted">
                          {getFileIconByMime(file.type || "unknown")}
                        </Icon>
                      )}
                  </FileUpload.ItemPreview>

                  <FileUpload.ItemContent flex="1">
                    <FileUpload.ItemName fontWeight="medium" />
                    <FileUpload.ItemSizeText fontSize="xs" color="gray.500" />
                  </FileUpload.ItemContent>

                  <Float placement="top-end">
                    <FileUpload.ItemDeleteTrigger>
                      <LuX />
                    </FileUpload.ItemDeleteTrigger>
                  </Float>
                </HStack>
              </FileUpload.Item>
            ))}
          </FileUpload.ItemGroup>
        </VStack>
      )}
    </FileUpload.RootProvider>
  );
}
