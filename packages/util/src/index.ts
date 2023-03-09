export function add(...args: number[]) {
  return args.reduce((prev, curr) => prev + curr, 0);
}
