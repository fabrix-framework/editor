import {
  Stack,
  Flex,
  Heading,
  Input,
  Button,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Text,
  Divider,
  HStack,
} from "@chakra-ui/react";
import { DocumentNode, parse } from "graphql";
import { CombinedError } from "urql";
import { useContext, useState, useMemo } from "react";
import * as R from "remeda";
import FabrixIcon from "../icons/logo.svg?react";
import { FabrixBuilderContext } from "./context";
import { EditorPane } from "./panes/Editor";
import { PreviewPane } from "./panes/Preview";

export const FabrixEditor = () => {
  const builderContext = useContext(FabrixBuilderContext);
  const { updatePreview, editorQuery, parsedQuery, setError, error } =
    useEditor();
  const [response, setResponse] = useState<
    Record<string, unknown> | CombinedError | undefined
  >();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex height="100vh" width="100%">
      <Stack width={"100%"} gap={0}>
        {/* Header */}
        <Stack
          paddingX={0}
          paddingY={2}
          backgroundColor={"gray.50"}
          borderBottom="1px solid var(--chakra-colors-chakra-border-color)"
        >
          <Flex justifyContent={"space-between"} paddingX={3}>
            <HStack>
              <FabrixIcon />
              <HStack gap={1}>
                <Heading as="h1" size="lg">
                  fabrix
                </Heading>
                <Text fontSize="lg" fontWeight={200} paddingTop={"7px"}>
                  Editor
                </Text>
              </HStack>
            </HStack>
            <Button colorScheme="blue" onClick={onOpen} size="sm">
              Setting
            </Button>
          </Flex>
        </Stack>

        {/* Setting drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Setting</DrawerHeader>
            <DrawerBody>
              <Divider />
              <Stack paddingY={7}>
                <Heading size="sm">Open AI token</Heading>
                <Text>
                  Fabrix editor supports AI completion with OpenAI. Set your
                  token here to enable it.
                </Text>
                <Input
                  placeholder="Your token here..."
                  value={builderContext.openAIToken}
                  onChange={(e) => {
                    builderContext.setOpenAIToken(e.target.value);
                  }}
                />
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Content */}
        <Flex height={"100%"} overflowY="auto">
          <Stack width={"50%"} paddingLeft={0}>
            <EditorPane
              query={editorQuery}
              updatePreview={updatePreview}
              setResponse={setResponse}
            />
          </Stack>
          <Stack width={"50%"} overflowY="auto">
            <PreviewPane
              query={parsedQuery}
              error={error}
              onError={setError}
              response={response}
            />
          </Stack>
        </Flex>
      </Stack>
    </Flex>
  );
};

const useEditor = () => {
  const [error, setError] = useState<Error | null>(null);
  const [editorQuery, setEditorQuery] = useState("");
  const [parsedQuery, setParsedQuery] = useState<DocumentNode | null>(null);

  const updatePreview = useMemo(
    () =>
      R.debounce(
        (query: string) => {
          setEditorQuery(query);

          try {
            if (query === "") {
              setError(null);
              setParsedQuery(null);
              return;
            }

            const parsedQuery = parse(query);
            setError(null);
            setParsedQuery(parsedQuery);
          } catch (e) {
            if (e instanceof Error) {
              setError(e);
            }
          }
        },
        {
          waitMs: 500,
        },
      ),
    [],
  );

  return {
    updatePreview: (query: string) => updatePreview.call(query),
    editorQuery,
    parsedQuery,
    setError,
    error,
  };
};
