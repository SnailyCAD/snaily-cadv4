import * as React from "react";
import { useState } from "react"; // Add this line
import { Layout } from "components/Layout";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { defaultPermissions, Permissions } from "@snailycad/permissions";

const DeploymentDocumentation = () => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen4, setIsOpen4] = useState(false); // Removed state for isOpen3

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const fieldStyle = {
    width: "50%",
    backgroundColor: "#333",
    color: "white",
    margin: "4px 0",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "0.375rem", // rounded-md
    border: "2px solid #4B5563", // dark:border-quinary
  };

  const fieldHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    fontSize: "20px",
    fontWeight: "bold", // Corrected font property
  };

  const arrowStyle = {
    fontSize: "1.5em",
  };

  const iframeStyle = {
    width: "100%", // Corrected width style
    height: "1600px",
    border: "none",
    marginTop: "10px",
  };

  return (
    <Layout permissions={{ permissions: [Permissions.EmsFd] }} className="dark:text-white">
      <div style={{ textAlign: "center", fontSize: "25px", fontWeight: "bold", margin: "10px 0" }}>
        Einsatz Dokumentation
      </div>{" "}
      {/* Corrected inline style */}
      <div style={containerStyle}>
        <div style={fieldStyle} onClick={() => setIsOpen1(!isOpen1)}>
          <div style={fieldHeaderStyle}>
            Feuerwehr
            <span style={arrowStyle}>{isOpen1 ? "▲" : "▼"}</span>
          </div>
          {isOpen1 && (
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScDZMLZbjmPiI2bInIWNG659DxuZy-zFBtixjurL6XIymCpFQ/viewform?usp=dialog"
              style={iframeStyle}
            />
          )}
        </div>
        <div style={fieldStyle} onClick={() => setIsOpen2(!isOpen2)}>
          <div style={fieldHeaderStyle}>
            Rettungsdienst
            <span style={arrowStyle}>{isOpen2 ? "▲" : "▼"}</span>
          </div>
          {isOpen2 && (
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSdnPFEdjk6MI8NTerp_QhZBz_sKRL1AdceCoDPySmnr9hJNbw/viewform?usp=dialog"
              style={iframeStyle}
            />
          )}
        </div>
        {/* Removed the third collapsible field */}
        <div style={fieldStyle} onClick={() => setIsOpen4(!isOpen4)}>
          {" "}
          {/* Corrected onClick handler */}
          <div style={fieldHeaderStyle}>
            Rettungsdienst LNA & ORGL
            <span style={arrowStyle}>{isOpen4 ? "▲" : "▼"}</span>
          </div>
          {isOpen4 && (
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScnfSrTecXE6FSdGaE-heyGBPKJGHJlHg2I6xgU8pTpwZJjDg/viewform?usp=dialog"
              style={iframeStyle}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DeploymentDocumentation;

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
