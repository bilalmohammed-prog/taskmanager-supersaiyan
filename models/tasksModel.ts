import mongoose, { models, model } from "mongoose";

const userSchema = new mongoose.Schema({
  empID: { type: String, required: true },
  id: { type: String, required: true },
  task: { type: String, required: true },
  description: { type: String, default: "" },
  startTime: { type: String, required: true }, // now full datetime string
  endTime: { type: String, required: true },   // now full datetime string
  status: { type: String, required: true },
  proof: { type: String, required: false },
  durationHours: { type: Number, required: false }, // optional computed field
  submittedAt: { type: Date, default: Date.now } // when user marked task as done
});

const Task = models.Task || model("Task", userSchema, "tasks");
export default Task;