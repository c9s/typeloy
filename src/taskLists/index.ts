export function loadOsTasks(os:string) : any {
  return require('./' + os);
};
