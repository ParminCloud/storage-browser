"use client";

import React, { useRef, useState, RefObject, useEffect } from "react";
import {
  Box,
  Spinner,
  Center,
  useDisclosure,
  useFileUpload,
} from "@chakra-ui/react";
import { S3Client, _Object } from "@aws-sdk/client-s3";
import { Alert } from "@/components/ui/alert";
import { Endpoint } from "@smithy/types";

// Local imports
import Header from "./header";
import DeleteObject from "./deleteObject";
import { getClient, getSavedCredentials } from "./utils";
import { FileBrowserToolbar } from "./components/FileBrowserToolbar";
import { FileBrowserTable } from "./components/FileBrowserTable";
import { UploadFileDialog } from "./components/UploadFileDialog";
import { CreateFolderDialog } from "./components/CreateFolderDialog";
import { PageFooter } from "./components/PageFooter";
import {
  listObjects,
  deleteObject as performDelete,
} from "./lib/s3-operations";
import { LoginPayload } from "./types";

export default function Page() {
  // ============ State Management ============
  const userUpstreamRef = useRef<null | S3Client>(null);
  const [selectedObject, setSelectedObject] = useState("");
  const bucket = useRef("");
  const prefix = useRef<undefined | string>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const fileUpload = useFileUpload({ maxFiles: 10 });
  const [objectList, setObjectList] = useState<_Object[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const deleteCancelRef = useRef(null);
  const [endpoint, setEndpoint] = useState<null | Endpoint>(null);
  const [savedInformation] = useState(getSavedCredentials());

  // ============ Pagination State ============
  const [page, setPage] = useState(1);
  const [currentToken, setCurrentToken] = useState<undefined | string>();
  const [nextToken, setNextToken] = useState<undefined | string>();
  const [prevTokens, setPrevTokens] = useState<Array<undefined | string>>([]);

  // ============ Dialog States ============
  const {
    open: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    open: isCreateFolderOpen,
    onOpen: onCreateFolderOpen,
    onClose: onCreateFolderClose,
  } = useDisclosure();

  const {
    open: isUploadFileOpen,
    onOpen: onUploadFileOpen,
    onClose: onUploadFileClose,
  } = useDisclosure();

  // ============ Proxy Handler ============
  const userRefHandler = {
    set: (
      target: RefObject<S3Client | null>,
      prop: keyof RefObject<S3Client | null>,
      newValue: any,
      _: any,
    ) => {
      target[prop] = newValue;
      if (user.current?.config?.endpoint) {
        user.current.config.endpoint().then((v: Endpoint) => {
          setEndpoint(v);
        });
      }
      return true;
    },
  };

  const user = new Proxy(userUpstreamRef, userRefHandler);

  // ============ Event Handlers ============

  const onLogin = (payload: LoginPayload) => {
    bucket.current = payload.bucket;
    user.current = payload.client;
    prefix.current = payload.prefix;
            console.log("Listing objects with prefix:", prefix);

    loadFileList();
  };

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteClick = (key: string) => {
    setSelectedObject(key);
    onDeleteOpen();
  };

  const handlePageChange = (newPage: number) => {
    let token: string | undefined = undefined;
    if (newPage > page) {
      // moving forward
      if (nextToken) {
        setPrevTokens((prev) => [...prev, currentToken]);
        setCurrentToken(nextToken);
        token = nextToken;
      }
    } else if (newPage < page) {
      // moving backward
      if (prevTokens.length > 0) {
        const previousTokens = [...prevTokens];
        const previousToken = previousTokens.pop();
        setPrevTokens(previousTokens);
        setCurrentToken(previousToken);
        token = previousToken;
      }
    }

    loadFileList(token).then(() => setPage(newPage));
  };

  const handleRefresh = () => {
    loadFileList();
  };

  // ============ S3 Operations ============

  const loadFileList = async (token?: string) => {
    if (!user.current) return;

    setIsLoading(true);

    try {
      const result = await listObjects(user.current, bucket.current, token, prefix.current);
      setObjectList(result.contents);
      setNextToken(result.nextToken);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteObject = async () => {
    if (!user.current || !selectedObject) return;

    setIsLoading(true);

    try {
      await performDelete(user.current, bucket.current, selectedObject, prefix.current);
      await loadFileList();
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Effects ============

  // Auto-login with saved credentials on mount
  useEffect(() => {
    if (savedInformation) {
      const client = getClient({
        endpoint: savedInformation.endpoint.value,
        accessKey: savedInformation.accessKey,
        secretKey: savedInformation.secretKey,
      });

      if (client) {
        onLogin({ client, bucket: savedInformation.bucket, prefix: savedInformation.prefix || undefined });
      }
    }
  }, [savedInformation]);

  // ============ Render ============

  const isLoggedIn = user.current !== null;

  return (
    <Box paddingLeft={"2.5vw"} paddingRight={"2.5vw"}>
      {/* Header */}
      <Header user={user.current} onLogin={onLogin} />

      {/* Toolbar */}
      <FileBrowserToolbar
        isLoggedIn={isLoggedIn}
        onUploadClick={onUploadFileOpen}
        onCreateFolderClick={onCreateFolderOpen}
        onRefreshClick={handleRefresh}
      />

      {/* Upload Dialog */}
      <UploadFileDialog
        open={isUploadFileOpen}
        onClose={onUploadFileClose}
        fileUpload={fileUpload}
        onUploadSuccess={() => loadFileList()}
        client={user.current}
        bucket={bucket.current}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        prefix={prefix.current}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onClose={onCreateFolderClose}
        onFolderCreated={() => loadFileList()}
        client={user.current}
        bucket={bucket.current}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        prefix={prefix.current}
      />

      {/* Delete Dialog */}
      <DeleteObject
        cancelRef={deleteCancelRef}
        open={isDeleteOpen}
        onClose={onDeleteClose}
        onOpen={onDeleteOpen}
        objectKey={selectedObject || ""}
        action={handleDeleteObject}
      />

      {/* File Browser Table */}
      {objectList.length > 0 ? (
        <FileBrowserTable
          objectList={objectList}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          bucket={bucket.current}
          client={user.current}
          endpoint={endpoint}
          onDeleteClick={handleDeleteClick}
          page={page}
          onPageChange={handlePageChange}
          hasNext={!!nextToken}
          hasPrev={prevTokens.length > 0}
          prefix={prefix.current}
        />
      ) : (
        <Alert status="warning" title="No Data">
          You are not logged in or your bucket is empty
        </Alert>
      )}

      {/* Footer */}
      <PageFooter />

      {/* Loading Spinner */}
      <Box pos="absolute" hidden={!isLoading} inset="0" bg="bg/80">
        <Center h="full">
          <Spinner />
        </Center>
      </Box>
    </Box>
  );
}
