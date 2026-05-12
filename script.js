import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC4JhAcSMtmmN4RVGKDMG1yxQr-usp_Lxg",
  authDomain: "okhee-savings.firebaseapp.com",
  projectId: "okhee-savings",
  storageBucket: "okhee-savings.firebasestorage.app",
  messagingSenderId: "553829927053",
  appId: "1:553829927053:web:f873c5d2320a9864f63ac4"
};

// INIT FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const datePicker = document.getElementById("datePicker");
const totalText = document.getElementById("total");
const historyDiv = document.getElementById("history");

let transactions = [];
let currentType = "tambah";

// SET HARI INI
datePicker.valueAsDate = new Date();

// REALTIME FIREBASE
onSnapshot(collection(db, "transactions"), (snapshot) => {
  transactions = [];

  snapshot.forEach((doc) => {
    transactions.push(doc.data());
  });

  updateTotal();
});

// UPDATE SAAT TANGGAL GANTI
datePicker.addEventListener("change", updateTotal);

// HITUNG TOTAL
function calculateTotal() {

  const selectedDate = new Date(datePicker.value);
  selectedDate.setHours(23, 59, 59, 999);

  // GANTI SESUAI AWAL NABUNG
  const startDate = new Date("2026-04-13");

  let total = 0;

  let current = new Date(startDate);

  // TAMBAH 28K SETIAP SENIN
  while (current <= selectedDate) {

    if (current.getDay() === 1) {
      total += 28000;
    }

    current.setDate(current.getDate() + 1);
  }

  // TRANSAKSI MANUAL
  transactions.forEach((t) => {
    const tDate = new Date(t.date);

    if (tDate <= selectedDate) {
      total += t.amount;
    }
  });

  return total;
}

// UPDATE UI
function updateTotal() {
  totalText.innerText =
    "Rp " + calculateTotal().toLocaleString("id-ID");

  renderHistory();
}

// RIWAYAT
function renderHistory() {

  historyDiv.innerHTML = "";

  if (transactions.length === 0) {
    historyDiv.innerHTML = `
      <p style="text-align:center;color:white;">
        Belum ada transaksi
      </p>
    `;
    return;
  }

  const selectedDate = new Date(datePicker.value);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedDay = selectedDate.getDate();

  // 🔥 filter berdasarkan tanggal lokal
  const filtered = transactions.filter((t) => {

    const tDate = new Date(t.date);

    return (
      tDate.getFullYear() === selectedYear &&
      tDate.getMonth() === selectedMonth &&
      tDate.getDate() === selectedDay
    );
  });

  // kalau kosong
  if (filtered.length === 0) {
    historyDiv.innerHTML = `
      <p style="text-align:center;color:white;">
        Tidak ada riwayat di tanggal ini
      </p>
    `;
    return;
  }

  filtered.reverse().forEach((t) => {

    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <strong style="color:${t.amount > 0 ? '#44b36b' : '#ff4f93'}">
        ${t.amount > 0 ? '+' : '-'}
        Rp ${Math.abs(t.amount).toLocaleString("id-ID")}
      </strong>

      <br><br>

      <small>${t.reason || "-"}</small>
    `;

    historyDiv.appendChild(div);
  });
}
// MENU
window.openMenu = () => {
  document.getElementById("menuModal")
    .classList.remove("hidden");
};

window.closeMenu = () => {
  document.getElementById("menuModal")
    .classList.add("hidden");
};

// FORM
window.openForm = (type) => {

  currentType = type;

  closeMenu();

  document.getElementById("formModal")
    .classList.remove("hidden");

  document.getElementById("formTitle").innerText =
    type === "tambah"
      ? "Tambah Saldo"
      : "Kurang Saldo";
};

window.closeForm = () => {
  document.getElementById("formModal")
    .classList.add("hidden");
};

// SIMPAN DATA
window.saveData = async () => {

  let amount =
    document.getElementById("amount").value;

  const reason =
    document.getElementById("reason").value;

  if (amount === "") {
    alert("Isi jumlah dulu!");
    return;
  }

  amount = parseInt(amount);

  if (currentType === "kurang") {
    amount = -Math.abs(amount);
  } else {
    amount = Math.abs(amount);
  }

  await addDoc(collection(db, "transactions"), {
    amount,
    reason,
    date: new Date().toISOString()
  });

  // RESET INPUT
  document.getElementById("amount").value = "";
  document.getElementById("reason").value = "";

  closeForm();
};