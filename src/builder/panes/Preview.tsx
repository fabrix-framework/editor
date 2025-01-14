import { Tabs, Text, Flex } from "@chakra-ui/react";
import { Alert } from "../../components/ui/alert";
import { FabrixComponent } from "@fabrix-framework/fabrix";
import {
  EditorContextProvider,
  SchemaContextProvider,
  ResponseEditor,
} from "@graphiql/react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { DocumentNode } from "graphql";
import { useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CombinedError } from "urql";
import { FabrixBuilderContext } from "../context";
import { baseFlexStyle } from "./shared";

export const PreviewPane = (props: {
  query: DocumentNode | null;
  response: Record<string, unknown> | CombinedError | undefined;
  error: Error | null;
  onError: (e: Error) => void;
}) => {
  const { query, error } = props;
  const builderContext = useContext(FabrixBuilderContext);

  const showPreview = () => {
    if (error) {
      return <Alert status="error">Error: {error.message}</Alert>;
    } else if (!query) {
      return (
        <Alert status="warning">
          <Text>Add your query in the editor first</Text>
        </Alert>
      );
    }

    return (
      <ErrorBoundary
        fallback={<div>Internal error</div>}
        onError={props.onError}
      >
        <FabrixComponent
          query={query}
          contentClassName={builderContext.classNames?.contentClassName}
          containerClassName={builderContext.classNames?.containerClassName}
        />
      </ErrorBoundary>
    );
  };

  return (
    <Tabs.Root
      css={baseFlexStyle}
      overflowY={"auto"}
      variant="plain"
      size="sm"
      fitted
      lazyMount
    >
      <Tabs.List css={{ bg: "gray.50", borderTop: "transparent" }}>
        <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        <Tabs.Trigger value="response">Response</Tabs.Trigger>
      </Tabs.List>
      <Flex
        css={{
          ...baseFlexStyle,
          overflowY: "auto",
          borderLeft: "1px solid var(--chakra-colors-chakra-border-color)",
        }}
      >
        <Tabs.Content
          value="preview"
          css={{
            ...baseFlexStyle,
            margin: 2,
            marginTop: 3,
            padding: 0,
          }}
        >
          {showPreview()}
        </Tabs.Content>
        <Tabs.Content
          value="response"
          css={{
            ...baseFlexStyle,
            padding: 2,
            paddingTop: 3,
          }}
        >
          <EditorContextProvider
            response={JSON.stringify(props.response, undefined, "  ")}
          >
            <SchemaContextProvider
              fetcher={createGraphiQLFetcher({
                url: builderContext.schemaURL,
              })}
            >
              <div
                data-testid="graphiql-container"
                className={`graphiql-container`}
              >
                <div className="graphiql-main">
                  <div className="graphiql-sessions">
                    <div
                      role="tabpanel"
                      id="graphiql-session"
                      className="graphiql-session"
                    >
                      <div className="graphiql-response">
                        <ResponseEditor />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SchemaContextProvider>
          </EditorContextProvider>
        </Tabs.Content>
      </Flex>
    </Tabs.Root>
  );
};
