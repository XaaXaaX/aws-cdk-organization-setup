import { ArnFormat, Aspects, Duration, NestedStack, NestedStackProps, Stack, StackProps, Tag } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApplyDestroyPolicyAspect, ApplyParameterStoreNamingPolicyAspect, ApplyTagsAspect } from "./aspects";
import { ContextVariablesValidator, WorkloadEnvValidator } from "./validators";
import { ContextVariables } from "../types/Context";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
export type EnforcedStackProps = StackProps & NestedStackProps & {
  contextVariables: ContextVariables;
}

export class EnforcedNestedStack extends NestedStack {
  protected readonly REGION: string;
  protected readonly ACCOUNT_ID: string;
  protected readonly ENV: string;
  protected readonly CONTEXT: string;
  protected readonly CONTEXT_VARIABLES: ContextVariables;

  constructor(scope: Construct, id: string, props: EnforcedStackProps) {
    super(scope, id, props);

    const { account: ACCOUNT_ID, region: REGION } = Stack.of(this);
    this.REGION = REGION;
    this.ACCOUNT_ID = ACCOUNT_ID;

    const { contextVariables: variables } = props;
    this.ENV = variables.stage;
    this.CONTEXT = variables.context;
    this.CONTEXT_VARIABLES = variables
  }
}
export class EnforcedStack extends Stack { 
  protected readonly REGION: string;
  protected readonly ACCOUNT_ID: string;
  protected readonly ENV: string;
  protected readonly CONTEXT: string;
  protected readonly CONTEXT_VARIABLES: ContextVariables;
  
  constructor(scope: Construct, id: string, props: EnforcedStackProps) {
    super(scope, id, props);

    const { account: ACCOUNT_ID, region: REGION } = Stack.of(this);
    this.REGION = REGION;
    this.ACCOUNT_ID = ACCOUNT_ID;

    const { contextVariables: variables } = props;
    this.ENV = variables.stage;
    this.CONTEXT = variables.context;
    this.CONTEXT_VARIABLES = variables
    
    this.node.addValidation(new ContextVariablesValidator(variables));
    this.node.addValidation(new WorkloadEnvValidator(variables));
    // Aspects.of(this).add(new AwsSolutionsChecks());

    if( variables.usage !== 'PRODUCTION' ) 
      Aspects.of(this).add(new ApplyDestroyPolicyAspect());

    if( variables.usage === 'EPHEMERAL' ) {
      
      const now = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      
      const deleteFunction = new NodejsFunction(this, 'DeleteFunction', {
        handler: 'index.handler',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.minutes(15),
        entry: join(process.cwd(), 'cdk/core/custom-resources', 'remove-stack.ts'),
        environment: {
          STACK_NAME: this.stackName,
        },
        role: new Role(this, 'DeleteFunctionRole', {
          assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
          inlinePolicies: {
            'CloudFormationPolicy': new PolicyDocument({
              statements: [
                new PolicyStatement({
                  actions: ['cloudformation:DeleteStack'],
                  resources: [
                    Stack.of(this).formatArn({
                      service: 'cloudformation',
                      resource: 'stack',
                      resourceName: `${this.stackName}/*`,
                      arnFormat: ArnFormat.SLASH_RESOURCE_NAME
                    }),
                  ]
                })
              ]
            })
          }
        })
      });
      
      new Rule(this, 'EphemeralRule', {
        schedule: Schedule.cron({
          minute: now.getMinutes().toString(),
          hour: now.getHours().toString(),
          day: now.getDate().toString(),
          month: now.getMonth().toString(),
          year:  now.getFullYear().toString(),
        }),
        targets: [ new LambdaFunction(deleteFunction)],
      });
    }

    Aspects.of(this).add(new ApplyTagsAspect({
      context: variables.context,
      stage: variables.stage,
      owner: variables.owner,
      usage: variables.usage,
    }));
    
    Aspects.of(this).add(new ApplyParameterStoreNamingPolicyAspect(variables));

  }
}