// Browser toolbar component
import React from "react";
import { Grid, GridItem, IconButton, Button } from "@chakra-ui/react";
import { MdCreateNewFolder, MdOutlineFileUpload } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";

interface ToolbarProps {
  isLoggedIn: boolean;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  onRefreshClick: () => void;
}

export function FileBrowserToolbar({
  isLoggedIn,
  onUploadClick,
  onCreateFolderClick,
  onRefreshClick,
}: ToolbarProps) {
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Grid templateColumns="100fr 1fr 1fr" gap="1" padding={2}>
      <GridItem w="100%">
        <Button
          width="100%"
          aria-label="Click to Upload File"
          onClick={onUploadClick}
        >
          <MdOutlineFileUpload fontSize={25} />
          Click to Upload File
        </Button>
      </GridItem>
      <GridItem w="100%">
        <IconButton onClick={onCreateFolderClick} aria-label="New Folder">
          <MdCreateNewFolder />
        </IconButton>
      </GridItem>
      <GridItem w="100%">
        <IconButton onClick={onRefreshClick} aria-label="Refresh">
          <IoMdRefresh />
        </IconButton>
      </GridItem>
    </Grid>
  );
}
