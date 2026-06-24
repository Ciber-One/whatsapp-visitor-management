import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Residents from "@/pages/Residents";
import Passes from "@/pages/Passes";
import GuardVerification from "@/pages/GuardVerification";
import Logs from "@/pages/Logs";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/passes" element={<Passes />} />
          <Route path="/verify" element={<GuardVerification />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
