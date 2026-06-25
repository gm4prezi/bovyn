import { ChatInterface } from "../components/ai/ChatInterface";
import { useApp } from "../context/AppContext";

export function AIScreen() {
  const { tier, aiQueriesUsed, incrementAiQueries } = useApp();
  return (
    <ChatInterface
      tier={tier}
      queriesUsed={aiQueriesUsed}
      onQuery={incrementAiQueries}
    />
  );
}
