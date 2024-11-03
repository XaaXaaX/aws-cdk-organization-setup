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

      const enableAWSServiceAccess: AwsSdkCall = {
        service: 'organizations',
        action: 'enableAWSServiceAccess',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${service.replace('.', '')}`),
        parameters: { ServicePrincipal: service },
      };

      const disableAWSServiceAccess: AwsSdkCall = {
        service: 'organizations',
        action: 'disableAWSServiceAccess',
        physicalResourceId: PhysicalResourceId.of(`OrgCustomResource${service.replace('.', '')}`),
        parameters: { ServicePrincipal: service },
      };

      new AwsCustomResource(this, "AWSServiceAccessActivationCustomResource", {
        onCreate: enableAWSServiceAccess,
        onUpdate: enableAWSServiceAccess,
        onDelete: disableAWSServiceAccess,
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