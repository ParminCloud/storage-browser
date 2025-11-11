// Upload file dialog component
import React from "react";
import { Button, Input } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloseButton } from "@/components/ui/close-button";
import FileInput from "./FileInput";
import { toaster } from "@/components/ui/toaster";
import { setValueFromEvent } from "../utils";
import { uploadFile } from "../lib/s3-operations";

interface UploadFileDialogProps {
  open: boolean;
  onClose: () => void;
  fileUpload: any;
  onUploadSuccess: () => void;
  client: any;
  bucket: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function UploadFileDialog({
  open,
  onClose,
  fileUpload,
  onUploadSuccess,
  client,
  bucket,
  isLoading,
  setIsLoading,
}: UploadFileDialogProps) {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  const [folderName, setFolderName] = React.useState<string | null>(null);

  const handleUpload = async () => {
    if (!fileUpload.acceptedFiles) {
      toaster.create({
        title: "Input Error",
        description: "Ensure that required inputs are filled",
        type: "error",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      for (const file of fileUpload.acceptedFiles) {
        await uploadFile(client, bucket, file, folderName || undefined);
      }

      onUploadSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogRoot
      initialFocusEl={() => initialRef.current}
      finalFocusEl={() => finalRef.current}
      open={open}
      onExitComplete={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger asChild>
          <CloseButton size="sm" onClick={onClose} />
        </DialogCloseTrigger>
        <DialogBody pb={6}>
          <Field label="Folder Name / Prefix (Optional)">
            <Input
              onChange={(ev) => setValueFromEvent(ev, setFolderName)}
              ref={initialRef}
              placeholder="Folder Name / Prefix"
            />
          </Field>
          <Field label="File (browse or drag)" marginTop={5}>
            <FileInput value={fileUpload} />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button onClick={handleUpload} variant="solid">
            Upload
          </Button>
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
