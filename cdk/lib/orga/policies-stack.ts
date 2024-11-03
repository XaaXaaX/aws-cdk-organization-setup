import { EnforcedNestedStack, EnforcedStackProps } from "@helpers"
import { CfnPolicy } from "aws-cdk-lib/aws-organizations";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs"
import { ServicePrincipal } from "@type";


const policies: {[key in Effect]: ServicePrincipal[] } = {
  [Effect.ALLOW]: [],
  [Effect.DENY]: [ "organizations" ],
}

export type OrganizationPoliciesStackProps = EnforcedStackProps & {
  targets: string[];
}
export class OrganizationPoliciesStack extends EnforcedNestedStack {
  constructor(scope: Construct, id: string, props: OrganizationPoliciesStackProps) {
    super(scope, id, props)

    const { targets: TARGET_IDS } = props;
    
    Object.keys(policies).map(async (policyEffect: string) => {
      const serviceList = Object.entries(policies[policyEffect as unknown as Effect]).map(([key, value]) => value && value.length > 0 ? value : []) as ServicePrincipal[];

      serviceList.map(async (service) => {
        const policyDocument = await import(`./policies/scp/${service}.${policyEffect.toLowerCase()}.json`);

        if(policyDocument) {
          new CfnPolicy(this, `${service}${policyEffect}Policy`, {
            targetIds: TARGET_IDS,
            type: 'SERVICE_CONTROL_POLICY',
            content: policyDocument,
            name: `${this.CONTEXT}-${service}-${policyEffect}-${this.ENV}`,
          });
        }
      });
    });
    
  }
}