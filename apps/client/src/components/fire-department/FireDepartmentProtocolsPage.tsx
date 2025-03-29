import React, { useEffect, useState } from "react";
import { usePermissions } from "hooks/usePermissions";
import { fetchProtocols, deleteProtocol } from "lib/api";

export function FireDepartmentProtocolsPage() {
  const { hasPermission } = usePermissions();
  const [protocols, setProtocols] = useState([]);
  const [category, setCategory] = useState("einsatzprotokoll_feuerwehr");

  useEffect(() => {
    fetchProtocols(category).then(setProtocols);
  }, [category]);

  const handleDelete = (id: number) => {
    if (!hasPermission("ManageFireDepartmentProtocols")) return;
    deleteProtocol(category, id).then(() => {
      setProtocols((prev) => prev.filter((p) => p.id !== id));
    });
  };

  return (
    <div>
      <h1>Einsatzdokumentation</h1>
      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="einsatzprotokoll_feuerwehr">Feuerwehr</option>
        <option value="einsatzprotokoll_rettungsdienst">Rettungsdienst</option>
        <option value="einsatzprotokoll_lna_orgl">LNA & ORGL</option>
      </select>
      <ul>
        {protocols.map((protocol) => (
          <li key={protocol.id}>
            {protocol.datum} - {protocol.einsatzort}
            {hasPermission("ManageFireDepartmentProtocols") && (
              <button onClick={() => handleDelete(protocol.id)}>Löschen</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
