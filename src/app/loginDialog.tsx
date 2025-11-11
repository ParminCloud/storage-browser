"use client";

import React from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import { Radio, RadioGroup } from "@/components/ui/radio";
import {
  Button,
  Input,
  Stack,
  RadioGroupValueChangeDetails,
  Fieldset,
  Box,
} from "@chakra-ui/react";
import { getClient, getSavedCredentials, setValueFromEvent } from "./utils";
import { S3Client } from "@aws-sdk/client-s3";
import { CloseButton } from "@/components/ui/close-button";

const LoginDialog = ({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onLogin: ({ client, bucket }: { client: S3Client; bucket: string }) => void;
}) => {
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  const endpoints: Record<string, string> = {
    "https://sas.amin.parminstorage.ir":
      "https://sas.amin.parminstorage.ir (Amin, SAS Storage)",
  };
  const savedInformation = getSavedCredentials();
  const [saveToLocal, setSaveToLocal] = React.useState(false);
  React.useEffect(
    () => setSaveToLocal(savedInformation !== null),
    [savedInformation],
  );
  const [accessKey, setAccessKey] = React.useState(
    savedInformation?.accessKey || "",
  );
  const [secretKey, setSecretKey] = React.useState(
    savedInformation?.secretKey || "",
  );
  const [prefix, setPrefix] = React.useState(
    savedInformation?.prefix || "",
  );
  const [endpoint, setEndpoint] =
    React.useState<RadioGroupValueChangeDetails | null>(
      savedInformation?.endpoint || null,
    );
  const [bucket, setBucket] = React.useState(savedInformation?.bucket || "");
  return (
    <DialogRoot
      initialFocusEl={() => initialRef.current}
      finalFocusEl={() => finalRef.current}
      open={open}
      onExitComplete={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login to ParminCloud Storage</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger asChild>
          <CloseButton size="sm" onClick={onClose} />
        </DialogCloseTrigger>
        <DialogBody pb={6}>
          <Fieldset.Root>
            <Fieldset.Legend>Enter your Credencials</Fieldset.Legend>
            <Field label="Access Key">
              <Input
                onChange={(ev) => setValueFromEvent(ev, setAccessKey)}
                value={accessKey}
                placeholder="Access Key"
              />
            </Field>

            <Field label="Secret Key" mt={4}>
              <Input
                onChange={(ev) => setValueFromEvent(ev, setSecretKey)}
                type="password"
                value={secretKey}
                placeholder="Secret Key"
              />
            </Field>
            <Field label="Bucket" mt={4}>
              <Input
                value={bucket}
                onChange={(ev) => setValueFromEvent(ev, setBucket)}
                placeholder="Bucket"
              />
            </Field>
            <Field label="Prefix / Folder" mt={4}>
              <Input
                value={prefix}
                onChange={(ev) => setValueFromEvent(ev, setPrefix)}
                placeholder="Prefix / Folder (Optional)"
              />
            </Field>

            <RadioGroup
              value={endpoint?.value}
              onValueChange={setEndpoint}
              mt={4}
            >
              <Fieldset.Legend paddingBottom="2%">
                Region/Storage Class
              </Fieldset.Legend>

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
          </Fieldset.Root>
          <Checkbox
            gap="4"
            paddingTop="5%"
            alignItems="flex-start"
            checked={saveToLocal}
            onCheckedChange={(e) => setSaveToLocal(!!e.checked)}
          >
            <Box lineHeight="1">Save credendials in browser</Box>
            <Box fontWeight="normal" color="fg.muted" mt="1">
              Will save information on browser local storage
            </Box>
          </Checkbox>
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={async () => {
              if (endpoint && accessKey && secretKey && bucket) {
                if (saveToLocal) {
                  localStorage.setItem(
                    "loginInformation",
                    JSON.stringify({
                      endpoint,
                      accessKey,
                      secretKey,
                      bucket,
                      prefix
                    }),
                  );
                } else {
                  localStorage.removeItem("loginInformation");
                }
                const client = getClient({
                  endpoint: endpoint.value,
                  accessKey,
                  secretKey,
                });
                if (client) {
                  onLogin({ client: client, bucket: bucket });
                }
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
            variant="solid"
          >
            Login
          </Button>
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default LoginDialog;
