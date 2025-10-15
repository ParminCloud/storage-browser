"use client";

import React from "react";
import { Field } from "@/components/ui/field"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle
} from "@/components/ui/dialog"
import {
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
  Spinner,
} from "@chakra-ui/react";
import { ClipboardIconButton, ClipboardRoot } from "@/components/ui/clipboard";
import Header from "./header";
import { useRef, useState, RefObject, useEffect } from "react";
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
import { FaArrowDown, FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { __ServiceExceptionOptions } from "@aws-sdk/client-s3/dist-types/models/S3ServiceException";
import DeleteObject from "./deleteObject";
import { getClient, getSavedCredentials, setValueFromEvent } from "./utils";
import { IoMdHeart, IoMdCloudDownload, IoMdRefresh } from "react-icons/io";
import { toaster } from "@/components/ui/toaster";
import { Endpoint } from "@smithy/types";
import { CloseButton } from "@/components/ui/close-button";
import { LuFolderClosed, LuFolderOpen } from "react-icons/lu";

export default function Page() {
  const userUpstreamRef = useRef<null | S3Client>(null);
  const [selectedObject, setSelectedObject] = useState("");
  const bucket = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<null | File>(null);
  const [objectList, setObjectList] = useState<_Object[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  const [fileFolderName, setFileFolderName] = useState<string | null>(null);
  const deleteCancelRef = useRef(null);
  const initialCreateFolderRef = useRef(null);
  const finalCreateFolderRef = useRef(null);
  const initialUploadFileRef = useRef(null);
  const finalUploadFileRef = useRef(null);
  const [endpoint, setEndpoint] = useState<null | Endpoint>(null);
  const [page, setPage] = useState(1);
  const [currentToken, setCurrentToken] = useState<undefined | string>();
  const [nextToken, setNextToken] = useState<undefined | string>();
  const [prevTokens, setPrevTokens] = useState<Array<undefined | string>>([]);
  const [savedInformation,] = useState(getSavedCredentials())
  const userRefHandler = {
    set: (target: RefObject<S3Client | null>, prop: keyof RefObject<S3Client | null>, newValue: any, _: any) => {
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
  const onLogin = ({
    client,
    bucket: inputBucket
  }: {
    client: S3Client;
    bucket: string;
  }) => {
    bucket.current = inputBucket;
    user.current = client;
    loadFileList();
  }
  useEffect(() => {
    if (savedInformation) {
      const client = getClient(
        {
          endpoint: savedInformation.endpoint.value,
          accessKey: savedInformation.accessKey,
          secretKey: savedInformation.secretKey
        }
      );
      if (client) {
        onLogin({ client: client, bucket: savedInformation.bucket });
      }
    }
  }, [savedInformation]);
  const getObjectLink = (object: _Object): string => {
    return endpoint?.protocol +
      "//" +
      endpoint?.hostname +
      "/" +
      bucket?.current +
      "/" +
      object.Key
  }

  type TreeNode = {
    name: string;
    key: string; // full key for files, prefix for folders
    isFolder: boolean;
    size?: number;
    lastModified?: Date;
    children?: TreeNode[];
  };

  const buildTree = (objects: _Object[]): TreeNode[] => {
    const rootMap: Map<string, TreeNode> = new Map();

    const ensureFolder = (pathParts: string[], accumKey: string) => {
      let parentMap = rootMap;
      let currentKey = "";
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentKey = currentKey ? `${currentKey}/${part}` : part;
        const folderKey = currentKey + "/";
        if (!parentMap.has(folderKey)) {
          parentMap.set(folderKey, {
            name: part,
            key: folderKey,
            isFolder: true,
            children: [],
          });
        }
        const node = parentMap.get(folderKey)!;
        if (!node.children) node.children = [];
        // move into children map by creating a pseudo map stored on the node via symbol
        // we'll instead collect children later by walking objects
      }
    };

    // Simpler approach: create a nested object tree by splitting keys
    const tree: Record<string, TreeNode> = {};

    const insert = (obj: _Object) => {
      if (!obj.Key) return;
      const parts = obj.Key.split("/");
      let currChildren = tree;
      let prefix = "";
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const nodeKey = prefix ? `${prefix}/${part}` : part;
        const folderKey = isLast && obj.Key.endsWith("/") ? nodeKey + "/" : (isLast ? nodeKey : nodeKey + "/");
        if (!currChildren[folderKey]) {
          currChildren[folderKey] = {
            name: part,
            key: isLast && !obj.Key.endsWith("/") ? nodeKey : folderKey,
            isFolder: !isLast || obj.Key.endsWith("/"),
            children: [],
            size: isLast && !obj.Key.endsWith("/") ? obj.Size : undefined,
            lastModified: isLast && obj.LastModified ? new Date(obj.LastModified) : undefined,
          };
        }
        const node = currChildren[folderKey];
        // prepare for next level: use a map keyed by folderKey for children
        if (!node.children) node.children = [];
        // find or create next map container by using a temporary map on node via a symbol is complex; instead
        // we'll represent tree as nested arrays by traversing existing children
        // if not last, move into child container represented by an object mapping name->node for easier inserts
        if (isLast) return;
        // find child container map by building a temporary map of children keyed by their key
        const nextMap: Record<string, TreeNode> = {};
        node.children.forEach((c) => (nextMap[c.key] = c));
        prefix = nodeKey;
        // now set currChildren pointing to nextMap so next iteration can insert into it
        currChildren = nextMap;
      }
    };

    // Because the above approach using dynamic maps is getting convoluted, implement a straightforward recursive builder
    const rootNodes: TreeNode[] = [];

    const addToNodes = (nodes: TreeNode[], parts: string[], fullKey: string, obj: _Object) => {
      if (parts.length === 0) return;
      const [head, ...rest] = parts;
      const isLast = rest.length === 0;
      const folder = isLast && fullKey.endsWith("/") ? true : !isLast;
      const nodeKey = isLast ? (fullKey.endsWith("/") ? fullKey : fullKey) : `${head}/`;
      let node = nodes.find((n) => n.name === head && n.isFolder === folder);
      if (!node) {
        node = {
          name: head,
          key: isLast ? fullKey : (nodes === rootNodes ? `${head}/` : `${nodes[0]?.key || ""}${head}/`),
          isFolder: !isLast || fullKey.endsWith("/"),
          children: [],
        };
        nodes.push(node);
      }
      if (isLast) {
        // set file properties when it's a file
        if (!node.isFolder) {
          node.size = obj.Size;
          node.lastModified = obj.LastModified ? new Date(obj.LastModified) : undefined;
          node.key = fullKey;
        }
        return;
      }
      addToNodes(node.children!, rest, fullKey, obj);
    };

    objects.forEach((obj) => {
      if (!obj.Key) return;
      const key = obj.Key;
      const parts = key.split("/").filter((p) => p !== "");
      if (parts.length === 0) return;
      addToNodes(rootNodes, parts, key, obj);
    });

    return rootNodes;
  };

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNode = (node: TreeNode, depth = 0, index?: number): React.ReactNode => {
    const paddingLeft = `${depth * 20}px`;
    if (node.isFolder) {
      const isOpen = !!expandedFolders[node.key];
      const rows: React.ReactNode[] = [];
      rows.push(
        <Table.Row key={node.key}>
          <Table.Cell>
            <Box onClick={() => toggleFolder(node.key)} cursor="pointer" pl={paddingLeft}>
              <span style={{"display": "flex"}}>{isOpen ? <FaArrowDown/> : <FaArrowRight/>}&nbsp;&nbsp;{node.name}</span>
            </Box>
          </Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell></Table.Cell>
          <Table.Cell>
            <Stack direction={{ base: "column", md: "row" }} width={{ base: "full", md: "auto" }} mt={{ base: 4, md: 0 }}>
              <IconButton size="sm" onClick={() => { toggleFolder(node.key); }}>
              {
                isOpen ?
                <LuFolderOpen/>
                :
                <LuFolderClosed/>
              }
              </IconButton>
            </Stack>
          </Table.Cell>
        </Table.Row>
      );
      if (isOpen && node.children) {
        node.children.forEach((child) => {
          const childRendered = renderNode(child, depth + 1);
          if (Array.isArray(childRendered)) {
            rows.push(...childRendered);
          } else if (childRendered) {
            rows.push(childRendered as React.ReactNode);
          }
        });
      }
      return rows;
    }
    // file
    return (
      <Table.Row key={node.key}>
        <Table.Cell style={{ paddingLeft }}>{node.name}</Table.Cell>
        <Table.Cell>{node.lastModified ? moment(node.lastModified).fromNow() : ""}</Table.Cell>
        <Table.Cell>{node.lastModified?.toString() || ""}</Table.Cell>
        <Table.Cell><FormatByte value={node.size || 0} /></Table.Cell>
        <Table.Cell>
          <Stack direction={{ base: "column", md: "row" }} width={{ base: "full", md: "auto" }} mt={{ base: 4, md: 0 }}>
            <IconButton
              onClick={() => {
                const command = new GetObjectCommand({
                  Bucket: bucket.current,
                  Key: node.key
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
                    const data = await response.Body?.transformToByteArray();
                    if (data) {
                      const blob = new Blob([data as BlobPart], { type: response.ContentType });
                      const url = URL.createObjectURL(blob);
                      window.open(url);
                    } else {
                      toaster.create({ title: "Error while downloading object", description: "Cannot download an empty object", type: "error", duration: 5000, });
                    }
                  })
                  .catch((err) => {
                    toaster.create({ title: "Error while downloading object", description: err, type: "error", duration: 5000, });
                  })
                  .finally(() => { loadFileList(); });
              }}
              aria-label="Download Object"
            ><IoMdCloudDownload /></IconButton>

            <IconButton aria-label="Remove Object" onClick={() => { if (node.key) { setSelectedObject(node.key); onDeleteOpen(); } }}><MdDelete /></IconButton>
            <ClipboardRoot value={endpoint?.protocol + "//" + endpoint?.hostname + "/" + bucket?.current + "/" + node.key} timeout={1000}>
              <ClipboardIconButton size="md" variant="solid" />
            </ClipboardRoot>
          </Stack>
        </Table.Cell>
      </Table.Row>
    );
  };
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
    if (user.current) {
      setIsLoading(true);
      const command = new ListObjectsV2Command({
        Bucket: bucket.current,
        MaxKeys: 15,
        ContinuationToken: token
      });
      try {
        setObjectList([]);
        const { Contents, NextContinuationToken } = await user.current.send(command);
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
    <Box paddingLeft={"2.5vw"} paddingRight={"2.5vw"}>
      <Header
        user={user.current}
        onLogin={onLogin}
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
              <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
              <DialogCloseTrigger asChild>
                <CloseButton size="sm" onClick={onUploadFileClose} />
              </DialogCloseTrigger>
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
                  variant="solid"
                >
                  Upload
                </Button>
                <Button variant={"outline"} onClick={onUploadFileClose}>Cancel</Button>
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
              <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
              <DialogCloseTrigger asChild>
                <CloseButton size="sm" onClick={onCreateFolderClose} />
              </DialogCloseTrigger>
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
                  variant={"solid"}
                >
                  Create
                </Button>
                <Button variant={"outline"} onClick={onCreateFolderClose}>Cancel</Button>
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
              {/* Build tree and render nodes */}
              {(() => {
                const tree = buildTree(objectList);
                return tree.map((node) => (
                  <React.Fragment key={node.key}>{renderNode(node)}</React.Fragment>
                ));
              })()}
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
