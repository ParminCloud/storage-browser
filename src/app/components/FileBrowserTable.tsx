// File browser table component
import React from "react";
import { Table, Center } from "@chakra-ui/react";
import {
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import { buildTree } from "../lib/tree-builder";
import { renderTableNode } from "../lib/table-renderer";
import { _Object } from "@aws-sdk/client-s3";
import { TreeNode } from "../types";
import { Endpoint } from "@smithy/types";

interface FileBrowserTableProps {
  objectList: _Object[];
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (key: string) => void;
  bucket: string;
  client: any;
  endpoint: Endpoint | null;
  onDeleteClick: (key: string) => void;
  page: number;
  onPageChange: (newPage: number, token?: string) => void;
}

export function FileBrowserTable({
  objectList,
  expandedFolders,
  onToggleFolder,
  bucket,
  client,
  endpoint,
  onDeleteClick,
  page,
  onPageChange,
}: FileBrowserTableProps) {
  return (
    <Table.ScrollArea marginBottom={10}>
      <Table.Root>
        <Table.Header>
          <Table.Row backgroundColor={"custom-teal-bg-color"}>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Last Modified</Table.ColumnHeader>
            <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
            <Table.ColumnHeader>Size</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(() => {
            const tree = buildTree(objectList);
            return tree.map((node: TreeNode) => (
              <React.Fragment key={node.key}>
                {renderTableNode(node, 0, {
                  node,
                  depth: 0,
                  expandedFolders,
                  onToggleFolder,
                  bucket,
                  client,
                  endpoint,
                  onDeleteClick,
                })}
              </React.Fragment>
            ));
          })()}
        </Table.Body>
        <Table.Footer>
          <Table.Row backgroundColor={"custom-teal-bg-color"}>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Last Modified</Table.ColumnHeader>
            <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
            <Table.ColumnHeader>Size</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
      <Center paddingTop="1%">
        <PaginationRoot
          page={page}
          count={Infinity}
          onPageChange={(e) => {
            onPageChange(e.page);
          }}
          pageSize={15}
        >
          <PaginationPrevTrigger />
          <PaginationNextTrigger />
        </PaginationRoot>
      </Center>
    </Table.ScrollArea>
  );
}
