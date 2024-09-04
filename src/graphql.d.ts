/* eslint-disable @typescript-eslint/naming-convention */

declare module "*.graphql" {
  const Query: import("graphql").DocumentNode;
  export default Query;
  export const _queries: Record<string, import("graphql").DocumentNode>;
  export const _fragments: Record<
    string,
    import("graphql").FragmentDefinitionNode
  >;
}
