import {
  Stack,
  Flex,
  Heading,
  Input,
  Button,
  Text,
  HStack,
} from "@chakra-ui/react";
import { DocumentNode, parse } from "graphql";
import { CombinedError } from "urql";
import { useContext, useState, useMemo } from "react";
import * as R from "remeda";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
} from "../components/ui/drawer";
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
  const [isOpen, setOpen] = useState(false);

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
            <Button colorScheme="blue" onClick={() => setOpen(true)} size="sm">
              Setting
            </Button>
          </Flex>
        </Stack>

        {/* Setting drawer */}
        <DrawerRoot
          open={isOpen}
          placement="end"
          onOpenChange={(e) => setOpen(e.open)}
          size="md"
        >
          <DrawerBackdrop />
          <DrawerContent>
            <DrawerHeader fontSize="lg" fontWeight="bold">
              Setting
            </DrawerHeader>
            <hr />
            <DrawerBody>
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
        </DrawerRoot>

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

  const trimComment = (query: string) => {
    return query.replace(/#.*\n/g, "").trim();
  };

  const updatePreview = useMemo(
    () =>
      R.debounce(
        (query: string) => {
          query = trimComment(query);
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
