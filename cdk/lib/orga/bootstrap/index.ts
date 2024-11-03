import { EnforcedStackProps } from "@helpers";
import { CfnStackSet, Stack } from "aws-cdk-lib";
import { CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";
import { readFileSync } from 'fs';
import { join } from "path";

type ParamsType = Record<string, string>;

export enum BootstrapTypes {
  GitHub = 'oidc-github.yml',
  CDK = 'cdk-bootstrap-template.yml',
}
export type BootstrapProps = EnforcedStackProps & {
  organizationUnits: CfnOrganizationalUnit[];
  regions: string[];
  types: { [key in BootstrapTypes]: ParamsType };
}
export class Bootstrap extends Construct {
  constructor(scope: Construct, id: string, props: BootstrapProps) {
    super(scope, id);

    const { contextVariables: { stage: ENV, context: CONTEXT }, types: TYPES } = props;
    const tags =  Stack.of(this).tags.renderTags();
    Object.keys(TYPES).forEach((value: string, index: number) => {
      const cfnParams = Object.entries(TYPES[value as unknown as BootstrapTypes])
        .map(([key, value]) => (
          { parameterKey: key, parameterValue: value } as CfnStackSet.ParameterProperty
        )); 

      const typeIdentifier = value.replace('.yml', '').replace(/[^a-zA-Z]/g, '');
      new CfnStackSet(this, `BootstrapStackSet${typeIdentifier}`, {
        permissionModel: "SERVICE_MANAGED",
        stackSetName: `${CONTEXT}-bootstrap-${typeIdentifier}-${ENV}`,
        description: `Account bootstrap StackSet ${typeIdentifier}`,
        autoDeployment: { enabled: true, retainStacksOnAccountRemoval: false },
        capabilities: ["CAPABILITY_NAMED_IAM"],
        templateBody: readFileSync(join(process.cwd(), `/cdk/lib/orga/bootstrap/${value}`), 'utf8'),
        parameters: cfnParams,
        tags,
        operationPreferences: { failureToleranceCount: 1, maxConcurrentCount: 1 },
        stackInstancesGroup: [{
          regions: props.regions,
          deploymentTargets: {
            organizationalUnitIds: props.organizationUnits.map((ou: { attrId: string }) => ou.attrId), 
          },
        }],
      });
    });
  }
}