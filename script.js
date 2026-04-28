import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// 🔥 CONFIG KAMU
const firebaseConfig = {
  apiKey: "AIzaSyC4JhAcSMtmmN4RVGKDMG1yxQr-usp_Lxg",
  authDomain: "okhee-savings.firebaseapp.com",
  projectId: "okhee-savings",
  storageBucket: "okhee-savings.firebasestorage.app",
  messagingSenderId: "553829927053",
  appId: "1:553829927053:web:f873c5d2320a9864f63ac4"
};

// INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const datePicker = document.getElementById("datePicker");
const totalText = document.getElementById("total");
const historyDiv = document.getElementById("history");

let transactions = [];
let currentType = "tambah";

datePicker.valueAsDate = new Date();
datePicker.addEventListener("change", updateTotal);

// 🔥 REALTIME DATABASE
onSnapshot(collection(db, "transactions"), (snapshot) => {
  transactions = [];
  snapshot.forEach(doc => {
    transactions.push(doc.data());
  });
  updateTotal();
});

// HITUNG TOTAL
function calculateTotal() {
  const startDate = new Date("2026-04-01");
  const selectedDate = new Date(datePicker.value);
  selectedDate.setHours(23,59,59,999);

  const weeks = Math.floor((selectedDate - startDate) / (7*24*60*60*1000));
  let total = weeks * 28000;

  transactions.forEach(t => {
    const tDate = new Date(t.date);
    if (tDate.getTime() <= selectedDate.getTime()) {
      total += t.amount;
    }
  });

  return total;
}

// UPDATE UI
function updateTotal() {
  totalText.innerText = "Rp " + calculateTotal().toLocaleString();
  renderHistory();
}

// RIWAYAT
function renderHistory() {
  historyDiv.innerHTML = "";

  if (transactions.length === 0) {
    historyDiv.innerHTML = "<p style='text-align:center;color:white;'>Belum ada transaksi</p>";
    return;
  }

  transactions.slice().reverse().forEach(t => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <strong style="color:${t.amount > 0 ? 'green' : 'red'}">
        ${t.amount > 0 ? '+' : ''}${t.amount}
      </strong><br>
      <small>${t.reason || "-"}</small>
    `;

    historyDiv.appendChild(div);
  });
}

// MENU & FORM
window.openMenu = () => document.getElementById("menuModal").classList.remove("hidden");
window.closeMenu = () => document.getElementById("menuModal").classList.add("hidden");

window.openForm = (type) => {
  currentType = type;
  closeMenu();
  document.getElementById("formModal").classList.remove("hidden");
  document.getElementById("formTitle").innerText =
    type === "tambah" ? "Tambah Saldo" : "Kurang Saldo";
};

window.closeForm = () => {
  document.getElementById("formModal").classList.add("hidden");
};

// SIMPAN KE FIREBASE
window.saveData = async () => {
  let amount = document.getElementById("amount").value;
  const reason = document.getElementById("reason").value;

  if (amount === "") {
    alert("Isi jumlah dulu!");
    return;
  }

  amount = parseInt(amount);
  if (currentType === "kurang") {
    amount = -Math.abs(amount);
  }

  await addDoc(collection(db, "transactions"), {
    amount,
    reason,
    date: new Date().toISOString()
  });

  document.getElementById("amount").value = "";
  document.getElementById("reason").value = "";

  closeForm();
};