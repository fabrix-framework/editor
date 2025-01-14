import {
  GraphQLSchema,
  IntrospectionQuery,
  buildClientSchema,
  getIntrospectionQuery,
} from "graphql";
import { mergeSchemas } from "@graphql-tools/schema";
import { buildASTSchema } from "graphql";
import { schemaDefinition } from "@fabrix-framework/graphql-config/schema";
import { useCallback, useMemo, useState } from "react";
import * as R from "remeda";

const fetchSchema = async (schemaURL: string) => {
  try {
    const res = await fetch(schemaURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "IntrospectionQuery",
        query: getIntrospectionQuery(),
      }),
    });

    const resJson = (await res.json()) as { data: IntrospectionQuery };

    return {
      status: "success",
      url: schemaURL,
      schema: mergeSchemas({
        schemas: [
          buildClientSchema(resJson.data),
          buildASTSchema(schemaDefinition),
        ],
      }),
    } as const;
  } catch (error) {
    const e =
      error instanceof Error
        ? error
        : new Error("unknown error in fetching schema");
    return { status: "failed", url: schemaURL, error: e } as const;
  }
};

type SchemaStatus =
  | {
      status: "ready";
    }
  | {
      status: "success";
      url: string;
      schema: GraphQLSchema;
    }
  | {
      status: "failed";
      url: string;
      error: Error;
    };

const shouldRefetch = (schema: SchemaStatus, currentURL: string) =>
  (schema.status === "failed" && schema.url !== currentURL) ||
  (schema.status === "success" && schema.url !== currentURL);

export const schemaDefaultValues = {
  url: import.meta.env.VITE_GRAPHQL_ENDPOINT_URL,
  schema: {
    status: "ready",
  },
} as const;

export const useSchema = () => {
  const [url, setURL] = useState<string>(schemaDefaultValues.url);
  const [schema, setSchema] = useState<SchemaStatus>(
    schemaDefaultValues.schema,
  );

  const debouncedFetchSchema = useMemo(
    () =>
      R.debounce(
        async (url: string) => {
          setSchema(await fetchSchema(url));
        },
        { waitMs: 500 },
      ),
    [],
  );

  const internalFetchSchema = useCallback(async () => {
    if (schema.status === "ready") {
      setSchema(await fetchSchema(url));
      return;
    }

    if (shouldRefetch(schema, url)) {
      await debouncedFetchSchema.call(url);
    }
  }, [debouncedFetchSchema, schema, url]);

  return {
    schemaURL: url,
    setSchemaURL: (value: string) => setURL(value),
    schema: schema.status === "success" ? schema.schema : null,
    fetchSchema: () => {
      internalFetchSchema().catch((e) => {
        throw e;
      });
    },
  };
};
