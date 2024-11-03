import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { Group } from './groups';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { OrgConfg, SSOReady } from '@type';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export type SSOStackProps = EnforcedStackProps & { ssoConfig: SSOReady, orgConfig: OrgConfg }
export class SSOStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: SSOStackProps) {
    super(scope, id, props);
    
    const { 
      ssoConfig: { 
        ssoInstanceArn: SSO_INSTANCE_ARN, 
        identityStoreId: IDENTITY_STORE_ID,
        isReadyToDeploy
      },
      orgConfig: { memebers: { accounts: ACCOUNTS },}
    } = props;

    if( !isReadyToDeploy ) return;
    // Org Accounts
    const accountIds = ACCOUNTS.map((account) => {
      return StringParameter.valueFromLookup(this, `/${this.ENV}/${this.CONTEXT}/${account.accountName}/account/id`);
    })

    //Managed Policies
    const adminManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess');
    const poweredUserManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess');
    const readonlyManagedPolicy = ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess');

    new Group(this, 'Admin', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ adminManagedPolicy.managedPolicyArn ],
      accounts: accountIds
    });

    new Group(this, 'PowerUser', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ poweredUserManagedPolicy.managedPolicyArn ],
      accounts: accountIds
    });

    new Group(this, 'Developer', { 
      contextVariables: this.CONTEXT_VARIABLES,
      ssoInstanceArn: SSO_INSTANCE_ARN,
      identityStoreId: IDENTITY_STORE_ID,
      managedPolicies: [ readonlyManagedPolicy.managedPolicyArn ],
      accounts: accountIds
    });
  }
}
