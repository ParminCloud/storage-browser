// Footer component
import React from "react";
import { Center, Text, Icon, Link } from "@chakra-ui/react";
import { IoMdHeart } from "react-icons/io";
import { FaExternalLinkAlt } from "react-icons/fa";

export function PageFooter() {
  return (
    <footer
      style={{
        bottom: 0,
        width: "100%",
      }}
    >
      <Center>
        <Text
          bgColor="var(--chakra-colors-chakra-body-bg)"
          fontSize="md"
          alignContent={"center"}
          color="var(--chakra-colors-chakra-body-text)"
        >
          Made with{" "}
          <Icon color={"red"}>
            <IoMdHeart />
          </Icon>{" "}
          by{" "}
          <Link href="https://parmin.cloud">
            ParminCloud{" "}
            <Icon>
              <FaExternalLinkAlt max="2px" />
            </Icon>
          </Link>
        </Text>
      </Center>
    </footer>
  );
}
