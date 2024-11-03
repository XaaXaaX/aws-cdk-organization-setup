import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { Groups } from './groups';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { SSOConfig } from '@type';

export type SSOStackProps = EnforcedStackProps & { ssoConfig: SSOConfig }
export class SSOStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: SSOStackProps) {
    super(scope, id, props);
    
    const { 
      ssoConfig: { ssoInstanceArn: SSO_INSTANCE_ARN, identityStoreId: IDENTITY_STORE_ID },
    } = props;

    const developmentAccount = StringParameter.fromStringParameterName(this, 'AccountSecurity', `/${this.ENV}/${this.CONTEXT}/security_b/account/id`).stringValue; 

    new Groups(this, 'AdminGroups', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: ['arn:aws:iam::aws:policy/AdministratorAccess'],
      accounts: [ developmentAccount ]
    });
  }
}
