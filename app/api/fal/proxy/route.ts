import { route } from "@fal-ai/server-proxy/nextjs";

export const runtime = "edge";
// Proxy forwards Fal client requests (e.g. storage upload). Model-specific inference
// and prompt construction are handled by POST /api/transform.
export const { GET, POST, PUT } = route;
