// Fixture: CORS wildcard on sensitive endpoint
export const config = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};
