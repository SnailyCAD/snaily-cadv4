import * as React from "react";
import { useState } from "react"; // Add this line
import { Layout } from "components/Layout";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { defaultPermissions, Permissions } from "@snailycad/permissions";

interface Props {
  session: GetUserData | null;
}

const EmergencyCostCalculator = () => {
  const [data, setData] = useState({
    ktw: 0,
    rtw: 0,
    nef: 0,
    loeschzuege: 0,
    loeschzuegeMinutes: [] as number[],
    loeschfahrzeug: 0,
    loeschfahrzeugMinutes: [] as number[],
    ruestwagen: 0,
    ruestwagenMinutes: [] as number[],
    drehleiter: 0,
    drehleiterMinutes: [] as number[],
    wechsellader: 0,
    wechselladerMinutes: [] as number[],
    hoehenrettung: 0,
    hoehenrettungMinutes: [] as number[],
    abrollbehaelter: 0,
    abrollbehaelterMinutes: [] as number[],
    fuehrungsfahrzeuge: 0,
    fuehrungsfahrzeugeMinutes: [] as number[],
    bf: 0,
    bfMinutes: [] as number[],
    ff: 0,
    ffMinutes: [] as number[],
  });

  const [visibleSections, setVisibleSections] = useState({
    section1: false,
    section2: false,
    section3: false,
    section4: false,
  });

  const costs = {
    ktw: 228.7,
    rtw: 599.8,
    nef: 186.5,
    loeschzug: 1.7,
    loeschfahrzeug: 1.5,
    ruestwagen: 2.08,
    drehleiter: 3.0,
    wechsellader: 3.25,
    hoehenrettung: 3.73,
    abrollbehaelter: 2.31,
    fuehrungsfahrzeug: 0.62,
    bf: 0.69,
    ff: 0.44,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Math.max(0, Number(value)); // Prevent negative values
    setData({ ...data, [name]: numericValue });
  };

  const handleMinutesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: string,
  ) => {
    const { value } = e.target;
    const numericValue = Math.max(0, Number(value)); // Prevent negative values
    const updatedMinutes = [...(data[field as keyof typeof data] as number[])];
    updatedMinutes[index] = numericValue;
    setData({ ...data, [field]: updatedMinutes });
  };

  const toggleSection = (section: string) => {
    setVisibleSections({
      ...visibleSections,
      [section]: !visibleSections[section],
    });
  };

  const calculateTotal = () => {
    // Bereich 1 (Fixkostenpauschale)
    const total1 = data.ktw * costs.ktw + data.rtw * costs.rtw + data.nef * costs.nef;

    // Bereich 2, 3, und 4 (pro Minute)
    const total2 =
      data.loeschzuegeMinutes.reduce((acc, minutes) => acc + minutes * costs.loeschzug, 0) +
      data.loeschfahrzeugMinutes.reduce((acc, minutes) => acc + minutes * costs.loeschfahrzeug, 0) +
      data.ruestwagenMinutes.reduce((acc, minutes) => acc + minutes * costs.ruestwagen, 0) +
      data.drehleiterMinutes.reduce((acc, minutes) => acc + minutes * costs.drehleiter, 0) +
      data.wechselladerMinutes.reduce((acc, minutes) => acc + minutes * costs.wechsellader, 0) +
      data.hoehenrettungMinutes.reduce((acc, minutes) => acc + minutes * costs.hoehenrettung, 0) +
      data.abrollbehaelterMinutes.reduce(
        (acc, minutes) => acc + minutes * costs.abrollbehaelter,
        0,
      ) +
      data.fuehrungsfahrzeugeMinutes.reduce(
        (acc, minutes) => acc + minutes * costs.fuehrungsfahrzeug,
        0,
      ) +
      data.bfMinutes.reduce((acc, minutes) => acc + minutes * costs.bf, 0) +
      data.ffMinutes.reduce((acc, minutes) => acc + minutes * costs.ff, 0);

    return total1 + total2;
  };

  return (
    <Layout permissions={{ permissions: [Permissions.EmsFd] }} className="dark:text-white">
      <div
        className="rounded-md bg-gray-200/60 dark:border-quinary dark:bg-tertiary"
        style={{ padding: "20px", fontSize: "25px" }}
      >
        <h1 style={{ fontSize: "35px", textAlign: "center", color: "white", Fontweight: "bold" }}>
          Einsatzkostenrechner
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <table
            style={{
              margin: "0 auto",
              width: "50%",
              border: "3px solid rgb(99, 65, 65)",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={{ width: "90%" }}></th>
                <th style={{ width: "10%" }}></th>
              </tr>
            </thead>
            <tbody>
              {/* Bereich 1: Rettungsdienst */}
              <tr
                onClick={() => toggleSection("section1")}
                style={{ cursor: "pointer", backgroundColor: "#F2F5A9", color: "black" }}
              >
                <td colSpan={2}>
                  Rettungsdienst <span style={{ float: "right" }}>▼</span>
                </td>
              </tr>
              {visibleSections.section1 && (
                <>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>KTW</td>
                    <td>
                      <input
                        type="number"
                        name="ktw"
                        value={data.ktw}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>RTW</td>
                    <td>
                      <input
                        type="number"
                        name="rtw"
                        value={data.rtw}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>NEF</td>
                    <td>
                      <input
                        type="number"
                        name="nef"
                        value={data.nef}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                </>
              )}
              {/* Bereich 2: Feuerwehr */}
              <tr
                onClick={() => toggleSection("section2")}
                style={{ cursor: "pointer", backgroundColor: "#F2F5A9", color: "black" }}
              >
                <td colSpan={2}>
                  Feuerwehr Löschzüge <span style={{ float: "right" }}>▼</span>
                </td>
              </tr>
              {visibleSections.section2 && (
                <>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Anzahl Löschzüge</td>
                    <td>
                      <input
                        type="number"
                        name="loeschzuege"
                        value={data.loeschzuege}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.loeschzuege }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Löschzug</td>
                      <td>
                        <input
                          type="number"
                          value={data.loeschzuegeMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "loeschzuegeMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {/* Bereich 3: Fahrzeuge der Feuerwehr */}
              <tr
                onClick={() => toggleSection("section3")}
                style={{ cursor: "pointer", backgroundColor: "#F2F5A9", color: "black" }}
              >
                <td colSpan={2}>
                  Fahrzeuge der Feuerwehr <span style={{ float: "right" }}>▼</span>
                </td>
              </tr>
              {visibleSections.section3 && (
                <>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Löschfahrzeug</td>
                    <td>
                      <input
                        type="number"
                        name="loeschfahrzeug"
                        value={data.loeschfahrzeug}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.loeschfahrzeug }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Löschfahrzeug</td>
                      <td>
                        <input
                          type="number"
                          value={data.loeschfahrzeugMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "loeschfahrzeugMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Rüstwagen</td>
                    <td>
                      <input
                        type="number"
                        name="ruestwagen"
                        value={data.ruestwagen}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.ruestwagen }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Rüstwagen</td>
                      <td>
                        <input
                          type="number"
                          value={data.ruestwagenMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "ruestwagenMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Drehleiter</td>
                    <td>
                      <input
                        type="number"
                        name="drehleiter"
                        value={data.drehleiter}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.drehleiter }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Drehleiter</td>
                      <td>
                        <input
                          type="number"
                          value={data.drehleiterMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "drehleiterMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Wechsellader</td>
                    <td>
                      <input
                        type="number"
                        name="wechsellader"
                        value={data.wechsellader}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.wechsellader }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Wechsellader</td>
                      <td>
                        <input
                          type="number"
                          value={data.wechselladerMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "wechselladerMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Gerätewagen Höhenrettung</td>
                    <td>
                      <input
                        type="number"
                        name="hoehenrettung"
                        value={data.hoehenrettung}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.hoehenrettung }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Gerätewagen Höhenrettung</td>
                      <td>
                        <input
                          type="number"
                          value={data.hoehenrettungMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "hoehenrettungMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Abrollbehälter</td>
                    <td>
                      <input
                        type="number"
                        name="abrollbehaelter"
                        value={data.abrollbehaelter}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.abrollbehaelter }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Abrollbehälter</td>
                      <td>
                        <input
                          type="number"
                          value={data.abrollbehaelterMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "abrollbehaelterMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Führungsfahrzeuge</td>
                    <td>
                      <input
                        type="number"
                        name="fuehrungsfahrzeuge"
                        value={data.fuehrungsfahrzeuge}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.fuehrungsfahrzeuge }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Führungsfahrzeug</td>
                      <td>
                        <input
                          type="number"
                          value={data.fuehrungsfahrzeugeMinutes[index] || 0}
                          onChange={(e) =>
                            handleMinutesChange(e, index, "fuehrungsfahrzeugeMinutes")
                          }
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {/* Bereich 4: Personal */}
              <tr
                onClick={() => toggleSection("section4")}
                style={{ cursor: "pointer", backgroundColor: "#F2F5A9", color: "black" }}
              >
                <td colSpan={2}>
                  Personal der Feuerwehr <span style={{ float: "right" }}>▼</span>
                </td>
              </tr>
              {visibleSections.section4 && (
                <>
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Berufsfeuerwehr</td>
                    <td>
                      <input
                        type="number"
                        name="bf"
                        value={data.bf}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.bf }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Berufsfeuerwehr</td>
                      <td>
                        <input
                          type="number"
                          value={data.bfMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "bfMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#424242" }}>
                    <td>Freiwillige Feuerwehr</td>
                    <td>
                      <input
                        type="number"
                        name="ff"
                        value={data.ff}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "#848484", color: "white" }}
                      />
                    </td>
                  </tr>
                  {Array.from({ length: data.ff }).map((_, index) => (
                    <tr key={index} style={{ backgroundColor: "#6E6E6E" }}>
                      <td>Einsatz Minuten für {index + 1}. Freiwillige Feuerwehr</td>
                      <td>
                        <input
                          type="number"
                          value={data.ffMinutes[index] || 0}
                          onChange={(e) => handleMinutesChange(e, index, "ffMinutes")}
                          style={{ backgroundColor: "#848484", color: "white" }}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {/* Gesamtsumme */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2 style={{ fontSize: "25px", fontWeight: "bold" }}>Gesamtsumme</h2>
          <p style={{ fontSize: "25px" }}>{calculateTotal().toFixed(2)} €</p>
        </div>
      </div>
      <div
        className="rounded-md bg-gray-200/60 dark:border-quinary dark:bg-tertiary"
        style={{ textAlign: "center", marginTop: "30px" }}
      >
        <p style={{ fontSize: "30px", fontWeight: "bold", color: "red" }}>
          Information zur Abrechnung
        </p>
        <p style={{ fontSize: "20px" }}>
          Privatrechnungen müssen direkt an die Person gestellt werden
        </p>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLScVM-HYWQHblMgbiTLTQczXV4h_q0kf0Rr-Ku1zNb4obejVOQ/viewform"
          width="50%"
          height="1250"
          frameBorder="0"
          allowFullScreen
          style={{ display: "block", margin: "20px auto" }} // Center the iframe
        ></iframe>
      </div>
    </Layout>
  );
};

export default EmergencyCostCalculator;

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);

  return {
    props: {
      session: user,
      messages: {
        ...(await getTranslations(
          ["leo", "ems-fd", "citizen", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
