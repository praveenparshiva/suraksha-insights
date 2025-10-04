import { CustomerRecord } from "@/contexts/AppContext";

const N8N_WEBHOOK_URL = "https://your-n8n-server/webhook/suraksha-data";

export async function syncWithN8n(customer: CustomerRecord) {
  try {
    const payload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      serviceType: customer.customServiceType || customer.serviceType,
      price: customer.price,
      serviceDate: customer.serviceDate,
      nextServiceDate: customer.nextServiceDate || null,
      notes: customer.notes || "",
      status: customer.nextServiceDate ? "Active" : "Completed",
      timestamp: Date.now()
    };

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Network error");
    
    console.log("✅ Data synced to n8n:", payload);
    return true;
  } catch (err) {
    console.error("❌ Sync failed:", err);
    return false;
  }
}
