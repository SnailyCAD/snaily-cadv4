import "dotenv/config";
import process from "node:process";

function urlToDomain(fullUrl) {
  try {
    const url = new URL(fullUrl);

    if (url.hostname === "api") {
      return "localhost";
    }

    return `${url.hostname}`;
  } catch {
    return "localhost";
  }
}

const domain = urlToDomain(process.env.NEXT_PUBLIC_PROD_ORIGIN);

const nextConfigPath = "";
