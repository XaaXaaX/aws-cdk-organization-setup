
import { Construct } from 'constructs';
import { NetworkStack } from './vpc-stack';
import { SecurityStack } from './security-stack';
import { EnforcedStack, EnforcedStackProps } from '@helpers';
import { Account } from '@type';

export type SharedInfraStackProps = EnforcedStackProps & { accounts: Account[]; }
export class SharedInfraStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: SharedInfraStackProps) {
    super(scope, id, props);

    const baseProps = { contextVariables: this.CONTEXT_VARIABLES }

    const networkStack = new NetworkStack(this, NetworkStack.name, baseProps);

    new SecurityStack(this, SecurityStack.name, {
      ...baseProps, 
      network: { vpc: networkStack.vpc }
    });
  }
}
