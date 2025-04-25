// utils/getNextOrderId.js
import Counter from "../model/Counter.js";

export async function getNextOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}
