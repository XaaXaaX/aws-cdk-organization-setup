import { EnforcedStackProps } from "@helpers";
import { Duration } from "aws-cdk-lib";
import { CfnGroup } from "aws-cdk-lib/aws-identitystore";
import { CfnAssignment, CfnPermissionSet,  } from "aws-cdk-lib/aws-sso";
import { Construct } from "constructs";

type GroupsProps = EnforcedStackProps & {
  identityStoreId: string;
  ssoInstanceArn: string;
  managedPolicies: string[];
  accounts: string[];
}
export class Groups extends Construct {
  constructor(scope: Construct, id: string, props: GroupsProps) {
    super(scope, id);

    const { 
      identityStoreId,
      ssoInstanceArn,
      managedPolicies,
      contextVariables: { stage: ENV, context: CONTEXT },
      accounts
    } = props;
    
    const group = new CfnGroup(this, id, {
      displayName: 'Admins',
      description: 'Admins Group',
      identityStoreId,
    });

    const permissionSet = new CfnPermissionSet(this, `${id}PermissionSet`, {
      name: `${id}@${ENV}`,
      description: `${id}@${ENV}`,
      instanceArn: ssoInstanceArn,
      managedPolicies: managedPolicies,
      inlinePolicy: undefined,
      sessionDuration: Duration.hours(12).toIsoString(),
    });

    accounts.forEach((account) => {
      new CfnAssignment(this, `${id}Assignment`, {
        instanceArn: ssoInstanceArn,
        permissionSetArn: permissionSet.attrPermissionSetArn,
        principalId: group.attrGroupId,
        principalType: 'GROUP',
        targetId: account,
        targetType: 'AWS_ACCOUNT',
      });
    })
  }
}