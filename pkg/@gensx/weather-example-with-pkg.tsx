/**
 * example of the weather example using the @gensx/humanlayer package
 * instead of the vanilla humanlayer
 */
import * as gensx from "@gensx/core";
import { z } from "zod";
import { ChatCompletion, OpenAIProvider, GSXTool } from "@gensx/openai";
import { humanlayer } from "./humanlayer";


interface RespondProps {
  userInput: string;
}
type RespondOutput = string;

const hl = humanlayer({verbose: true});

type Weather = {
  temperature: number;
  conditions: string;
}

const weathers: Record<string, Weather> = {
  London: {
    temperature: 20,
    conditions: "Sunny",
  },
  Paris: {
    temperature: 15,
    conditions: "Cloudy",
  },
  SanFrancisco: {
    temperature: 10,
    conditions: "Rainy",
  },
};


const fetchWeatherTool = new GSXTool({
  name: "fetchWeather",
  description: "Fetch the weather for a given city",
  schema: z.object({
    city: z.string(),
  }),
  run: async ({ city }: { city: string }) => weathers[city] || { temperature: 15, conditions: "unknown" },
});

const changeWeatherTool = new GSXTool({
  name: "changeWeather",
  description: "Change the weather for a given city",
  schema: z.object({
    city: z.string(),
    weather: z.object({ 
      temperature: z.number(),
      conditions: z.string(),
    }),
  }),
  run: async ({ city, weather }: { city: string, weather: Weather }) => {
    console.log("changing weather for", city, weather);
    weathers[city] = weather;
    return weathers[city];
  },
});

const Respond = gensx.Component<RespondProps, RespondOutput>(
  "Respond",
  ({ userInput }) => (
    <ChatCompletion
      model="gpt-4o"
      messages={[
        {
          role: "system",
          content: "You are a helpful assistant. Respond to the user's input.",
        },
        { role: "user", content: userInput },
      ]}
      tools={[
        fetchWeatherTool, 
        // much cleaner humanlayer implementation here,
        // can wrap the GenSX tool instead of the inner execute function
        hl.requireApproval(changeWeatherTool)
      ]}
    />
  ),
);

const WorkflowComponent = gensx.Component<{ userInput: string }, string>(
  "Workflow",
  ({ userInput }) => (
    <OpenAIProvider apiKey={process.env.OPENAI_API_KEY}>
      <Respond userInput={userInput} />
    </OpenAIProvider>
  ),
);

const workflow = gensx.Workflow("MyGSXWorkflow", WorkflowComponent);

const result = await workflow.run(
  {
    userInput: "What is the weather in Paris? Make it warm and sunny please",
  },
  { printUrl: true },
);

console.log(result);
