import { ethers } from "hardhat";
import contractInfo from "../lib/blockchain/ledger.json";

async function main() {
  const [owner, clinic1, clinic2, doctor1, doctor2, patient1, patient2] =
    await ethers.getSigners();

  const contract = new ethers.Contract(
    contractInfo.address,
    contractInfo.abi,
    owner
  );

  console.log("Seeding MediBridgeLedger at", contractInfo.address);

  // 1. Verify clinics
  const tx1 = await contract.verifyClinic(
    clinic1.address,
    "Istanbul Aesthetic Center",
    "JCI Accreditation",
    Math.floor(Date.now() / 1000) + 365 * 24 * 3600
  );
  await tx1.wait();
  console.log("✓ Clinic 1 verified:", clinic1.address);

  const tx2 = await contract.verifyClinic(
    clinic2.address,
    "Antalya Dental Excellence",
    "ISO 9001",
    Math.floor(Date.now() / 1000) + 365 * 24 * 3600
  );
  await tx2.wait();
  console.log("✓ Clinic 2 verified:", clinic2.address);

  // 2. Verify doctors
  const tx3 = await contract.verifyDoctor(
    doctor1.address,
    clinic1.address,
    "TR-MED-45231",
    Math.floor(Date.now() / 1000) + 365 * 24 * 3600
  );
  await tx3.wait();
  console.log("✓ Doctor 1 verified:", doctor1.address);

  const tx4 = await contract.verifyDoctor(
    doctor2.address,
    clinic2.address,
    "TR-DEN-88102",
    Math.floor(Date.now() / 1000) + 365 * 24 * 3600
  );
  await tx4.wait();
  console.log("✓ Doctor 2 verified:", doctor2.address);

  // 3. Patient records
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("pre-op-scan-james-wilson"));
  const contractPatient1 = contract.connect(patient1);
  const tx5 = await contractPatient1.addRecord(
    hash1,
    "MRI_Scan_2024_07.pdf",
    "pre-op"
  );
  await tx5.wait();
  console.log("✓ Patient 1 record added");

  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("post-op-scan-james-wilson"));
  const tx6 = await contractPatient1.addRecord(
    hash2,
    "FollowUp_2024_08.pdf",
    "post-op"
  );
  await tx6.wait();
  console.log("✓ Patient 1 second record added");

  // 4. Consent
  const tx7 = await contractPatient1.grantConsent(doctor1.address, hash1);
  await tx7.wait();
  console.log("✓ Consent granted to doctor 1");

  // 5. Reviews
  const tx8 = await contractPatient1.addReview(
    clinic1.address,
    5,
    "Excellent care and professional staff. Highly recommend!"
  );
  await tx8.wait();
  console.log("✓ Review added for clinic 1");

  const contractPatient2 = contract.connect(patient2);
  const hash3 = ethers.keccak256(ethers.toUtf8Bytes("pre-op-scan-sarah-chen"));
  const tx9 = await contractPatient2.addRecord(
    hash3,
    "XRay_Scan_2024_06.pdf",
    "pre-op"
  );
  await tx9.wait();
  console.log("✓ Patient 2 record added");

  const tx10 = await contractPatient2.addReview(
    clinic2.address,
    4,
    "Great dental work, very clean facility."
  );
  await tx10.wait();
  console.log("✓ Review added for clinic 2");

  console.log("\n🎉 Seeding complete!");
  console.log("  Clinics:", 2);
  console.log("  Doctors:", 2);
  console.log("  Records:", 3);
  console.log("  Reviews:", 2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
