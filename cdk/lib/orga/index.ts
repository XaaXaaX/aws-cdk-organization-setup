import { CfnAccount, CfnOrganization, CfnOrganizationalUnit } from 'aws-cdk-lib/aws-organizations';
import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { DNSConfig, OrgConfg } from '@type';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Bootstrap, BootstrapTypes } from './bootstrap';
import { TrustedServiceAccessStack } from './trusted-service-access-stack';
import { CfnResourceShare } from 'aws-cdk-lib/aws-ram';
import { OrganizationPoliciesStack } from './policies-stack';
import { PolicyTypeActicationStack } from './policy-type-activation-stack';

export type OrganizationStackProps = EnforcedStackProps & {
  orgConfig: OrgConfg;
  dnsConfig: DNSConfig;
  gitHubConfig: { owner: string }
}
export class OrganizationStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: OrganizationStackProps) {
    super(scope, id, props);

    const { 
      orgConfig: { 
        memebers: { accounts: ACCOUNTS, bootstrap: BOOTSTRAP }, 
        crossAccountParametersSharing: PARAM_SHARING,
        trustedAWSServices: TRUSTED_ACCESS
      },
      gitHubConfig,
      dnsConfig: { mailExchangeDomainName: DOMAIN_NAME },
    } = props;

    const orga =new CfnOrganization(this, 'Organization', { featureSet: 'ALL' });

    const orgUnit = new CfnOrganizationalUnit(this, 'OrganitationUnit', {
      name: `workloads`,
      parentId: orga.attrRootId
    });

    orgUnit.addDependency(orga);

    new TrustedServiceAccessStack(this, 'TrustedServiceAccessStack', {
      contextVariables: props.contextVariables,
      trustedServices: TRUSTED_ACCESS || []
    });

    if( BOOTSTRAP ) {
      new Bootstrap(this, 'Bootstrap', { 
        contextVariables: props.contextVariables,
        regions: [ this.REGION ],
        organizationUnits: [ orgUnit ],
        types: {
          [BootstrapTypes.CDK]: { FileAssetsBucketKmsKeyId: 'AWS_MANAGED_KEY' },
          [BootstrapTypes.GitHub]: { Owner: gitHubConfig.owner, Repo: '*' }  
        },
      })
    }

    const accountIds: string[] = [];
    const parameterArns: string[] = []; 
    ACCOUNTS.forEach((account: { accountName: string }) => {
      const awsAccount =new CfnAccount(this, `${account.accountName}Account`, {      
        accountName: `${account.accountName}`,
        email: `${account.accountName}@${DOMAIN_NAME}`,
        parentIds: [orgUnit.attrId],
      });

      awsAccount.applyRemovalPolicy(RemovalPolicy.RETAIN);

      const param = new StringParameter(this, `${account.accountName}AccountIdParam`, {
        tier: PARAM_SHARING ? ParameterTier.ADVANCED : ParameterTier.STANDARD,
        stringValue: awsAccount.attrAccountId,
        description: `Account ID for ${awsAccount.accountName}`,
        parameterName: `/${this.ENV}/${this.CONTEXT}/${awsAccount.accountName}/account/id`,
      })
      parameterArns.push(param.parameterArn);
      accountIds.push(awsAccount.attrAccountId);
    });

    if( PARAM_SHARING ) {
      new CfnResourceShare(this, 'SharedAccountsParameters', {
        name: `${this.CONTEXT}-account-ids-${this.ENV}`,
        principals: accountIds,
        resourceArns: parameterArns,
      });
    }

    const policyTypeActivationStack = new PolicyTypeActicationStack(this, PolicyTypeActicationStack.name, {
      contextVariables: this.CONTEXT_VARIABLES,
      policyTypes: [ 'SERVICE_CONTROL_POLICY' ],   
      rootId: orga.attrRootId 
    });

    const policiesStack = new OrganizationPoliciesStack(this, 'OrganizationPoliciesStack', {
      contextVariables: props.contextVariables,
      targets: [ orgUnit.attrId ],
    });

    policiesStack.node.addDependency(policyTypeActivationStack);
  }
}
