// Create folder dialog component
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
import { toaster } from "@/components/ui/toaster";
import { setValueFromEvent } from "../utils";
import { createFolder } from "../lib/s3-operations";

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
  client: any;
  bucket: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CreateFolderDialog({
  open,
  onClose,
  onFolderCreated,
  client,
  bucket,
  isLoading,
  setIsLoading,
}: CreateFolderDialogProps) {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  const [folderName, setFolderName] = React.useState<string | null>(null);

  const handleCreateFolder = async () => {
    if (!folderName) {
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
      await createFolder(client, bucket, folderName);
      onFolderCreated();
      onClose();
      setFolderName(null);
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
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger asChild>
          <CloseButton size="sm" onClick={onClose} />
        </DialogCloseTrigger>
        <DialogBody pb={6}>
          <Field label="Folder Name">
            <Input
              onChange={(ev) => setValueFromEvent(ev, setFolderName)}
              ref={initialRef}
              placeholder="Folder Name"
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button onClick={handleCreateFolder} variant={"solid"}>
            Create
          </Button>
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
