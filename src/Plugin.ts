import {Deployment} from "./Deployment";

export abstract class Plugin {

  public whenSuccess(deployment:Deployment) { }

  public whenFailure(deployment:Deployment) { }

  public whenBeforeBuilding(deployment:Deployment) { }

  public whenBeforeDeploying(deployment:Deployment) { }

  public whenAfterCompleted(deployment:Deployment) { }

  public whenAfterDeployed(deployment:Deployment) { }

}
