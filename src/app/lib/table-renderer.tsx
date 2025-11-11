// Table row rendering components
import React from "react";
import { TreeNode } from "../types";
import { Box, Stack, IconButton, FormatByte } from "@chakra-ui/react";
import { FaArrowDown, FaArrowRight } from "react-icons/fa";
import { LuFolderClosed, LuFolderOpen } from "react-icons/lu";
import moment from "moment";
import { Table } from "@chakra-ui/react";
import { downloadObject, generatePresignedUrl } from "./s3-operations";
import { ClipboardIconButton, ClipboardRoot } from "@/components/ui/clipboard";
import { IoMdCloudDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaFileSignature } from "react-icons/fa";
import { toaster } from "@/components/ui/toaster";
import { Endpoint } from "@smithy/types";

export interface TableRowRendererProps {
  node: TreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (key: string) => void;
  bucket: string;
  client: any;
  endpoint: Endpoint | null;
  onDeleteClick: (key: string) => void;
}

function FolderRow({
  node,
  depth,
  expandedFolders,
  onToggleFolder,
}: {
  node: TreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (key: string) => void;
}) {
  const paddingLeft = `${depth * 20}px`;
  const isOpen = !!expandedFolders[node.key];

  return (
    <Table.Row backgroundColor={"custom-teal-bg-color"}>
      <Table.Cell>
        <Box
          onClick={() => onToggleFolder(node.key)}
          cursor="pointer"
          pl={paddingLeft}
        >
          <span style={{ display: "flex" }}>
            {isOpen ? <FaArrowDown /> : <FaArrowRight />}&nbsp;&nbsp;
            {node.name}
          </span>
        </Box>
      </Table.Cell>
      <Table.Cell></Table.Cell>
      <Table.Cell></Table.Cell>
      <Table.Cell></Table.Cell>
      <Table.Cell>
        <Stack
          direction={{ base: "column", md: "row" }}
          width={{ base: "full", md: "auto" }}
          mt={{ base: 4, md: 0 }}
        >
          <IconButton
            size="sm"
            onClick={() => {
              onToggleFolder(node.key);
            }}
          >
            {isOpen ? <LuFolderOpen /> : <LuFolderClosed />}
          </IconButton>
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
}

function FileRow({
  node,
  depth,
  bucket,
  client,
  endpoint,
  onDeleteClick,
}: {
  node: TreeNode;
  depth: number;
  bucket: string;
  client: any;
  endpoint: Endpoint | null;
  onDeleteClick: (key: string) => void;
}) {
  const paddingLeft = `${depth * 20}px`;

  const handleDownload = () => {
    downloadObject(client, bucket, node.key);
  };

  const handlePresignedUrl = async () => {
    const url = await generatePresignedUrl(client, bucket, node.key);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        toaster.create({
          title: "Presigned URL Copied",
          description: "The presigned URL has been copied to clipboard",
          type: "success",
          duration: 3000,
        });
      });
    }
  };

  const publicUrl =
    endpoint?.protocol +
    "//" +
    bucket +
    "." +
    endpoint?.hostname +
    "/" +
    node.key;

  return (
    <Table.Row backgroundColor={"custom-teal-bg-color"}>
      <Table.Cell style={{ paddingLeft }}>{node.name}</Table.Cell>
      <Table.Cell>
        {node.lastModified ? moment(node.lastModified).fromNow() : ""}
      </Table.Cell>
      <Table.Cell>{node.lastModified?.toString() || ""}</Table.Cell>
      <Table.Cell>
        <FormatByte value={node.size || 0} />
      </Table.Cell>
      <Table.Cell>
        <Stack
          direction={{ base: "column", md: "row" }}
          width={{ base: "full", md: "auto" }}
          mt={{ base: 4, md: 0 }}
        >
          <IconButton onClick={handleDownload} aria-label="Download Object">
            <IoMdCloudDownload />
          </IconButton>

          <IconButton
            aria-label="Remove Object"
            onClick={() => onDeleteClick(node.key)}
          >
            <MdDelete />
          </IconButton>

          <ClipboardRoot value={publicUrl} timeout={1000}>
            <ClipboardIconButton size="md" variant="solid" />
          </ClipboardRoot>

          <IconButton size="md" variant="solid" onClick={handlePresignedUrl}>
            <FaFileSignature />
          </IconButton>
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
}

export function renderTableNode(
  node: TreeNode,
  depth: number,
  props: TableRowRendererProps,
): React.ReactNode {
  if (node.isFolder) {
    const isOpen = !!props.expandedFolders[node.key];
    const rows: React.ReactNode[] = [];

    rows.push(
      <FolderRow
        key={node.key}
        node={node}
        depth={depth}
        expandedFolders={props.expandedFolders}
        onToggleFolder={props.onToggleFolder}
      />,
    );

    if (isOpen && node.children) {
      node.children.forEach((child) => {
        const childRendered = renderTableNode(child, depth + 1, props);
        if (Array.isArray(childRendered)) {
          rows.push(...childRendered);
        } else if (childRendered) {
          rows.push(childRendered);
        }
      });
    }

    return rows;
  }

  return (
    <FileRow
      key={node.key}
      node={node}
      depth={depth}
      bucket={props.bucket}
      client={props.client}
      endpoint={props.endpoint}
      onDeleteClick={props.onDeleteClick}
    />
  );
}
