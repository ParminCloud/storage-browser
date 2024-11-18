import React, { useState } from "react";
import {
  Box,
  Stack,
  Heading,
  Flex,
  useDisclosure,
  IconButton,
  Icon
} from "@chakra-ui/react";
import { IoMoon, IoSunnyOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import LoginDialog from "./loginDialog";
import { S3Client } from "@aws-sdk/client-s3";
import { MdStorage } from "react-icons/md";
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
const Header = ({
  onLogin,
  user
}: {
  onLogin: ({ client, bucket }: { client: S3Client; bucket: string }) => void;
  user: S3Client | null;
}) => {
  const { open, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const {
    open: isDialogOpen,
    onOpen: onDialogOpen,
    onClose: onDialogClose
  } = useDisclosure();
  const handleToggle = () => (open ? onClose() : onOpen());
  const { theme, setTheme } = useTheme();
  const onLoginFormOpen = () => {
    setLoading(true);
    onDialogOpen();
  };
  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={6}
    >
      <Flex align="center" mr={5}>
        <Heading as="h1" size="lg" letterSpacing={"tighter"}>
          <Icon as={MdStorage} /> Storage Browser
        </Heading>
      </Flex>

      <Box display={{ base: "block", md: "none" }} onClick={handleToggle}>
        <RxHamburgerMenu />
      </Box>
      <Stack
        direction={{ base: "column", md: "row" }}
        display={{ base: open ? "block" : "none", md: "flex" }}
        width={{ base: "full", md: "auto" }}
        mt={{ base: 4, md: 0 }}
      >
        <Button
          disabled={user !== null}
          loading={loading}
          onClick={onLoginFormOpen}
        >
          {user ? "Logged in" : "Login"}
        </Button>
        <IconButton
          onClick={() => setTheme(theme === "light" ? "light" : "dark")}
          variant={"ghost"}
          aria-label="Color Mode"
        >{theme === "light" ? <IoMoon /> : <IoSunnyOutline />}</IconButton>
        <LoginDialog
          onLogin={onLogin}
          open={isDialogOpen}
          onOpen={onLoginFormOpen}
          onClose={() => {
            onDialogClose();
            setTimeout(() => setLoading(false), 1500);
          }}
        />
      </Stack>
    </Flex>
  );
};

export default Header;
