import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { Group } from './groups';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { SSOReady } from '@type';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export type SSOStackProps = EnforcedStackProps & { ssoConfig: SSOReady }
export class SSOStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: SSOStackProps) {
    super(scope, id, props);
    
    const { 
      ssoConfig: { 
        ssoInstanceArn: SSO_INSTANCE_ARN, 
        identityStoreId: IDENTITY_STORE_ID,
        isReadyToDeploy
      }
    } = props;

    if( !isReadyToDeploy ) return;
    // Org Accounts
    const developmentAccount = StringParameter.fromStringParameterName(this, 'AccountSecurity', `/${this.ENV}/${this.CONTEXT}/security_b/account/id`).stringValue; 

    //Managed Policies
    const adminManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess');
    const poweredUserManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess');
    const readonlyManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess');


    new Group(this, 'Admin', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ adminManagedPolicy.managedPolicyArn ],
      accounts: [ developmentAccount ]
    });

    new Group(this, 'PowerUser', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ poweredUserManagedPolicy.managedPolicyArn ],
      accounts: [ developmentAccount ]
    });

    new Group(this, 'Developer', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ readonlyManagedPolicy.managedPolicyArn ],
      accounts: [ developmentAccount ]
    });
  }
}
