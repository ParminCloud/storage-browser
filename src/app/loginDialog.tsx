import React from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "@/components/ui/dialog"

import { toaster } from "@/components/ui/toaster"
import { Field } from "@/components/ui/field"
import { Radio, RadioGroup } from "@/components/ui/radio"
import {
  Button,
  Input,
  Stack,
  RadioGroupValueChangeDetails
} from "@chakra-ui/react";
import { setValueFromEvent } from "./utils";
import { S3Client } from "@aws-sdk/client-s3";

const LoginDialog = ({
  open,
  onClose,
  onLogin
}: {
  open: boolean;
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
  const [endpoint, setEndpoint] = React.useState<RadioGroupValueChangeDetails | null>(null);
  const [bucket, setBucket] = React.useState("");
  return (
    <DialogRoot
      initialFocusEl={() => initialRef.current}
      finalFocusEl={() => finalRef.current}
      open={open}
      onExitComplete={onClose}
    >
      <DialogContent>
        <DialogHeader>Login to ParminCloud Storage</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          <Field label="Access Key">
            <Input
              onChange={(ev) => setValueFromEvent(ev, setAccessKey)}
              ref={initialRef}
              placeholder="Access Key"
            />
          </Field>

          <Field label="Secret Key" mt={4}>
            <Input
              onChange={(ev) => setValueFromEvent(ev, setSecretKey)}
              type="password"
              placeholder="Secret Key"
            />
          </Field>
          <Field label="Bucket" mt={4}>
            <Input
              onChange={(ev) => setValueFromEvent(ev, setBucket)}
              placeholder="Bucket"
            />
          </Field>

          <RadioGroup onValueChange={setEndpoint} mt={4}>
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
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={async () => {
              if (endpoint && accessKey && secretKey && bucket) {
                const client = new S3Client({
                  endpoint: endpoint.value,
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
                toaster.create({
                  title: "Input Error",
                  description: "Ensure that required inputs are filled",
                  type: "error",
                  duration: 5000,
                });
              }
            }}
            colorPalette="blue"
            mr={3}
          >
            Login
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default LoginDialog;
