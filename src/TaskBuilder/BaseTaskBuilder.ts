
import {Config} from "../config";
import {SessionGroup} from "../SessionManager";

export abstract class BaseTaskBuilder {

  protected sessionGroup : SessionGroup;

  constructor(sessionGroup : SessionGroup) {
    this.sessionGroup = sessionGroup;
  }
}
