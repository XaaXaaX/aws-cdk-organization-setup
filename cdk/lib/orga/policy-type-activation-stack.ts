import { EnforcedNestedStack, EnforcedStackProps } from "@helpers";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export type PolicyTypeActicationStackProps = EnforcedStackProps & { policyTypes: string[], rootId: string }
export class PolicyTypeActicationStack extends EnforcedNestedStack {
  constructor (scope: Construct, id: string, props: PolicyTypeActicationStackProps) {
    
    super(scope, id, props);
    const { policyTypes: POLICY_TYPES = [], rootId: ROOT_ID } = props;

    POLICY_TYPES.forEach((type: string) => {
      const identifier = type.replace('.', '');
      const enable: AwsSdkCall = {
        service: 'organizations',
        action: 'enablePolicyType',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${identifier}`),
        parameters: { PolicyType: type, RootId: ROOT_ID },
      };

      const disable: AwsSdkCall = {
        service: 'organizations',
        action: 'disablePolicyType',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${identifier}`),
        parameters: { PolicyType: type, RootId: ROOT_ID },
      };

      new AwsCustomResource(this, `PolicyTypeActivation${identifier}CustomResource`, {
        onCreate: enable,
        onUpdate: enable,
        onDelete: disable,
        logRetention: RetentionDays.ONE_WEEK,
        policy: AwsCustomResourcePolicy.fromStatements([
          new PolicyStatement({
            sid: 'OrgCustomResourcePolicyTypeActivation',
            effect: Effect.ALLOW,
            actions: [
              'organizations:enablePolicyType',
              'organizations:disablePolicyType',
            ],
            resources: ['*']
          }),
        ]),
      });
    })
  }
}