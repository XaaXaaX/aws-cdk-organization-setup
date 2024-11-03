import { EnforcedStackProps } from "@helpers";
import { CfnStackSet } from "aws-cdk-lib";
import { CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";
import { readFileSync } from 'fs';
import { join } from "path";

type ParamsType = Array<CfnStackSet.ParameterProperty>;

export enum BootstrapTypes {
  GitHub = 'oidc-github.yml',
  CDK = 'cdk-bootstrap-template.yml',
}
export type BootstrapStackProps = EnforcedStackProps & {
  organizationUnits: CfnOrganizationalUnit[];
  regions: string[];
  types: { [key in BootstrapTypes]: ParamsType };
}
export class BootstrapStack extends Construct {
  constructor(scope: Construct, id: string, props: BootstrapStackProps) {
    super(scope, id);

    const { contextVariables: { stage: ENV, context: CONTEXT }, types: TYPES } = props;

    Object.keys(TYPES).forEach((value: string, index: number) => {
      const params = TYPES[value as unknown as BootstrapTypes];
      
      const typeIdentifier = value.replace('.yml', '').replace(/[^a-zA-Z]/g, '');
      new CfnStackSet(this, `BootstrapStack${typeIdentifier}`, {
        permissionModel: "SERVICE_MANAGED",
        stackSetName: `${CONTEXT}-${typeIdentifier}-bootstrap-${ENV}`,
        description: `Account bootstrap StackSet ${typeIdentifier}`,
        autoDeployment: { enabled: true, retainStacksOnAccountRemoval: false },
        capabilities: ["CAPABILITY_NAMED_IAM"],
        templateBody: readFileSync(join(process.cwd(), `/cdk/lib/orga/bootstrap/${value}`), 'utf8'),
        parameters: params,
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