
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { Duration } from 'aws-cdk-lib';
import { Conditions, ManagedPolicy, OpenIdConnectProvider, Role, WebIdentityPrincipal } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs'

export type GithubOIDCStackProps = EnforcedStackProps & { githubConfig: { owner: string } }

/**
 * GitHub OIDC for Actions
 * https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
 * 
 * AWS Docs 
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html#idp_oidc_Create_GitHub
 */
export class GithubOIDCStack extends EnforcedStack {
  private static readonly AUDIENCE = 'sts.amazonaws.com';
  private static readonly ISSUER = 'https://token.actions.githubusercontent.com';
  
  constructor(scope: Construct, id: string, props: GithubOIDCStackProps) {
    super(scope, id, props)

    const { githubConfig: { owner: OWNER } } = props
    const githubProvider = new OpenIdConnectProvider(this, 'OIDCProvider', {
      url: GithubOIDCStack.ISSUER,
      clientIds: [GithubOIDCStack.AUDIENCE],
    })

    const conditions: Conditions = {
      StringLike: { [`${GithubOIDCStack.ISSUER}:sub`]: `repo:${OWNER}/*` },
      ForAllValuesStringEquals: {
        'token.actions.githubusercontent.com:iss': GithubOIDCStack.ISSUER,
        'token.actions.githubusercontent.com:aud': GithubOIDCStack.AUDIENCE,
      },
    }

    const role = new Role(this, 'DeployRole', {
      assumedBy: new WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, conditions),
      managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess') ],
      roleName: `${this.CONTEXT}-github-oidc-role-${this.ENV}`,
      description: 'This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account',
      maxSessionDuration: Duration.hours(12),
    })

    new StringParameter(this, 'GithubActionOidcIamRoleArn', {
      stringValue: role.roleArn,
      parameterName: `/${this.ENV}/${this.CONTEXT}/github-oidc-role-arn`,
    });
  }
}
