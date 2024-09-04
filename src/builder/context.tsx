import { ComponentRegistry, FabrixProvider } from "@fabrix-framework/fabrix";
import { createContext, useEffect, useState } from "react";
import { GraphQLSchema } from "graphql";
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
};

const defaultContextValue: FabrixBuilderContextType = {
  componentRegistry: new ComponentRegistry({}),
  schema: null,
  schemaURL: schemaDefaultValues.url,
  setSchemaURL: () => void 0,
  setOpenAIToken: () => void 0,
} as const;
export const FabrixBuilderContext =
  createContext<FabrixBuilderContextType>(defaultContextValue);

export type FabrixBuilderProviderBaseProps = {
  componentRegistry: ComponentRegistry;
  classNames?: AppClassNames;
};

export const FabrixBuilderProvider = (
  props: React.PropsWithChildren<FabrixBuilderProviderBaseProps>,
) => {
  const [openAIToken, setOpenAIToken] = useState<string | undefined>(undefined);
  const { schema, schemaURL, setSchemaURL, fetchSchema } = useSchema();

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
      }}
    >
      <FabrixProvider
        url={schemaURL}
        serverSchema={schemaURL}
        componentRegistry={props.componentRegistry}
      >
        {props.children}
      </FabrixProvider>
    </FabrixBuilderContext.Provider>
  );
};
