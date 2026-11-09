process.on("SIGTERM", () => process.exit(0)) // Kata delivers SIGTERM twice; a once-listener lets the second one kill the process.
