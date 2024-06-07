"use client";

import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  IconButton,
  Stack,
  Alert,
  AlertTitle,
  AlertDescription,
  AlertIcon,
  useDisclosure,
  Button,
  Input,
  Grid,
  Text,
  GridItem,
  ModalFooter,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Icon,
  position,
  Link
} from "@chakra-ui/react";
import Header from "./header";
import React, { useRef, useState } from "react";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  _Object,
  DeleteObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { MdCreateNewFolder, MdOutlineFileUpload } from "react-icons/md";
import moment from "moment";
import {
  DeleteIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
  RepeatIcon
} from "@chakra-ui/icons";
import { __ServiceExceptionOptions } from "@aws-sdk/client-s3/dist-types/models/S3ServiceException";
import DeleteObject from "./deleteObject";
import { readablizeBytes, setValueFromEvent } from "./utils";
import Head from "next/head";
import { IoMdHeart } from "react-icons/io";
export default function Page() {
  const user = useRef<null | S3Client>(null);
  const [selectedObject, setSelectedObject] = useState("");
  const bucket = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<null | File>(null);
  const [objectList, setObjectList] = useState<_Object[]>([]);
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  const [fileFolderName, setFileFolderName] = useState<string | null>(null);
  const toast = useToast();
  const deleteCancelRef = React.useRef();
  const initialCreateFolderRef = React.useRef(null);
  const finalCreateFolderRef = React.useRef(null);
  const initialUploadFileRef = React.useRef(null);
  const finalUploadFileRef = React.useRef(null);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    isOpen: isCreateFolderOpen,
    onOpen: onCreateFolderOpen,
    onClose: onCreateFolderClose
  } = useDisclosure();
  const {
    isOpen: isUploadFileOpen,
    onOpen: onUploadFileOpen,
    onClose: onUploadFileClose
  } = useDisclosure();
  const loadFileList = async () => {
    if (user.current) {
      setIsLoading(true);
      const command = new ListObjectsV2Command({
        Bucket: bucket.current,
        // TODO: use StartAfter to handle pagination
        MaxKeys: 100
      });
      try {
        let isTruncated = true;
        let list = [];
        while (isTruncated) {
          const { Contents, IsTruncated, NextContinuationToken } =
            await user.current.send(command);
          list.push(...(Contents || []));
          isTruncated = IsTruncated === true;
          command.input.ContinuationToken = NextContinuationToken;
        }
        setObjectList(list);
      } catch (err: any) {
        toast({
          title: "Error while getting object list",
          description: err.toString(),
          status: "error",
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <>
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
          <Modal
            initialFocusRef={initialUploadFileRef}
            finalFocusRef={finalUploadFileRef}
            isOpen={isUploadFileOpen}
            onClose={onUploadFileClose}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Upload File</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl>
                  <FormLabel>Folder Name / Prefix (Optional)</FormLabel>
                  <Input
                    onChange={(ev) => setValueFromEvent(ev, setFileFolderName)}
                    ref={initialUploadFileRef}
                    placeholder="Folder Name / Prefix"
                  />
                </FormControl>
                <FormControl marginTop={5}>
                  <FormLabel>File (browse or drag)</FormLabel>
                  <Input
                    onChange={(ev) => {
                      if (ev.target.files) {
                        setUploadFile(ev.target.files[0]);
                      }
                    }}
                    type="file"
                    id="uploader"
                    variant="ghost"
                  />
                </FormControl>
              </ModalBody>

              <ModalFooter>
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
                            toast({
                              title: "Error while uploading object",
                              description: err,
                              status: "error",
                              duration: 5000,
                              isClosable: true
                            });
                          })
                          .finally(() => {
                            loadFileList();
                          });
                      }
                      onUploadFileClose();
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
                  Upload
                </Button>
                <Button onClick={onUploadFileClose}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </GridItem>
        <GridItem w="100%">
          <IconButton
            onClick={onCreateFolderOpen}
            aria-label="New Folder"
            icon={<MdCreateNewFolder />}
          />
          <Modal
            initialFocusRef={initialCreateFolderRef}
            finalFocusRef={finalCreateFolderRef}
            isOpen={isCreateFolderOpen}
            onClose={onCreateFolderClose}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Create New Folder</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <FormControl>
                  <FormLabel>Folder Name</FormLabel>
                  <Input
                    onChange={(ev) => setValueFromEvent(ev, setNewFolderName)}
                    ref={initialCreateFolderRef}
                    placeholder="Folder Name"
                  />
                </FormControl>
              </ModalBody>

              <ModalFooter>
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
                          toast({
                            title: "Error while creating folder",
                            description: err,
                            status: "error",
                            duration: 5000,
                            isClosable: true
                          });
                        })
                        .finally(() => {
                          loadFileList();
                        });
                      onCreateFolderClose();
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
                  Create
                </Button>
                <Button onClick={onCreateFolderClose}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </GridItem>
        <GridItem w="100%">
          <IconButton
            isLoading={isLoading}
            onClick={loadFileList}
            aria-label="Refresh"
            icon={<RepeatIcon />}
          />
        </GridItem>
      </Grid>
      <DeleteObject
        cancelRef={deleteCancelRef}
        isOpen={isDeleteOpen}
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
              toast({
                title: "Error while Removing object",
                description: err,
                status: "error",
                duration: 5000,
                isClosable: true
              });
            })
            .finally(() => {
              loadFileList();
            });
        }}
      />
      {objectList.length > 0 ? (
        <TableContainer marginBottom={10}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Last Modified</Th>
                <Th>Timestamp</Th>
                <Th isNumeric>Size</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {objectList.map((value: _Object, index: number) => (
                <Tr key={index}>
                  <Td>{value.Key}</Td>
                  <Td>{moment(value.LastModified).fromNow()}</Td>
                  <Td>{value.LastModified?.toString()}</Td>
                  <Td isNumeric>{readablizeBytes(value.Size || 0)}</Td>
                  <Td>
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
                          toast({
                            title: "Downloading object",
                            description: "Ensure that you are allowed popups",
                            status: "info",
                            duration: 1500,
                            isClosable: true
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
                                toast({
                                  title: "Error while downloading object",
                                  description:
                                    "Cannot download an empty object",
                                  status: "error",
                                  duration: 5000,
                                  isClosable: true
                                });
                              }
                            })
                            .catch((err) => {
                              toast({
                                title: "Error while downloading object",
                                description: err,
                                status: "error",
                                duration: 5000,
                                isClosable: true
                              });
                            })
                            .finally(() => {
                              loadFileList();
                            });
                        }}
                        aria-label="Download Object"
                        icon={<DownloadIcon />}
                      />

                      <IconButton
                        aria-label="Remove Object"
                        onClick={() => {
                          if (value.Key) {
                            setSelectedObject(value.Key);
                            onDeleteOpen();
                          }
                        }}
                        icon={<DeleteIcon />}
                      />
                      <IconButton
                        onClick={async () => {
                          if (user.current?.config?.endpoint) {
                            const endpoint =
                              await user.current?.config?.endpoint();
                            navigator.clipboard.writeText(
                              endpoint.protocol +
                                "//" +
                                endpoint.hostname +
                                "/" +
                                bucket +
                                "/" +
                                value.Key
                            );
                            toast({
                              title: "Success",
                              description: "Link copied to the clipboard",
                              status: "success",
                              duration: 5000,
                              isClosable: true
                            });
                          }
                        }}
                        aria-label="Copy Object Link"
                        icon={<LinkIcon />}
                      />
                    </Stack>
                  </Td>
                </Tr>
              ))}
              <Tr></Tr>
            </Tbody>
            <Tfoot>
              <Tr>
                <Th>Name</Th>
                <Th>Last Modified</Th>
                <Th>Timestamp</Th>
                <Th isNumeric>Size</Th>
                <Th>Actions</Th>
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            You are not logged in or your bucket is empty
          </AlertDescription>
        </Alert>
      )}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%"
        }}
      >
        <Text
          bgColor="var(--chakra-colors-chakra-body-bg)"
          fontSize="md"
          color="var(--chakra-colors-chakra-body-text)"
          align={"center"}
        >
          Made with <Icon color={"red"} as={IoMdHeart} /> by{" "}
          <Link href="https://parmin.cloud" isExternal>
            ParminCloud <ExternalLinkIcon mx="2px" />
          </Link>
        </Text>
      </footer>
    </>
  );
}
