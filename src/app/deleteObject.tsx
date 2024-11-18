import { Field } from "@/components/ui/field"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Toaster, toaster } from "@/components/ui/toaster"
import {
  Button,
  Input,
  Code,
} from "@chakra-ui/react";
import { setValueFromEvent } from "./utils";
import { useState } from "react";

const DeleteObject = ({
  open,
  onOpen,
  onClose,
  cancelRef,
  objectKey,
  action
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  cancelRef: React.MutableRefObject<any>;
  action: () => void;
  objectKey: string;
}) => {
  const [key, setKey] = useState("");

  return (
    <>
      <Toaster />

      <DialogRoot
        open={open}
        onExitComplete={onClose}
        role="alertdialog"
      >
        <DialogContent>
          <DialogHeader fontSize="lg" fontWeight="bold">
            Delete Object
          </DialogHeader>

          <DialogBody>
            Are you sure? You will not be able to undo this action afterwards.
            Enter Object Key <Code>{objectKey}</Code> to confirm object removal
            <Field label="Object Key" mt={4}>
              <Input
                onChange={(ev) => setValueFromEvent(ev, setKey)}
                placeholder="Object Key"
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="red"
              onClick={() => {
                if (key === objectKey) {
                  action();
                  onClose();
                } else {
                  toaster.create({
                    title: "Wrong Input",
                    description: "Input must be the same as object key",
                    type: "error",
                    duration: 5000,
                  });
                }
              }}
              ml={3}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default DeleteObject;
