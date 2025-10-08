import { useState } from "react";
import "../App.css";

export default function RegisterForm({
   onRegister,
   connected,
}: {
   onRegister: (name: string) => Promise<void> | void;
   connected: boolean;
}) {
   const [name, setName] = useState("");

   const handleRegister = async () => {
      try {
         await onRegister(name);
      } catch (e: any) {
         alert(e?.message || String(e));
      }
   };

   return (
      <div className="char-row">
         <input
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!connected}
         />
         <button className="btn" onClick={handleRegister} disabled={!connected}>
            Register
         </button>
      </div>
   );
}
