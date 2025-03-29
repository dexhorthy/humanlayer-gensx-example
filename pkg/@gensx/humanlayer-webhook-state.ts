/**
 * sketch of an async implementation with state / webhooks. Also psuedo-code
 * 
 * If GenSX were to ever support an "Interrupt()" execption-style control flow, 
 * we could follow steps similar to https://www.humanlayer.dev/docs/core/response-webhooks#overview
 * to freeze/resume state between tool selection and tool execution
 */
import { HumanLayer, HumanLayerParams, ContactChannel, FunctionCall } from "humanlayer";
import { GSXTool, GSXToolAnySchema } from "@gensx/openai";
import { z } from "zod";

class GenSXHumanLayer {
  humanLayer: HumanLayer;
  constructor(options: HumanLayerParams) {
    this.humanLayer = new HumanLayer(options);
  }

  /**
   * if GenSX were to ever support an "Interrupt()" execption-style control flow, 
   * this could be extended to 
   */
  requireApproval<TSchema extends GSXToolAnySchema>(fn: GSXTool<TSchema>): GSXTool<TSchema> {
    return new GSXTool<TSchema>({
      name: fn.name,
      description: fn.description,
      schema: fn.schema,
      run: async (args) => {
        const stateId = await this.__checkpointState();
        await this.humanLayer.createFunctionCall({
          spec:{
            fn: fn.name,
            kwargs: args,
            state: {
              stateId,
            },
          },
        });
        
        // resume later on webhook
        throw new Error("interrupt"); 
      },
    });
  }

  /**
   *  store the current execution state somehow,
   *  e.g. stash the context window in redis
   */
  async __checkpointState(): Promise<string> {
    return "fake-state-id";
  }

  /**
   * When a human responsds, go get our stored state
   * so we can resume execution
   */
  async __getFromState(stateId: string): Promise<any> {
    return {
      contextWindow: [
        {
          role: "system",
          content: "...",
        },
        {
          role: "user",
          content: "...",
        },
        {
          role: "assistant",
          tool_calls: [
            {
              id: "1",
              type: "function",
              function: { name: "function_name" },
            },
          ],
        },
      ],
    }
  }

  /**
   * resume with a completed function call (either approved or rejected)
   */
  async __resume(functionCall: FunctionCall): Promise<any> {
    const stateId = functionCall.spec.state?.stateId;
    if (stateId) {
      // resume from state
      const contextWindow = await this.__getFromState(stateId);
      if (functionCall.status?.approved) {
        // execute the function call
        // append to contextWindow
        // continue executing
      } else {
        // add the user's feedback to the contextWindow as the tool response
        // continue executing
      }
    } else {
      // error cant find stored state
    }
  }
}
const humanlayer = (options: HumanLayerParams) => {
  return new GenSXHumanLayer(options);
}

export {
  humanlayer,
  GenSXHumanLayer as HumanLayer,
}