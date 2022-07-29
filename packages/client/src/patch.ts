// update this array to catch more errors
const HYDRATION_ERROR_MSGS = [
  "Warning: Did not expect server HTML to contain",
  "Warning: Text content did not match. Server",
];

// can use any npm package instead of this
const interpolate = (template: any, params: any) =>
  params.reduce((p: any, c: any) => p.replace(/%s/, c), template);

const isReactHydrationError = (args: [any?, ...any[]]) => {
  const [errorArg] = args;
  return (
    errorArg &&
    typeof errorArg.includes === "function" &&
    HYDRATION_ERROR_MSGS.some((msg) => errorArg.includes(msg))
  );
};

const logHydrationError = (args: [any?, ...any[]]) => {
  args[0] = `ReactHydrationError - ${args[0]}`;
  const [template, ...params] = args;
  const error = interpolate(template, params);
  // function to log this error in the desired error logging channel
  reportError({ error });
};

export const patchConsoleError = () => {
  // save reference to original error() function
  const { error } = console;
  console.error = function (...args) {
    if (isReactHydrationError(args)) {
      logHydrationError(args);
    }
    error.apply(console, args);
  };
};
