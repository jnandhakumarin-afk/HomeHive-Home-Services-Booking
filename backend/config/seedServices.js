const Service = require("../models/Service");

const defaultServices = [
  { name: "AC Repair", category: "Repair", description: "Air conditioning repair and maintenance" },
  { name: "Washing Machine Repair", category: "Repair", description: "Washing machine diagnosis and repair" },
  { name: "Refrigerator Repair", category: "Repair", description: "Refrigerator diagnosis and repair" },
  { name: "TV Repair", category: "Repair", description: "Television diagnosis and repair" },
  { name: "Microwave Repair", category: "Repair", description: "Microwave diagnosis and repair" },
  { name: "Plumbing Service", category: "Plumbing", description: "Home plumbing repairs and maintenance" },
  { name: "Electrical Service", category: "Electrical", description: "Home electrical repairs and maintenance" },
  { name: "Home Cleaning", category: "Cleaning", description: "Home cleaning services" },
  { name: "Home Beauty Service", category: "Beauty", description: "At-home beauty services" },
  { name: "Carpentry Service", category: "Carpentry", description: "Home carpentry and repair services" },
  { name: "Home Maintenance", category: "Maintenance", description: "General home maintenance services" }
];

async function seedDefaultServices() {
  await Promise.all(defaultServices.map(({ name, category, description }) =>
    Service.updateOne(
      { name, category },
      { $setOnInsert: { name, category, description, isActive: true } },
      { upsert: true }
    )
  ));
}

module.exports = seedDefaultServices;
