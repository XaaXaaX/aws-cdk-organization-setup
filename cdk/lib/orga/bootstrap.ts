import { EnforcedStackProps } from "@helpers";
import { CfnStackSet } from "aws-cdk-lib";
import { CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";
import { readFileSync } from 'fs';
import { join } from "path";

export type BootstrapStackProps = EnforcedStackProps & {
  organizationUnits: CfnOrganizationalUnit[];
  regions: string[];
}
export class BootstrapStack extends Construct {
  constructor(scope: Construct, id: string, props: BootstrapStackProps) {
    super(scope, id);

    const { contextVariables: { stage: ENV, context: CONTEXT } } = props;
    new CfnStackSet(this, "BoosttrrapStack", {
      permissionModel: "SERVICE_MANAGED",
      stackSetName: `${CONTEXT}-account-bootstrap-${ENV}`,
      description: "Account bootstrap StackSet",
      autoDeployment: {
        enabled: true,
        retainStacksOnAccountRemoval: false,
      },
      capabilities: ["CAPABILITY_NAMED_IAM"],
      templateBody: readFileSync(join(process.cwd(), '/cdk/lib/orga/cdk-bootstrap-template.yaml'), 'utf8'),
      operationPreferences: {
        failureToleranceCount: 1,
        maxConcurrentCount: 1,
      },
      stackInstancesGroup: [{
        deploymentTargets: {
          organizationalUnitIds: props.organizationUnits.map((ou) => ou.attrId), 
        },
        regions: props.regions,
      }],
    });
  }
}