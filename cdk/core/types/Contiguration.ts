import { CfnAccountProps } from "aws-cdk-lib/aws-organizations";
import { ContextVariables } from "./Context";

export type Account = Pick<CfnAccountProps, 'accountName'>;

export type SSONotReady = { isReadyToDeploy: false; }
export type SSOReady = { 
  isReadyToDeploy: true; 
  ssoInstanceArn: string;
  identityStoreId: string; 
}
export type SSOConfig = SSONotReady | SSOReady;

type ExternalZone = { isExternal: true; hostedZoneId: string; domainName: string; }

type InternalZone = { isExternal: false; domainName: string; }

export type DNSConfig = (ExternalZone | InternalZone) & {
  mailExchangeDomainName: string;
};

export type OrgConfg = {
  memebers: {
    bootstrap?: boolean;
    accounts: {
      accountName: string;
    }[];
  };
  trustedAWSServices?: string[];
  crossAccountParametersSharing?: boolean;
};

export type Config = {
  contextVariables: ContextVariables;
  sso:  SSOConfig;
  dns: DNSConfig;
  org: OrgConfg;
  github: { owner: string; };
}

export type ServicePrincipal = 'organizations' | 'iam' | 'sso' | 'billing';