// Tree building and rendering utilities
import { TreeNode } from "../types";
import { _Object } from "@aws-sdk/client-s3";

export function buildTree(objects: _Object[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];

  const addToNodes = (
    nodes: TreeNode[],
    parts: string[],
    fullKey: string,
    obj: _Object,
  ) => {
    if (parts.length === 0) return;

    const [head, ...rest] = parts;
    const isLast = rest.length === 0;
    const folder = isLast && fullKey.endsWith("/") ? true : !isLast;

    let node = nodes.find((n) => n.name === head && n.isFolder === folder);

    if (!node) {
      node = {
        name: head,
        key: isLast
          ? fullKey
          : nodes === rootNodes
            ? `${head}/`
            : `${nodes[0]?.key || ""}${head}/`,
        isFolder: !isLast || fullKey.endsWith("/"),
        children: [],
      };
      nodes.push(node);
    }

    if (isLast) {
      if (!node.isFolder) {
        node.size = obj.Size;
        node.lastModified = obj.LastModified
          ? new Date(obj.LastModified)
          : undefined;
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
}
