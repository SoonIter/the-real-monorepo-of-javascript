export function sdk(...args: number[]) {
  console.log('sdk');
  return args.reduce((prev, curr) => prev + curr, 0);
}
