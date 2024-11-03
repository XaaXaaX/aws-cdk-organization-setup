import { IValidation } from "constructs";
import { isEnvValid } from "./context";
import { AvailableEnvs, ContextVariables } from "../types/Context";

export class ContextVariablesValidator implements IValidation {
  constructor(private readonly variables: ContextVariables) {}

  public validate(): string[] {
    const errors: string[] = [];
    if(!(
      this.variables.context && 
      this.variables.stage && 
      this.variables.owner && 
      this.variables.usage

    )) {
      errors.push("Context Variables must be Set with the following keys: Context, Env, Owner, Usage.");
    }

    return errors;
  }
}


export class WorkloadEnvValidator implements IValidation {
  constructor(private readonly variables: ContextVariables) {}

  public validate(): string[] {
    const errors: string[] = [];
    if(!(isEnvValid(this.variables.stage))) {
      errors.push(`Provided Stage value is not a valid environment. Must be one of: ${JSON.stringify(AvailableEnvs)}.`);
    }

    if(
      !['dev', 'sandbox'].includes(this.variables.stage) &&
      this.variables.usage !== 'PRODUCTION'
    ){
      errors.push(`Provided Stage value is not eligible to run ephemeral or experimental stacks.`);
    }

    return errors;
  }
}
