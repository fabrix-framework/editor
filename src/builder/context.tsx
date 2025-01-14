import { ComponentRegistry, FabrixProvider } from "@fabrix-framework/fabrix";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { GraphQLSchema } from "graphql";
import { authExchange } from "@urql/exchange-auth";
import { schemaDefaultValues, useSchema } from "../hooks/useSchema";

type AppClassNames = {
  containerClassName?: string;
  contentClassName?: string;
};

type FabrixBuilderContextType = {
  componentRegistry: ComponentRegistry;
  classNames?: AppClassNames;
  schemaURL: string;
  setSchemaURL: (url: string) => void;
  schema: GraphQLSchema | null;
  openAIToken?: string;
  setOpenAIToken: (token: string) => void;
  setAdditionalHeader: Dispatch<SetStateAction<Record<string, string>>>;
};

const defaultContextValue: FabrixBuilderContextType = {
  componentRegistry: new ComponentRegistry({}),
  schema: null,
  schemaURL: schemaDefaultValues.url,
  setSchemaURL: () => void 0,
  setOpenAIToken: () => void 0,
  setAdditionalHeader: () => void 0,
} as const;
export const FabrixBuilderContext =
  createContext<FabrixBuilderContextType>(defaultContextValue);

export type FabrixBuilderProviderBaseProps = {
  componentRegistry: ComponentRegistry;
  classNames?: AppClassNames;
};

const additionalHeaderExchange = (additionalHeader: Record<string, string>) =>
  authExchange((utils) =>
    Promise.resolve({
      addAuthToOperation: (operation) => {
        return utils.appendHeaders(operation, additionalHeader);
      },
      didAuthError: () => false,
      refreshAuth: () => Promise.resolve(),
    }),
  );

export const FabrixBuilderProvider = (
  props: React.PropsWithChildren<FabrixBuilderProviderBaseProps>,
) => {
  const [openAIToken, setOpenAIToken] = useState<string | undefined>(undefined);
  const { schema, schemaURL, setSchemaURL, fetchSchema } = useSchema();
  const [additionalHeader, setAdditionalHeader] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return (
    <FabrixBuilderContext.Provider
      value={{
        schemaURL,
        setSchemaURL,
        schema,
        componentRegistry: props.componentRegistry,
        classNames: props.classNames,
        openAIToken,
        setOpenAIToken,
        setAdditionalHeader,
      }}
    >
      <FabrixProvider
        url={schemaURL}
        componentRegistry={props.componentRegistry}
        prependExchanges={[additionalHeaderExchange(additionalHeader)]}
      >
        {props.children}
      </FabrixProvider>
    </FabrixBuilderContext.Provider>
  );
};
