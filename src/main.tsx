import ReactDOM from "react-dom/client";
import { css } from "@emotion/css";
import { ChakraUIRegistry } from "@fabrix-framework/chakra-ui";
import { Provider as ChakraProvider } from "./components/ui/provider.tsx";
import App from "./App.tsx";
import "./index.css";
import { FabrixBuilderProvider } from "./builder/context.tsx";

const root = document.getElementById("root");
export const appClassName = {
  containerClassName: css`
    display: flex;
    justify-content: center;
    padding: 0 15px 15px;
  `,
  contentClassName: css`
    width: 100%;
    max-width: 1200px;
    padding: 15px;
    border: 1px solid lightgray;
  `,
} as const;

if (root) {
  ReactDOM.createRoot(root).render(
    <ChakraProvider>
      <FabrixBuilderProvider
        componentRegistry={ChakraUIRegistry}
        classNames={appClassName}
      >
        <App />
      </FabrixBuilderProvider>
    </ChakraProvider>,
  );
}
