// Fixture: eval() with user input
export async function handleRequest(req: any) {
  const userInput = req.body.code;

  // BAD: eval with user input
  const result = eval(userInput);
  return result;
}

// BAD: new Function with user input
export function createHandler(userCode: string) {
  return new Function("data", userCode);
}
