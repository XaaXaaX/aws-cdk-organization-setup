import { CfnAccount, CfnOrganization, CfnOrganizationalUnit } from 'aws-cdk-lib/aws-organizations';
import { Construct } from 'constructs';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { DNSConfig, OrgConfg } from '@type';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { RemovalPolicy } from 'aws-cdk-lib';
import { BootstrapStack } from './bootstrap';
import { TrustedServiceAccessStack } from './trusted-service-access';
import { CfnResourceShare } from 'aws-cdk-lib/aws-ram';

export type OrganizationStackProps = EnforcedStackProps & {
  orgConfig: OrgConfg;
  dnsConfig: DNSConfig;
}
export class OrganizationStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: OrganizationStackProps) {
    super(scope, id, props);

    const tempSuffix = '_b'
    const { 
      orgConfig: { 
        memebers: { accounts: ACCOUNTS, bootstrap: BOOTSTRAP }, 
        crossAccountParametersSharing: PARAM_SHARING,
        trustedAWSServices: TRUSTED_ACCESS
      },
      dnsConfig: { mailExchangeDomainName: DOMAIN_NAME },
    } = props;

    const orga =new CfnOrganization(this, 'Organization', { featureSet: 'ALL' });

    const orgUnit = new CfnOrganizationalUnit(this, 'OrganitationUnit', {
      name: `workloads${tempSuffix}`,
      parentId: orga.attrRootId
    });

    orgUnit.addDependency(orga);

    new TrustedServiceAccessStack(this, 'TrustedServiceAccessStack', {
      contextVariables: props.contextVariables,
      trustedServices: TRUSTED_ACCESS || []
    });

    if( BOOTSTRAP ) {
      new BootstrapStack(this, 'BootstrapStack', { 
        contextVariables: props.contextVariables,
        regions: [ this.REGION ],
        organizationUnits: [ orgUnit ]
      })
    }
    const accountIds: string[] = [];
    const parameterArns: string[] = []; 
    ACCOUNTS.forEach((account) => {
      const awsAccount =new CfnAccount(this, `${account.accountName}Account`, {      
        accountName: `${account.accountName}${tempSuffix}`,
        email: `${account.accountName}${tempSuffix}@${DOMAIN_NAME}`,
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
      new CfnResourceShare(this, 'SharingParameters', {
        name: `${this.CONTEXT}-${this.ENV}`,
        principals: accountIds,
        resourceArns: parameterArns,
      });
    }
  }
}
