import { EnforcedStackProps } from "@helpers";
import { Duration } from "aws-cdk-lib";
import { CfnGroup } from "aws-cdk-lib/aws-identitystore";
import { CfnAssignment, CfnPermissionSet } from "aws-cdk-lib/aws-sso";
import { Construct } from "constructs";

type GroupProps = EnforcedStackProps & {
  identityStoreId: string;
  ssoInstanceArn: string;
  managedPolicies: string[];
  accounts: string[];
}
export class Group extends Construct {
  constructor(scope: Construct, id: string, props: GroupProps) {
    super(scope, id);

    const { 
      identityStoreId,
      ssoInstanceArn,
      managedPolicies,
      contextVariables: { stage: ENV, context: CONTEXT },
      accounts
    } = props;
    
    const group = new CfnGroup(this, 'Group', {
      displayName: `${id}`,
      description: `${id} Group`,
      identityStoreId,
    });

    const permissionSet = new CfnPermissionSet(this, `PermissionSet`, {
      name: `${id}@${ENV}`,
      description: `${id}@${ENV}`,
      instanceArn: ssoInstanceArn,
      managedPolicies: managedPolicies,
      inlinePolicy: undefined,
      sessionDuration: Duration.hours(12).toIsoString(),
    });

    accounts.forEach((account) => {
      new CfnAssignment(this, `${account}Assignment`, {
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