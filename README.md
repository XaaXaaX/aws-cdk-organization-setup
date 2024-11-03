# AWS Organization with AWS CDK

Setup AWS Organization using aws cdk, the cdk project includes following parts

- Typed Configuration to manage configurations centraly
- HostedZone and Mail server to receive mails
- AWS Organization and Account Creation
- AWS SSO using IAM Identity Center

## Organization Stack

The stack creates the Org and all memeber accounts which are declared via configuration. Each Memeber account is bootstraped with aws cdk.

> Github OIDC in progress

## AWS SSO

The Project also setups the IAM Identity Center with a minimum config including an AdminGroup, PermissionSets and Assignement.

> Due to lack of possibility, the sso must be enabled manually in IAM Identity Center console. The resulting ssoInstanceArn and IdentityStoreId must be added to configuration file to let the stack being deployed

