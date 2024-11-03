import { EnforcedNestedStack, EnforcedStackProps } from "@helpers"
import { CfnPolicy } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs"

const SERVICE_LIST = [ 
  'organizations',
]

export type OrganizationPoliciesStackProps = EnforcedStackProps & {
  targets: string[];
}
export class OrganizationPoliciesStack extends EnforcedNestedStack {
  constructor(scope: Construct, id: string, props: OrganizationPoliciesStackProps) {
    super(scope, id, props)

    const { targets: TARGET_IDS } = props;
    
    SERVICE_LIST.map(async (service) => {
      const policyDocument = await import(`./policies/${service}.json`);

      if(policyDocument) {
        new CfnPolicy(this, `${service}Policy`, {
          targetIds: TARGET_IDS,
          type: 'SERVICE_CONTROL_POLICY',
          content: policyDocument,
          name: `${this.CONTEXT}-${service}-${this.ENV}`,
        });
      }
    });
    
  }
}