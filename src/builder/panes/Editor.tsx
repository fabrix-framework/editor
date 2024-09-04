import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  InputGroup,
  InputLeftAddon,
  Input,
} from "@chakra-ui/react";
import { useFabrixClient } from "@fabrix-framework/fabrix";
import { FetcherParams, createGraphiQLFetcher } from "@graphiql/toolkit";
import GraphiQL from "graphiql";
import {
  parse,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  print,
} from "graphql";
import { useContext } from "react";
import { AnyVariables, CombinedError } from "urql";
import { explorerPlugin } from "@graphiql/plugin-explorer";
import { FabrixBuilderContext } from "../context";
import { baseFlexStyle } from "./shared";
import { ChatProvider, openAIChat } from "./editor/Chat";

type EditorPaneProps = {
  query: string;
  updatePreview: (query: string) => void;
  setResponse: (
    value: Record<string, unknown> | CombinedError | undefined,
  ) => void;
};

const explorer = explorerPlugin();

export const EditorPane = (props: EditorPaneProps) => {
  const builderContext = useContext(FabrixBuilderContext);
  const client = useFabrixClient();

  // Graphiqlから実行するfetchの実装
  const httpFetch: typeof fetch = async (_, init) => {
    const params = await new Response(init?.body).text();
    const body = JSON.parse(params) as FetcherParams;

    const variables = body.variables as AnyVariables;
    const operation = parse(body.query);

    // 実行対象のOperationを取得
    const targetDef = operation.definitions.find((d) => {
      if (d.kind === Kind.OPERATION_DEFINITION) {
        return d.name?.value === body.operationName;
      }
    }) as OperationDefinitionNode;

    const runOperation = async () => {
      switch (targetDef.operation) {
        case OperationTypeNode.MUTATION:
          return await client.mutation<Record<string, unknown>>(
            body.query,
            variables,
          );
        case OperationTypeNode.QUERY:
          return await client
            .query<undefined>(print(targetDef), variables)
            .toPromise();
        default:
          // subscriptionは未対応operationとする
          throw new Error("unsupported operation");
      }
    };

    const res = await runOperation();
    props.setResponse(res.data ?? res.error);

    return {
      // httpFetchの呼び出し元でResponse.json関数を呼び出しているため適当なResponseをreturnする
      // 実際のResponseはprops.setResponseで設定している
      json: () => ({
        message: "see the response in the json tab",
      }),
    } as unknown as Response;
  };

  const fetcher = createGraphiQLFetcher({
    url: builderContext.schemaURL,
    fetch: httpFetch,
  });

  const onEditQuery = (query: string) => {
    // onEditQueryは初回レンダリング時に実行されるがupdatePreviewのsetParsedQueryの引数がオブジェクトのため値の不一致により再レンダリングから無限ループが発生する。
    // その抑制としてqueryの文字列が変更された時のみ実行するようにしている。
    if (props.query === query) {
      return;
    }
    props.updatePreview(query);
  };

  const hasOpenAIToken =
    builderContext.openAIToken && builderContext.openAIToken.length > 0;

  return (
    <Tabs sx={baseFlexStyle} variant="enclosed-colored" size="sm" isLazy>
      <TabList sx={{ bg: "gray.50", borderTop: "transparent" }}>
        <Tab>Editor</Tab>
      </TabList>
      <TabPanels
        sx={{
          ...baseFlexStyle,
          height: "calc(100% - 40px)",
        }}
      >
        <TabPanel
          sx={{
            ...baseFlexStyle,
            margin: 2,
            marginTop: 3,
            padding: 0,
          }}
        >
          <ChatProvider schema={builderContext.schema}>
            <VStack flexGrow={1} height={"100%"}>
              <InputGroup size="sm">
                <InputLeftAddon>Schema</InputLeftAddon>
                <Input
                  value={builderContext.schemaURL}
                  onChange={(e) => {
                    builderContext.setSchemaURL(e.target.value);
                    props.updatePreview(props.query);
                  }}
                />
              </InputGroup>
              <GraphiQL
                fetcher={fetcher}
                disableTabs={true}
                onEditQuery={onEditQuery}
                plugins={[explorer, ...(hasOpenAIToken ? [openAIChat] : [])]}
                defaultQuery={props.query}
                schema={builderContext.schema}
                defaultTheme={"light"}
              />
            </VStack>
          </ChatProvider>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
