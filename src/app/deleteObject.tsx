import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Input,
  FormLabel,
  FormControl,
  Code,
  useToast
} from "@chakra-ui/react";
import { setValueFromEvent } from "./utils";
import { useState } from "react";

const DeleteObject = ({
  isOpen,
  onOpen,
  onClose,
  cancelRef,
  objectKey,
  action
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  cancelRef: React.MutableRefObject<any>;
  action: () => void;
  objectKey: string;
}) => {
  const [key, setKey] = useState("");
  const toast = useToast();

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Object
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure? You will not be able to undo this action afterwards.
            Enter Object Key <Code>{objectKey}</Code> to confirm object removal
            <FormControl mt={4}>
              <FormLabel>Object Key</FormLabel>
              <Input
                onChange={(ev) => setValueFromEvent(ev, setKey)}
                placeholder="Object Key"
              />
            </FormControl>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                if (key === objectKey) {
                  action();
                  onClose();
                } else {
                  toast({
                    title: "Wrong Input",
                    description: "Input must be the same as object key",
                    status: "error",
                    duration: 5000,
                    isClosable: true
                  });
                }
              }}
              ml={3}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteObject;
