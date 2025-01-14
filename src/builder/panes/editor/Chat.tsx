import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useMemo,
} from "react";
import { Box, Input, Button, VStack, Text, Code, Flex } from "@chakra-ui/react";
import OpenAI from "openai";
import { GraphQLSchema, printSchema } from "graphql";
import ReactMarkdown from "react-markdown";
import {
  GraphiQLPlugin,
  useOperationsEditorState,
  useOptimisticState,
} from "@graphiql/react";
import { FabrixBuilderContext } from "../../context";
import ChatgptIcon from "../../../icons/chatgpt.svg?react";

type Message = {
  role: "user" | "system" | "assistant";
  content: string;
};

type ChatContextType = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

const createSchemaPrompt = (schema: GraphQLSchema | null) => {
  return `
You are a helpful assistant that can answer questions about the following GraphQL schema:
\`\`\`graphql
${schema ? printSchema(schema) : ""}
\`\`\`
`;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatProviderProps = React.PropsWithChildren<{
  schema: GraphQLSchema | null;
}>;
export const ChatProvider = (props: ChatProviderProps) => {
  const initialMessages: Message[] = useMemo(
    () => [{ role: "system", content: createSchemaPrompt(props.schema) }],
    [props.schema],
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [props.schema, initialMessages]);

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {props.children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const Chat = (props: { updateQuery: (value: string) => void }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, setMessages } = useChat();
  const builderContext = useContext(FabrixBuilderContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openai = useMemo(() => {
    return new OpenAI({
      apiKey: builderContext.openAIToken,
      dangerouslyAllowBrowser: true,
    });
  }, [builderContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userMessage: Message[] = [
      { role: "user", content: input },
      { role: "assistant", content: "" }, // to make sure the assistant message is always the last one
    ];
    setMessages((prev) => [...prev, ...userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...messages,
          ...userMessage,
        ] as OpenAI.Chat.ChatCompletionMessage[],
        stream: true,
      });

      let assistantMessage = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantMessage += content;
        setMessages((prev) => [
          // remove the last assistant message to avoid duplication of the assistant message
          ...prev.slice(0, -1),
          { role: "assistant", content: assistantMessage },
        ]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <VStack gap={4} align="stretch">
        {messages.map(
          (message, index) =>
            (message.role === "user" || message.role === "assistant") && (
              <Box
                key={index}
                bg={message.role === "user" ? "gray.100" : "white"}
                p={2}
                borderRadius="md"
              >
                <Text fontWeight="bold">
                  {message.role === "user" ? "You" : "Assistant"}:
                </Text>
                <ReactMarkdown
                  components={{
                    code: (codeProps) => {
                      const { children, className, node, ...rest } = codeProps;
                      const match = /language-(\w+)/.exec(className || "");
                      const language = match ? match[1] : "";
                      return match ? (
                        <Box w={"100%"}>
                          <Flex
                            justify={"space-between"}
                            alignItems={"center"}
                            px={4}
                            py={2}
                            bg={"gray.300"}
                            borderTopRadius={"sm"}
                          >
                            <Text>{language}</Text>
                            <Button
                              size="sm"
                              onClick={() =>
                                props.updateQuery(
                                  codeProps.children?.toString() ?? "",
                                )
                              }
                            >
                              Use
                            </Button>
                          </Flex>
                          <Code
                            {...codeProps}
                            onClick={() =>
                              props.updateQuery(
                                codeProps.children?.toString() ?? "",
                              )
                            }
                            w={"100%"}
                            p={4}
                            borderTopRadius={0}
                            borderBottomRadius={"sm"}
                          >
                            {String(children).replace(/\n$/, "")}
                          </Code>
                        </Box>
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </Box>
            ),
        )}
        <div ref={messagesEndRef} />
      </VStack>
      <form onSubmit={handleSubmit}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message..."
        />
        <Button
          type="submit"
          mt={2}
          // @ts-expect-error
          loading={isLoading}
        >
          Send
        </Button>
      </form>
    </Box>
  );
};

export const openAIChat: GraphiQLPlugin = {
  title: "OpenAI plugin",
  icon: () => <ChatgptIcon />,
  content: () => {
    const [, updateQuery] = useOptimisticState(useOperationsEditorState());

    return <Chat updateQuery={updateQuery} />;
  },
};
