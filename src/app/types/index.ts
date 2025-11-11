// Type definitions for the application
export type TreeNode = {
  name: string;
  key: string; // full key for files, prefix for folders
  isFolder: boolean;
  size?: number;
  lastModified?: Date;
  children?: TreeNode[];
};

export type LoginPayload = {
  client: any;
  bucket: string;
  prefix?: string;
};

export type UploadFileState = {
  folderName: string | null;
};

export type CreateFolderState = {
  folderName: string | null;
};

export type PaginationState = {
  page: number;
  currentToken?: string;
  nextToken?: string;
  prevTokens: Array<undefined | string>;
};
