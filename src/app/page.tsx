"use client";

import { Field } from "@/components/ui/field"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "@/components/ui/dialog"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { Alert } from "@/components/ui/alert"
import {
  Table,
  IconButton,
  Stack,
  useDisclosure,
  Button,
  Input,
  Grid,
  Text,
  GridItem,
  Icon,
  Link,
  Center,
  FormatByte,
  Box,
  Spinner
} from "@chakra-ui/react";
import { ClipboardIconButton, ClipboardRoot } from "@/components/ui/clipboard";
import Header from "./header";
import { useRef, useState, MutableRefObject } from "react";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  _Object,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { MdCreateNewFolder, MdOutlineFileUpload } from "react-icons/md";
import moment from "moment";
import { FaExternalLinkAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { __ServiceExceptionOptions } from "@aws-sdk/client-s3/dist-types/models/S3ServiceException";
import DeleteObject from "./deleteObject";
import { setValueFromEvent } from "./utils";
import { IoMdHeart, IoMdCloudDownload, IoMdRefresh } from "react-icons/io";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Endpoint } from "@smithy/types";

export default function Page() {
  const userUpstreamRef = useRef<null | S3Client>(null);
  const [selectedObject, setSelectedObject] = useState("");
  const bucket = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<null | File>(null);
  const [objectList, setObjectList] = useState<_Object[]>([]);
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  const [fileFolderName, setFileFolderName] = useState<string | null>(null);
  const deleteCancelRef = useRef();
  const initialCreateFolderRef = useRef(null);
  const finalCreateFolderRef = useRef(null);
  const initialUploadFileRef = useRef(null);
  const finalUploadFileRef = useRef(null);
  const [endpoint, setEndpoint] = useState<null | Endpoint>(null);
  const [page, setPage] = useState(1);
  const [currentToken, setCurrentToken] = useState<undefined | string>();
  const [nextToken, setNextToken] = useState<undefined | string>();
  const [prevTokens, setPrevTokens] = useState<Array<undefined | string>>([]);
  const userRefHandler = {
    set: (target: MutableRefObject<S3Client | null>, prop: keyof MutableRefObject<S3Client | null>, newValue: any, _: any) => {
      target[prop] = newValue;
      if (user.current?.config?.endpoint) {
        user.current.config
          .endpoint()
          .then((v: Endpoint) => {
            setEndpoint(v);
          })
      }
      return true;
    },
  };
  const user = new Proxy(userUpstreamRef, userRefHandler);
  const getObjectLink = (object: _Object): string => {
    return endpoint?.protocol +
      "//" +
      endpoint?.hostname +
      "/" +
      bucket?.current +
      "/" +
      object.Key
  }
  const {
    open: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    open: isCreateFolderOpen,
    onOpen: onCreateFolderOpen,
    onClose: onCreateFolderClose
  } = useDisclosure();
  const {
    open: isUploadFileOpen,
    onOpen: onUploadFileOpen,
    onClose: onUploadFileClose
  } = useDisclosure();
  const loadFileList = async (token?: string) => {
    console.log(token)
    if (user.current) {
      setIsLoading(true);
      const command = new ListObjectsV2Command({
        Bucket: bucket.current,
        MaxKeys: 15,
        ContinuationToken: token
      });
      try {
        setObjectList([]);
        const { Contents, NextContinuationToken } =
          await user.current.send(command);
        setObjectList(Contents || []);
        setNextToken(NextContinuationToken)
      } catch (err: any) {
        toaster.create({
          title: "Error while getting object list",
          description: err.toString(),
          type: "error",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <Box>
      <Toaster />
      <Header
        user={user.current}
        onLogin={({
          client,
          bucket: inputBucket
        }: {
          client: S3Client;
          bucket: string;
        }) => {
          bucket.current = inputBucket;
          user.current = client;
          loadFileList();
        }}
      />
      <Grid
        templateColumns="100fr 1fr 1fr"
        gap="1"
        hidden={user.current === null}
        padding={2}
      >
        <GridItem w="100%">
          <Button
            width="100%"
            aria-label="Click to Upload File"
            onClick={onUploadFileOpen}
          >
            <MdOutlineFileUpload fontSize={25} />
            Click to Upload File
          </Button>
          <DialogRoot
            initialFocusEl={() => initialUploadFileRef.current}
            finalFocusEl={() => finalUploadFileRef.current}
            open={isUploadFileOpen}
            onExitComplete={onUploadFileClose}
          >
            <DialogContent>
              <DialogHeader>Upload File</DialogHeader>
              <DialogCloseTrigger />
              <DialogBody pb={6}>
                <Field label="Folder Name / Prefix (Optional)">
                  <Input
                    onChange={(ev) => setValueFromEvent(ev, setFileFolderName)}
                    ref={initialUploadFileRef}
                    placeholder="Folder Name / Prefix"
                  />
                </Field>
                <Field label="File (browse or drag)" marginTop={5}>
                  <Input
                    onChange={(ev) => {
                      if (ev.target.files) {
                        setUploadFile(ev.target.files[0]);
                      }
                    }}
                    type="file"
                    id="uploader"
                    variant="outline"
                  />
                </Field>
              </DialogBody>

              <DialogFooter>
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    if (uploadFile) {
                      let key = "";
                      if (fileFolderName) {
                        key = fileFolderName;
                        if (!fileFolderName.endsWith("/")) {
                          key += "/";
                        }
                      }
                      key += uploadFile.name;
                      if (uploadFile) {
                        const command = new PutObjectCommand({
                          Bucket: bucket.current,
                          Key: key,
                          Body: uploadFile,
                          ContentType: uploadFile.type
                        });
                        setIsLoading(true);
                        user.current
                          ?.send(command)
                          .catch((err) => {
                            toaster.create({
                              title: "Error while uploading object",
                              description: err,
                              type: "error",
                              duration: 5000,
                            });
                          })
                          .finally(() => {
                            loadFileList();
                          });
                      }
                      onUploadFileClose();
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
                  Upload
                </Button>
                <Button onClick={onUploadFileClose}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>
        </GridItem>
        <GridItem w="100%">
          <IconButton
            onClick={onCreateFolderOpen}
            aria-label="New Folder"
          >
            <MdCreateNewFolder />
          </IconButton>
          <DialogRoot
            initialFocusEl={() => initialCreateFolderRef.current}
            finalFocusEl={() => finalCreateFolderRef.current}
            open={isCreateFolderOpen}
            onExitComplete={onCreateFolderClose}
          >
            <DialogContent>
              <DialogHeader>Create New Folder</DialogHeader>
              <DialogCloseTrigger />
              <DialogBody pb={6}>
                <Field label="Folder Name">
                  <Input
                    onChange={(ev) => setValueFromEvent(ev, setNewFolderName)}
                    ref={initialCreateFolderRef}
                    placeholder="Folder Name"
                  />
                </Field>
              </DialogBody>

              <DialogFooter>
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    if (newFolderName) {
                      let name = newFolderName;
                      if (!name.endsWith("/")) {
                        name += "/";
                      }
                      const command = new PutObjectCommand({
                        Bucket: bucket.current,
                        Key: name
                      });
                      user.current
                        ?.send(command)
                        .catch((err) => {
                          toaster.create({
                            title: "Error while creating folder",
                            description: err,
                            type: "error",
                            duration: 5000,
                          });
                        })
                        .finally(() => {
                          loadFileList();
                        });
                      onCreateFolderClose();
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
                  Create
                </Button>
                <Button onClick={onCreateFolderClose}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>
        </GridItem>
        <GridItem w="100%">
          <IconButton
            onClick={() => loadFileList()}
            aria-label="Refresh"
          >
            <IoMdRefresh />
          </IconButton>
        </GridItem>
      </Grid>
      <DeleteObject
        cancelRef={deleteCancelRef}
        open={isDeleteOpen}
        onClose={onDeleteClose}
        onOpen={onDeleteOpen}
        objectKey={selectedObject || ""}
        action={async () => {
          setIsLoading(true);
          const command = new DeleteObjectCommand({
            Bucket: bucket.current,
            Key: selectedObject
          });
          user.current
            ?.send(command)
            .catch((err) => {
              toaster.create({
                title: "Error while Removing object",
                description: err,
                type: "error",
                duration: 5000,
              });
            })
            .finally(() => {
              loadFileList();
            });
        }}
      />
      {objectList.length > 0 ? (
        <Table.ScrollArea marginBottom={10}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Last Modified</Table.ColumnHeader>
                <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {objectList.map((value: _Object, index: number) => (
                <Table.Row key={index}>
                  <Table.Cell>{value.Key}</Table.Cell>
                  <Table.Cell>{moment(value.LastModified).fromNow()}</Table.Cell>
                  <Table.Cell>{value.LastModified?.toString()}</Table.Cell>
                  <Table.Cell><FormatByte value={value.Size || 0} /></Table.Cell>
                  <Table.Cell>
                    <Stack
                      direction={{ base: "column", md: "row" }}
                      width={{ base: "full", md: "auto" }}
                      mt={{ base: 4, md: 0 }}
                    >
                      <IconButton
                        onClick={() => {
                          const command = new GetObjectCommand({
                            Bucket: bucket.current,
                            Key: value.Key
                          });
                          toaster.create({
                            title: "Downloading object",
                            description: "Ensure that you are allowed popups",
                            type: "info",
                            duration: 1500,
                          });
                          user.current
                            ?.send(command)
                            .then(async (response) => {
                              const data =
                                await response.Body?.transformToByteArray();
                              if (data) {
                                const blob = new Blob([data], {
                                  type: response.ContentType
                                });
                                const url = URL.createObjectURL(blob);
                                window.open(url);
                              } else {
                                toaster.create({
                                  title: "Error while downloading object",
                                  description:
                                    "Cannot download an empty object",
                                  type: "error",
                                  duration: 5000,
                                });
                              }
                            })
                            .catch((err) => {
                              toaster.create({
                                title: "Error while downloading object",
                                description: err,
                                type: "error",
                                duration: 5000,
                              });
                            })
                            .finally(() => {
                              loadFileList();
                            });
                        }}
                        aria-label="Download Object"
                      ><IoMdCloudDownload /></IconButton>

                      <IconButton
                        aria-label="Remove Object"
                        onClick={() => {
                          if (value.Key) {
                            setSelectedObject(value.Key);
                            onDeleteOpen();
                          }
                        }}
                      ><MdDelete /></IconButton>
                      <ClipboardRoot
                        value={getObjectLink(value)}
                        timeout={1000}>
                        <ClipboardIconButton size="md" variant="solid" />
                      </ClipboardRoot>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ))}
              <Table.Row></Table.Row>
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Last Modified</Table.ColumnHeader>
                <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
          <Center paddingTop="1%">
            <PaginationRoot page={page} count={Infinity} onPageChange={
              (e) => {
                let token: string | undefined = undefined;
                if (e.page > page) {
                  if (nextToken) {
                    setPrevTokens((prev) => [...prev, currentToken]);
                    setCurrentToken(nextToken);
                    token = nextToken
                  } else {
                    if (prevTokens.length > 0) {
                      const previousToken = prevTokens.pop();
                      setCurrentToken(previousToken);
                      setPrevTokens([...prevTokens]);
                      token = previousToken;
                    }
                  }
                }
                loadFileList(token).then(() => setPage(e.page))
              }} pageSize={15}>
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </PaginationRoot>
          </Center>
        </Table.ScrollArea>
      ) : (
        <Alert status="warning" title="No Data">
          You are not logged in or your bucket is empty
        </Alert>
      )}
      <footer
        style={{
          bottom: 0,
          width: "100%"
        }}
      >
        <Center>
          <Text
            bgColor="var(--chakra-colors-chakra-body-bg)"
            fontSize="md"
            alignContent={'center'}
            color="var(--chakra-colors-chakra-body-text)"
          >
            Made with <Icon color={"red"}><IoMdHeart /></Icon> by {" "}
            <Link href="https://parmin.cloud">
              ParminCloud <Icon><FaExternalLinkAlt max="2px" /></Icon>
            </Link>
          </Text>
        </Center>
      </footer>
      <Box pos="absolute" hidden={!isLoading} inset="0" bg="bg/80">
        <Center h="full">
          <Spinner />
        </Center>
      </Box>
    </Box>
  );
}
