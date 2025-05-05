export type Person = {
  id: string;
  name: string;
  function: string;
  learningOutcome?: string;
  significance: 1 | 2 | 3 | 4;
  setting?: string;
};

export type NetworkConnection = {
  source: string;
  target: string;
  label: string;
};
