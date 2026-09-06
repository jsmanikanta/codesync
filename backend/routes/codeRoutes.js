import { Router } from "express";
import { runCode } from "../services/codeExecutionService.js";

const router = Router();

router.post("/run", async (req, res) => {
  try {
    const result = await runCode(req.body || {});
    const statusCode =
      result.status === "execution_service_error"
        ? 503
        : result.status === "invalid_language" ||
            result.status === "invalid_request"
          ? 400
          : 200;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error("Code run request error:", error.message);
    res.status(500).json({
      success: false,
      status: "execution_service_error",
      output: "",
      error: "Unable to process the code execution request.",
      executionTime: null,
      memory: null,
    });
  }
});

export default router;
