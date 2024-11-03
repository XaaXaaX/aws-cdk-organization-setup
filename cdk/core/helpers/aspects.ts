import { ContextVariables } from '@type';
import { Annotations, Aspects, CfnResource, IAspect, RemovalPolicy, Tag, TreeInspector } from 'aws-cdk-lib';
import { CfnParameter } from 'aws-cdk-lib/aws-ssm';
import { IConstruct } from 'constructs';

export class ApplyTagsAspect implements IAspect {
  constructor(readonly tags: Record<string, string>) { }
  public visit(node: IConstruct): void {
    node.node.children.forEach((child) => {
      Aspects.of(child).add(new Tag("context", this.tags.context));  
      Aspects.of(child).add(new Tag("stage", this.tags.stage));
      Aspects.of(child).add(new Tag("owner", this.tags.owner));
      Aspects.of(child).add(new Tag("usage", this.tags.usage));
    })
  }
}

export class ApplyDestroyPolicyAspect implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
  }
}


export class ApplyParameterStoreNamingPolicyAspect implements IAspect {
  constructor(private readonly variables: ContextVariables) { }
  public visit(node: IConstruct): void {
    if (node instanceof CfnParameter) {
      const inspector = new TreeInspector();
      node.inspect(inspector);
      
      const name = inspector.attributes['aws:cdk:cloudformation:props']['name'].toString()
        .replace(`${this.variables.stage}`, '')
        .replace(`${this.variables.context}`, '')
        .replace('//', '');
      node.addPropertyOverride('Name', `/${this.variables.stage}/${this.variables.context}${name}` );
    }
  }

  protected error(node: IConstruct, message: string): void {
    Annotations.of(node).addError(message);
  }  
}