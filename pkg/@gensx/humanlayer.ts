/**
 * psuedo-outline for a @gensx/humanlayer package, this needs packaging etc,
 * but outlines a similar approach to how humanlayer shipped
 * 
 * https://github.com/humanlayer/humanlayer/tree/main/humanlayer-ts-vercel-ai-sdk
 * 
 * specifically 
 * 
 * https://github.com/humanlayer/humanlayer/blob/main/humanlayer-ts-vercel-ai-sdk/src/approval.ts#L19
 * 
 * Simple sync/polling implementation - more advanced webhook-based implementation in humanlayer-webhook-state.ts
 */
import { HumanLayer, HumanLayerParams, ContactChannel, FunctionCall } from "humanlayer";
import { GSXTool, GSXToolAnySchema } from "@gensx/openai";
import { z } from "zod";

class GenSXHumanLayer {
  humanLayer: HumanLayer;
  constructor(options: HumanLayerParams) {
    this.humanLayer = new HumanLayer(options);
  }
  requireApproval<TSchema extends GSXToolAnySchema>(fn: GSXTool<TSchema>): GSXTool<TSchema> {
    return new GSXTool<TSchema>({
      name: fn.name,
      description: fn.description,
      schema: fn.schema,
      run: fn.run,
    });
  }
  humanAsTool(contactChannel?: ContactChannel) {
    return new GSXTool({
      name: "contact_human",
      description: "contact a human for more information",
      schema: z.object({
        message: z.string(),
      }),
      run: async ({message}) => {
        return this.humanLayer.humanAsTool(contactChannel)({message});
      },
    });
  }
}
const humanlayer = (options: HumanLayerParams) => {
  return new GenSXHumanLayer(options);
}

export {
  humanlayer,
  GenSXHumanLayer as HumanLayer,
}