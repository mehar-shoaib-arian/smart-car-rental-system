import app from "./app.js";
import { startOverdueCron } from "./controllers/overdueController.js";

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start overdue cron after server is up
  try {
    startOverdueCron();
  } catch (err) {
    console.error("[OverdueCron] Failed to start overdue cron:", err.message);
  }
});
