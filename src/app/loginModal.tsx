import React from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  useToast
} from "@chakra-ui/react";
import { setValueFromEvent } from "./utils";
import { S3Client } from "@aws-sdk/client-s3";

const LoginModal = ({
  isOpen,
  onOpen,
  onClose,
  onLogin
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onLogin: ({ client, bucket }: { client: S3Client; bucket: string }) => void;
}) => {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  const endpoints: Record<string, string> = {
    "https://s3.amin.parminpaas.ir": "https://s3.amin.parminpaas.ir (Amin)"
  };
  const [accessKey, setAccessKey] = React.useState("");
  const [secretKey, setSecretKey] = React.useState("");
  const [endpoint, setEndpoint] = React.useState("");
  const [bucket, setBucket] = React.useState("");
  const toast = useToast();
  return (
    <Modal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Login to ParminCloud Storage</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>Access Key</FormLabel>
            <Input
              onChange={(ev) => setValueFromEvent(ev, setAccessKey)}
              ref={initialRef}
              placeholder="Access Key"
            />
          </FormControl>

          <FormControl mt={4}>
            <FormLabel>Secret Key</FormLabel>
            <Input
              onChange={(ev) => setValueFromEvent(ev, setSecretKey)}
              type="password"
              placeholder="Secret Key"
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Bucket</FormLabel>
            <Input
              onChange={(ev) => setValueFromEvent(ev, setBucket)}
              placeholder="Bucket"
            />
          </FormControl>

          <RadioGroup onChange={setEndpoint} mt={4}>
            <FormLabel>Endpoint</FormLabel>
            <Stack direction="column">
              {Object.keys(endpoints).map((key, _) => {
                return (
                  <Radio key={key} value={key}>
                    {endpoints[key]}
                  </Radio>
                );
              })}
            </Stack>
          </RadioGroup>
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={async () => {
              if (endpoint && accessKey && secretKey && bucket) {
                const client = new S3Client({
                  endpoint: endpoint,
                  forcePathStyle: true,
                  credentials: {
                    accessKeyId: accessKey,
                    secretAccessKey: secretKey
                  },
                  region: "us-east-1"
                });
                onLogin({ client: client, bucket: bucket });
                onClose();
              } else {
                toast({
                  title: "Input Error",
                  description: "Ensure that required inputs are filled",
                  status: "error",
                  duration: 5000,
                  isClosable: true
                });
              }
            }}
            colorScheme="blue"
            mr={3}
          >
            Login
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
