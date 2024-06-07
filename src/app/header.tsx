import React, { useState } from "react";
import {
  Box,
  Stack,
  Heading,
  Flex,
  Button,
  useDisclosure,
  useColorMode,
  IconButton,
  Icon
} from "@chakra-ui/react";
import { HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import LoginModal from "./loginModal";
import { S3Client } from "@aws-sdk/client-s3";
import { MdStorage } from "react-icons/md";

const Header = ({
  onLogin,
  user
}: {
  onLogin: ({ client, bucket }: { client: S3Client; bucket: string }) => void;
  user: S3Client | null;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose
  } = useDisclosure();
  const handleToggle = () => (isOpen ? onClose() : onOpen());
  const { colorMode, toggleColorMode } = useColorMode();
  const onLoginFormOpen = () => {
    setLoading(true);
    onModalOpen();
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
        <HamburgerIcon />
      </Box>
      <Stack
        direction={{ base: "column", md: "row" }}
        display={{ base: isOpen ? "block" : "none", md: "flex" }}
        width={{ base: "full", md: "auto" }}
        mt={{ base: 4, md: 0 }}
      >
        <Button
          disabled={user !== null}
          isLoading={loading}
          onClick={onLoginFormOpen}
        >
          {user ? "Logged in" : "Login"}
        </Button>
        <IconButton
          onClick={toggleColorMode}
          variant={"ghost"}
          aria-label="Color Mode"
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        />
        <LoginModal
          onLogin={onLogin}
          isOpen={isModalOpen}
          onOpen={onLoginFormOpen}
          onClose={() => {
            onModalClose();
            setTimeout(() => setLoading(false), 1500);
          }}
        />
      </Stack>
    </Flex>
  );
};

export default Header;
