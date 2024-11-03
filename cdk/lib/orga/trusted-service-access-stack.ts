import { EnforcedNestedStack, EnforcedStackProps } from "@helpers";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export type TrustedServiceAccessStackProps = EnforcedStackProps & { trustedServices: string[] }
export class TrustedServiceAccessStack extends EnforcedNestedStack {
  constructor (scope: Construct, id: string, props: TrustedServiceAccessStackProps) {
    
    super(scope, id, props);
    const { trustedServices = [] } = props;

    trustedServices.forEach((service: string) => {

      const identifier = service.replace('.', '');
      const enable: AwsSdkCall = {
        service: 'organizations',
        action: 'enableAWSServiceAccess',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${identifier}`),
        parameters: { ServicePrincipal: service },
      };

      const disable: AwsSdkCall = {
        service: 'organizations',
        action: 'disableAWSServiceAccess',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${identifier}`),
        parameters: { ServicePrincipal: service },
      };

      new AwsCustomResource(this, `AWSServiceAccessActivation${identifier}CustomResource`, {
        onCreate: enable,
        onUpdate: enable,
        onDelete: disable,
        logRetention: RetentionDays.ONE_WEEK,
        policy: AwsCustomResourcePolicy.fromStatements([
          new PolicyStatement({
            sid: 'OrgCustomResourceSetOrgAWSServiceActivation',
            effect: Effect.ALLOW,
            actions: [
              'organizations:enableAWSServiceAccess',
              'organizations:disableAWSServiceAccess',
            ],
            resources: ['*']
          }),
        ]),
      });

    })

  }
}